import React, { useContext, useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { AppContext } from '../context/AppContext';
import {
  Plus,
  Minus,
  Navigation,
  ArrowDownUp,
  Accessibility,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  Volume2,
  X
} from 'lucide-react';
import {
  CHENNAI_COORDINATES,
  CHENNAI_METRO_LINES,
  CHENNAI_ACCESSIBILITY_FEATURES,
  CHENNAI_CANDIDATE_ROUTES,
  getStationAccessibilityData
} from '../utils/routing';

// Open-source MapLibre raster style (CartoDB Voyager) for 100% offline/demo resilience
const FALLBACK_MAP_STYLE = {
  version: 8,
  sources: {
    'voyager-tiles': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
        'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
        'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png'
      ],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors © CARTO'
    }
  },
  layers: [
    {
      id: 'voyager-layer',
      type: 'raster',
      source: 'voyager-tiles',
      minzoom: 0,
      maxzoom: 20
    }
  ]
};

export function getCoordinatesForLocation(locName) {
  if (!locName) return [80.2707, 13.0827];
  const name = String(locName).toLowerCase();
  if (name.includes('central')) return [80.2707, 13.0827];
  if (name.includes('egmore')) return [80.2609, 13.0732];
  if (name.includes('nagar') || name.includes('t. nagar')) return [80.2341, 13.0418];
  if (name.includes('koyambedu') || name.includes('cmbt')) return [80.1948, 13.0694];
  if (name.includes('guindy')) return [80.2408, 13.0001];
  if (name.includes('tambaram')) return [80.1000, 12.9249];
  return [80.2707, 13.0827];
}

export function MapView() {
  const {
    origin,
    destination,
    selectedRouteKey,
    setSelectedRouteKey,
    selectedRoute,
    setCurrentView,
    handlePlayDirections,
    isPlayingAudio,
    routes,
    preferences
  } = useContext(AppContext);

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const accessMarkersRef = useRef([]);

  const [isAccessibilityLayerOn, setIsAccessibilityLayerOn] = useState(true);
  const [selectedStationPopup, setSelectedStationPopup] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize MapLibre Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: FALLBACK_MAP_STYLE,
      center: getCoordinatesForLocation(origin),
      zoom: 12.8,
      pitch: 15,
      attributionControl: false
    });

    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

    map.on('style.error', (e) => {
      console.warn('[MapLibre] Style failed to load:', e);
    });

    map.on('load', () => {
      mapRef.current = map;
      setMapLoaded(true);
      addMetroLines(map);
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      accessMarkersRef.current.forEach((m) => m.remove());
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Compute transformed route polyline coordinates connecting origin -> waypoints -> destination
  const getTransformedRouteCoords = (baseCoords, startPt, endPt) => {
    if (!baseCoords || baseCoords.length < 2) return [startPt, endPt];
    // If baseCoords already start near startPt and end near endPt, use exact OSRM/Metro geometry directly
    const firstPt = baseCoords[0];
    const lastPt = baseCoords[baseCoords.length - 1];
    const startDist = Math.hypot(firstPt[0] - startPt[0], firstPt[1] - startPt[1]);
    const endDist = Math.hypot(lastPt[0] - endPt[0], lastPt[1] - endPt[1]);

    if (startDist < 0.04 && endDist < 0.04) {
      return baseCoords;
    }

    const defaultOrigin = [80.2707, 13.0827];
    const defaultDest = [80.2408, 13.0001];
    const totalPts = baseCoords.length;
    const startDeltaX = startPt[0] - defaultOrigin[0];
    const startDeltaY = startPt[1] - defaultOrigin[1];
    const endDeltaX = endPt[0] - defaultDest[0];
    const endDeltaY = endPt[1] - defaultDest[1];

    return baseCoords.map((pt, idx) => {
      const t = totalPts > 1 ? idx / (totalPts - 1) : 0;
      const dx = (1 - t) * startDeltaX + t * endDeltaX;
      const dy = (1 - t) * startDeltaY + t * endDeltaY;
      return [pt[0] + dx, pt[1] + dy];
    });
  };

  // Render & update route polylines on map whenever routes, selection, or coordinates change
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;
    const routesData = routes || CHENNAI_CANDIDATE_ROUTES;
    const routeKeys = ['recommended', 'fastest', 'lowestCost'];
    const originCoords = getCoordinatesForLocation(origin);
    const destCoords = getCoordinatesForLocation(destination);

    routeKeys.forEach((key) => {
      const route = routesData[key];
      const sourceId = `route-source-${key}`;
      const layerId = `route-layer-${key}`;
      const casingId = `route-casing-${key}`;

      // Check if route is filtered out (e.g. stairs filter active on a route with stairs)
      const isFilteredOut =
        (preferences?.avoidStairs || preferences?.wheelchair) &&
        route &&
        (route.stairsCount > 0 || route.isStepFree === false);

      if (!route || isFilteredOut) {
        if (map.getLayer(casingId)) map.setLayoutProperty(casingId, 'visibility', 'none');
        if (map.getLayer(layerId)) map.setLayoutProperty(layerId, 'visibility', 'none');
        return;
      }

      const baseCoords = route.coordinates || CHENNAI_CANDIDATE_ROUTES[key]?.coordinates || [];
      const transformedCoords = getTransformedRouteCoords(baseCoords, originCoords, destCoords);

      const geojson = {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: transformedCoords
        }
      };

      if (map.getSource(sourceId)) {
        map.getSource(sourceId).setData(geojson);
      } else {
        map.addSource(sourceId, {
          type: 'geojson',
          data: geojson
        });

        // Glow / Casing Layer for active selection
        map.addLayer({
          id: casingId,
          type: 'line',
          source: sourceId,
          layout: { 'line-join': 'round', 'line-cap': 'round', 'visibility': 'visible' },
          paint: {
            'line-color': '#1AC8A0',
            'line-width': key === selectedRouteKey ? 9 : 0,
            'line-opacity': key === selectedRouteKey ? 0.6 : 0
          }
        });

        // Main Polyline Layer
        map.addLayer({
          id: layerId,
          type: 'line',
          source: sourceId,
          layout: { 'line-join': 'round', 'line-cap': 'round', 'visibility': 'visible' },
          paint: {
            'line-color': route.color || (key === 'recommended' ? '#1A5C8D' : key === 'fastest' ? '#5A9FD4' : '#64748B'),
            'line-width': key === selectedRouteKey ? 6 : 3.5,
            'line-opacity': key === selectedRouteKey ? 0.95 : 0.4,
            ...(key === 'lowestCost' ? { 'line-dasharray': [2, 2] } : {})
          }
        });

        map.on('click', layerId, () => {
          setSelectedRouteKey(key);
        });

        map.on('mouseenter', layerId, () => {
          map.getCanvas().style.cursor = 'pointer';
        });

        map.on('mouseleave', layerId, () => {
          map.getCanvas().style.cursor = '';
        });
      }

      if (map.getLayer(casingId)) map.setLayoutProperty(casingId, 'visibility', 'visible');
      if (map.getLayer(layerId)) map.setLayoutProperty(layerId, 'visibility', 'visible');

      const isActive = key === selectedRouteKey;
      if (map.getLayer(layerId)) {
        map.setPaintProperty(layerId, 'line-width', isActive ? 6 : 3.5);
        map.setPaintProperty(layerId, 'line-opacity', isActive ? 0.95 : 0.4);
      }
      if (map.getLayer(casingId)) {
        map.setPaintProperty(casingId, 'line-width', isActive ? 9 : 0);
        map.setPaintProperty(casingId, 'line-opacity', isActive ? 0.6 : 0);
      }
    });

    // Fit map bounds to active selected route
    const activeRouteData = routesData[selectedRouteKey] || routesData.recommended;
    if (activeRouteData) {
      const activeBaseCoords = activeRouteData.coordinates || CHENNAI_CANDIDATE_ROUTES[selectedRouteKey]?.coordinates || [];
      const activeCoords = getTransformedRouteCoords(activeBaseCoords, originCoords, destCoords);
      const bounds = new maplibregl.LngLatBounds();
      activeCoords.forEach((pt) => bounds.extend(pt));
      map.fitBounds(bounds, {
        padding: { top: 60, bottom: 60, left: 60, right: 60 },
        maxZoom: 15,
        duration: 800
      });
    }
  }, [mapLoaded, routes, selectedRouteKey, origin, destination, preferences]);

  // Update Markers (Origin, Destination, Stations, Accessibility)
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    accessMarkersRef.current.forEach((m) => m.remove());
    accessMarkersRef.current = [];

    const map = mapRef.current;

    // 1. Origin Marker
    const originCoords = getCoordinatesForLocation(origin);
    const originEl = document.createElement('div');
    originEl.className = 'origin-marker-container cursor-pointer transition-transform hover:scale-105';
    originEl.innerHTML = `
      <div class="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl shadow-lg border-2 border-[#1F3A5F]">
        <div class="w-7 h-7 rounded-full bg-[#1F3A5F] text-white flex items-center justify-center font-bold shadow-xs">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h8m-8 4h8m-4 4h4M6 3h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2z" />
          </svg>
        </div>
        <div>
          <div class="text-xs font-black text-slate-900 leading-tight">${origin || 'Chennai Central'}</div>
          <div class="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
            <span>●</span> Step-free ramp
          </div>
        </div>
      </div>
    `;
    originEl.onclick = () => {
      const data = getStationAccessibilityData(origin || 'chennai central');
      setSelectedStationPopup(data);
    };
    const originMarker = new maplibregl.Marker({ element: originEl, anchor: 'bottom' })
      .setLngLat(originCoords)
      .addTo(map);
    markersRef.current.push(originMarker);

    // 2. Destination Marker
    const destCoords = getCoordinatesForLocation(destination);
    const destEl = document.createElement('div');
    destEl.className = 'dest-marker-container cursor-pointer transition-transform hover:scale-105';
    destEl.innerHTML = `
      <div class="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl shadow-lg border-2 border-red-600">
        <div class="w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center font-bold shadow-xs">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
          </svg>
        </div>
        <div>
          <div class="text-xs font-black text-slate-900 leading-tight">${destination || 'Guindy Metro'}</div>
          <div class="text-[10px] text-slate-500 font-medium flex items-center gap-1">
            <span class="text-emerald-600 font-bold">●</span> Verified Elevator
          </div>
        </div>
      </div>
    `;
    destEl.onclick = () => {
      const data = getStationAccessibilityData(destination || 'guindy');
      setSelectedStationPopup(data);
    };
    const destMarker = new maplibregl.Marker({ element: destEl, anchor: 'bottom' })
      .setLngLat(destCoords)
      .addTo(map);
    markersRef.current.push(destMarker);

    // 3. Intermediate Station Nodes
    const stations = [
      { name: 'Egmore Station', coords: CHENNAI_COORDINATES.egmore, type: 'metro' },
      { name: 'Saidapet Metro', coords: CHENNAI_COORDINATES.saidapet, type: 'metro' },
      { name: 'T. Nagar Hub', coords: CHENNAI_COORDINATES.tNagar, type: 'bus' }
    ];

    stations.forEach((st) => {
      const stEl = document.createElement('div');
      stEl.className = 'station-node-marker cursor-pointer transition-transform hover:scale-110';
      if (st.type === 'metro') {
        stEl.innerHTML = `
          <div class="w-6 h-6 rounded-lg bg-[#1AC8A0] border-2 border-white shadow-md flex items-center justify-center text-slate-900" title="${st.name}">
            <span class="text-[9px] font-black">M</span>
          </div>
        `;
      } else {
        stEl.innerHTML = `
          <div class="w-5 h-5 rounded-md bg-[#1F3A5F] border-2 border-white shadow-sm flex items-center justify-center text-white" title="${st.name}">
            <span class="text-[8px] font-bold">B</span>
          </div>
        `;
      }
      stEl.onclick = () => {
        const data = getStationAccessibilityData(st.name);
        setSelectedStationPopup(data);
      };
      const stMarker = new maplibregl.Marker({ element: stEl, anchor: 'center' })
        .setLngLat(st.coords)
        .addTo(map);
      markersRef.current.push(stMarker);
    });

    // 4. Accessibility Overlay Features
    CHENNAI_ACCESSIBILITY_FEATURES.forEach((feature) => {
      const el = document.createElement('div');
      el.className = `accessibility-marker ${feature.type} cursor-pointer transition-all duration-300 transform hover:scale-125`;
      el.style.display = isAccessibilityLayerOn ? 'flex' : 'none';

      let iconHtml = '';
      let badgeStyle = '';

      if (feature.type === 'elevator') {
        badgeStyle = 'bg-[#064E3B] text-[#1AC8A0] border-emerald-400';
        iconHtml = `
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        `;
      } else if (feature.type === 'ramp') {
        badgeStyle = 'bg-emerald-600 text-white border-white';
        iconHtml = `
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 19H5L19 5v14z" />
          </svg>
        `;
      } else if (feature.type === 'entrance') {
        badgeStyle = 'bg-[#1AC8A0] text-slate-900 border-white';
        iconHtml = `
          <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="4" r="2"/>
            <path d="M19 13v-2c-1.54.02-3.09-.75-4.07-1.83l-1.29-1.43c-.17-.19-.38-.34-.61-.45-.44-.22-.96-.28-1.45-.16L8 8v4h2V9.38l1.45-.48c.19 1.13.79 2.14 1.69 2.82L11 14.5c-2.48 0-4.5 2.02-4.5 4.5s2.02 4.5 4.5 4.5 4.5-2.02 4.5-4.5h-2c0 1.38-1.12 2.5-2.5 2.5S8.5 20.38 8.5 19s1.12-2.5 2.5-2.5c.34 0 .66.07.96.2l1.64-2.87c.85.74 1.93 1.17 3.09 1.17h2.31z"/>
          </svg>
        `;
      } else if (feature.type === 'stairs') {
        badgeStyle = 'bg-red-500 text-white border-white ring-2 ring-red-300';
        iconHtml = `
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 5h-4v4h-4v4H7v4H3" />
          </svg>
        `;
      }

      el.innerHTML = `
        <div class="w-6 h-6 rounded-lg ${badgeStyle} border shadow-md flex items-center justify-center" title="${feature.name}">
          ${iconHtml}
        </div>
      `;

      el.onclick = () => {
        setSelectedStationPopup({
          name: feature.name,
          type: feature.type.toUpperCase(),
          station: feature.station,
          status: feature.status,
          details: feature.details,
          coordinates: feature.coordinates,
          isFeature: true
        });
      };

      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat(feature.coordinates)
        .addTo(map);

      accessMarkersRef.current.push(marker);
    });
  }, [mapLoaded, isAccessibilityLayerOn, origin, destination]);

  // Toggle Accessibility Layer visibility
  const toggleAccessibilityLayer = () => {
    const nextState = !isAccessibilityLayerOn;
    setIsAccessibilityLayerOn(nextState);
    accessMarkersRef.current.forEach((marker) => {
      const el = marker.getElement();
      if (el) {
        el.style.display = nextState ? 'flex' : 'none';
      }
    });
  };

  // Add Chennai Metro Lines (Background)
  const addMetroLines = (map) => {
    if (!map.getSource('metro-blue-line')) {
      map.addSource('metro-blue-line', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: CHENNAI_METRO_LINES.blueLine.coordinates
          }
        }
      });
      map.addLayer({
        id: 'metro-blue-line-layer',
        type: 'line',
        source: 'metro-blue-line',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#0284C7',
          'line-width': 3,
          'line-opacity': 0.35
        }
      });
    }

    if (!map.getSource('metro-green-line')) {
      map.addSource('metro-green-line', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: CHENNAI_METRO_LINES.greenLine.coordinates
          }
        }
      });
      map.addLayer({
        id: 'metro-green-line-layer',
        type: 'line',
        source: 'metro-green-line',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#10B981',
          'line-width': 2.5,
          'line-opacity': 0.35
        }
      });
    }
  };

  // Zoom In / Out Handlers
  const handleZoomIn = () => {
    if (mapRef.current) mapRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapRef.current) mapRef.current.zoomOut();
  };

  const handleCenterMap = () => {
    if (mapRef.current) {
      const activeRouteData = (routes || CHENNAI_CANDIDATE_ROUTES)[selectedRouteKey] || routes?.recommended;
      const activeBaseCoords = activeRouteData?.coordinates || CHENNAI_CANDIDATE_ROUTES[selectedRouteKey]?.coordinates || [];
      const originCoords = getCoordinatesForLocation(origin);
      const destCoords = getCoordinatesForLocation(destination);
      const activeCoords = getTransformedRouteCoords(activeBaseCoords, originCoords, destCoords);
      const bounds = new maplibregl.LngLatBounds();
      activeCoords.forEach((pt) => bounds.extend(pt));
      mapRef.current.fitBounds(bounds, {
        padding: { top: 60, bottom: 60, left: 60, right: 60 },
        maxZoom: 15,
        duration: 800
      });
    }
  };

  return (
    <div className="relative w-full h-full min-h-[420px] bg-slate-100 rounded-2xl overflow-hidden shadow-sm border border-slate-200 flex flex-col justify-between">
      {/* MapLibre Map Container */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

      {/* TOP OVERLAYS: Live Route Status & Voice Guidance */}
      <div className="z-10 flex items-center justify-between p-3.5 pointer-events-auto gap-2">
        {/* Live Route Pill */}
        <div className="bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-md border border-slate-200 flex items-center gap-2 max-w-[70%]">
          <div className="w-2.5 h-2.5 rounded-full bg-[#1AC8A0] animate-ping shrink-0" />
          <div className="truncate">
            <span className="text-xs font-black text-[#1F3A5F] block truncate">
              {origin} → {destination}
            </span>
            <span className="text-[10px] text-slate-500 font-semibold">
              {selectedRoute?.durationText || '38 min'} • {selectedRoute?.fareText || '₹25'}
            </span>
          </div>
        </div>

        {/* Action Buttons: Accessibility Layer Toggle & Voice Guidance */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleAccessibilityLayer}
            className={`px-3 py-2 rounded-xl text-xs font-bold shadow-md border transition-all flex items-center gap-1.5 ${isAccessibilityLayerOn
              ? 'bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50'
              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            title="Toggle Accessibility Layer"
          >
            {isAccessibilityLayerOn ? (
              <>
                <Eye className="w-4 h-4 text-emerald-600" />
                <span className="hidden sm:inline">Access Layer ON</span>
              </>
            ) : (
              <>
                <EyeOff className="w-4 h-4 text-slate-400" />
                <span className="hidden sm:inline">Access Layer OFF</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              if (handlePlayDirections) {
                handlePlayDirections();
              } else {
                setCurrentView('assisted');
              }
            }}
            className={`text-xs font-bold px-3 py-2 rounded-xl shadow-md transition-all flex items-center gap-1.5 ${isPlayingAudio
              ? 'bg-[#1AC8A0] text-slate-900 animate-pulse'
              : 'bg-[#1F3A5F] text-[#1AC8A0] hover:bg-[#132A4A]'
              }`}
            title="Voice guidance directions"
          >
            <Volume2 className="w-4 h-4" />
            <span className="hidden sm:inline">{isPlayingAudio ? 'Speaking...' : 'Voice Guidance'}</span>
          </button>
        </div>
      </div>

      {/* MAP CONTROLS (Bottom Right) */}
      <div className="z-10 ml-auto mr-3.5 mb-3.5 space-y-2 pointer-events-auto flex flex-col items-end">
        {/* Accessibility Features Quick Legend Badge */}
        {isAccessibilityLayerOn && (
          <div className="bg-white/95 backdrop-blur-md p-2 rounded-xl shadow-md border border-slate-200 text-[10px] font-semibold text-slate-700 space-y-1 hidden sm:block">
            <div className="font-bold text-[#1F3A5F] border-b border-slate-100 pb-0.5">Accessibility Layer</div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
              <span>🛗 Elevators & 🛝 Ramps</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1AC8A0] inline-block" />
              <span>♿ Step-Free Gate</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
              <span>🪜 Stairs Warning</span>
            </div>
          </div>
        )}

        <div className="flex flex-col rounded-xl bg-white shadow-md border border-slate-200 overflow-hidden">
          <button
            onClick={handleZoomIn}
            className="p-2.5 hover:bg-slate-100 text-slate-700 transition-colors border-b border-slate-100"
            title="Zoom in"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2.5 hover:bg-slate-100 text-slate-700 transition-colors"
            title="Zoom out"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={handleCenterMap}
          className="p-2.5 rounded-xl bg-white shadow-md border border-slate-200 text-slate-700 hover:text-[#1F3A5F] hover:bg-slate-100 transition-colors flex items-center justify-center"
          title="Center route corridor"
        >
          <Navigation className="w-4 h-4 text-[#1F3A5F]" />
        </button>
      </div>

      {/* INTERACTIVE STATION / FEATURE ACCESSIBILITY POPUP CARD */}
      {selectedStationPopup && (
        <div className="absolute inset-x-3 bottom-3 sm:left-4 sm:right-auto sm:max-w-sm z-30 bg-white/98 backdrop-blur-md rounded-2xl shadow-xl border-2 border-slate-200 p-4 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-black text-[#1F3A5F]">{selectedStationPopup.name}</h3>
                {selectedStationPopup.verified && (
                  <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[9px] font-extrabold flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Verified
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {selectedStationPopup.type || selectedStationPopup.station}
              </p>
            </div>
            <button
              onClick={() => setSelectedStationPopup(null)}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Details Grid */}
          <div className="mt-3 space-y-2 text-xs">
            {selectedStationPopup.isFeature ? (
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="text-[11px] font-bold text-slate-800">
                  Status: <span className="text-emerald-700">{selectedStationPopup.status}</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">{selectedStationPopup.details}</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2 text-slate-700 font-medium text-[11px]">
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-1.5">
                    <ArrowDownUp className="w-3.5 h-3.5 text-[#1F3A5F]" />
                    <span>{selectedStationPopup.elevators || 0} Elevators</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-1.5">
                    <Accessibility className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{selectedStationPopup.ramps ? 'Ramp Ready' : 'No Ramp'}</span>
                  </div>
                  <div className="p-2 rounded-xl col-span-2 bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <span className="text-slate-500 font-normal">Step-Free Entry:</span>
                    <span className="font-bold text-emerald-800">
                      {selectedStationPopup.stepFreeEntrance || 'Gate 1'}
                    </span>
                  </div>
                </div>

                {selectedStationPopup.knownIssues && selectedStationPopup.knownIssues.length > 0 && (
                  <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[10px] flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span>{selectedStationPopup.knownIssues[0].details}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
