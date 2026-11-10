import React, { useContext, useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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
  X,
  Layers
} from 'lucide-react';
import {
  CHENNAI_COORDINATES,
  CHENNAI_METRO_LINES,
  CHENNAI_ACCESSIBILITY_FEATURES,
  CHENNAI_CANDIDATE_ROUTES,
  getStationAccessibilityData
} from '../utils/routing';
import {
  TRANSIT_MODES,
  ALL_TRANSIT_STATIONS,
  TRANSIT_CORRIDORS,
  getStationById
} from '../utils/transitExplorerData';

export function getCoordinatesForLocation(locName) {
  if (!locName) return [80.2707, 13.0827];
  const st = getStationById(locName);
  if (st && st.longitude && st.latitude) {
    return [st.longitude, st.latitude];
  }
  const name = String(locName).toLowerCase();
  const found = ALL_TRANSIT_STATIONS.find(
    (s) => s.name.toLowerCase() === name || s.name.toLowerCase().includes(name) || name.includes(s.name.toLowerCase())
  );
  if (found) {
    return [found.longitude, found.latitude];
  }
  if (name.includes('central')) return [80.2707, 13.0827];
  if (name.includes('egmore')) return [80.2609, 13.0732];
  if (name.includes('nagar') || name.includes('t. nagar')) return [80.2341, 13.0418];
  if (name.includes('koyambedu') || name.includes('cmbt')) return [80.1948, 13.0694];
  if (name.includes('guindy')) return [80.2408, 13.0001];
  if (name.includes('tambaram')) return [80.1200, 12.9249];
  if (name.includes('airport')) return [80.1636, 12.9815];
  if (name.includes('saidapet')) return [80.2281, 13.0232];
  if (name.includes('alandur')) return [80.2014, 13.0039];
  return [80.2707, 13.0827];
}

export function MapView() {
  const {
    origin,
    setOrigin,
    destination,
    setDestination,
    refreshRoutes,
    selectedRouteKey,
    setSelectedRouteKey,
    selectedRoute,
    setCurrentView,
    handlePlayDirections,
    isPlayingAudio,
    routes,
    routingMode,
    geoRoute,
    geoProfile,
    pedestrianFeatures,
    preferences,
    selectedPlace,
    setSelectedPlace,
    explorerActiveModes,
    toggleExplorerMode,
    selectedStation,
    setSelectedStation
  } = useContext(AppContext);

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersLayerRef = useRef(null);
  const accessMarkersLayerRef = useRef(null);
  const routeLayersRef = useRef({});
  const geoRouteLayerRef = useRef(null);
  const corridorLayersRef = useRef([]);

  const [isAccessibilityLayerOn, setIsAccessibilityLayerOn] = useState(true);
  const [selectedStationPopup, setSelectedStationPopup] = useState(null);
  const [showLegend, setShowLegend] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [tileError, setTileError] = useState(false);

  // Center map on selectedPlace when updated
  useEffect(() => {
    if (selectedPlace && mapRef.current) {
      const coords = selectedPlace.coordinates || getCoordinatesForLocation(selectedPlace.name);
      mapRef.current.flyTo([coords[1], coords[0]], 14.2, { duration: 0.8 });
      setSelectedStationPopup(selectedPlace);
    }
  }, [selectedPlace]);

  // Center map on selectedStation when updated from Transit Explorer
  useEffect(() => {
    if (selectedStation && mapRef.current) {
      mapRef.current.flyTo([selectedStation.latitude, selectedStation.longitude], 14.5, {
        duration: 0.8
      });
      setSelectedStationPopup(selectedStation);
    }
  }, [selectedStation]);

  // Initialize Leaflet Map using EveHub pattern & OpenStreetMap tiles
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const startCoords = getCoordinatesForLocation(origin);
    const startLatLng = [startCoords[1], startCoords[0]];

    const map = L.map(mapContainerRef.current, {
      center: startLatLng,
      zoom: 12.5,
      zoomControl: false,
      attributionControl: true,
      maxBounds: [
        [12.35, 79.35],
        [13.65, 80.55]
      ],
      maxBoundsViscosity: 0.8
    });

    // Add OpenStreetMap raster tile layer
    const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });

    tileLayer.on('tileerror', () => {
      setTileError(true);
    });

    tileLayer.addTo(map);

    // Create marker layers
    const markersGroup = L.layerGroup().addTo(map);
    const accessGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    accessMarkersLayerRef.current = accessGroup;

    mapRef.current = map;
    setMapLoaded(true);

    // Initial transit corridor lines
    addCorridorLines(map);

    // Invalidate size to ensure clean tile rendering
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
      accessMarkersLayerRef.current = null;
      routeLayersRef.current = {};
      geoRouteLayerRef.current = null;
      corridorLayersRef.current = [];
    };
  }, []);

  // Compute transformed route polyline coordinates connecting origin -> waypoints -> destination
  const getTransformedRouteCoords = (baseCoords, startPt, endPt) => {
    if (!baseCoords || baseCoords.length < 2) return [startPt, endPt];
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

  // Add transit corridor lines
  const addCorridorLines = (map) => {
    corridorLayersRef.current.forEach(({ polyline }) => {
      if (map.hasLayer(polyline)) map.removeLayer(polyline);
    });
    corridorLayersRef.current = [];

    TRANSIT_CORRIDORS.forEach((corr) => {
      if (corr.coordinates && corr.coordinates.length > 1) {
        const latLngs = corr.coordinates.map(([lng, lat]) => [lat, lng]);
        const isVisible = (explorerActiveModes || []).includes(corr.mode);
        const polyline = L.polyline(latLngs, {
          color: corr.color || '#263B68',
          weight: 3,
          opacity: isVisible ? 0.45 : 0,
          interactive: false
        }).addTo(map);

        corridorLayersRef.current.push({
          id: corr.id,
          mode: corr.mode,
          polyline
        });
      }
    });
  };

  // Update corridor visibility based on active explorer modes
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const active = explorerActiveModes || [];
    corridorLayersRef.current.forEach(({ mode, polyline }) => {
      const isVisible = active.includes(mode);
      polyline.setStyle({ opacity: isVisible ? 0.45 : 0 });
    });
  }, [mapLoaded, explorerActiveModes]);

  // Render & update route polylines on map whenever routes, selection, or coordinates change
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;
    const routesData = routes || CHENNAI_CANDIDATE_ROUTES;
    const routeKeys = ['recommended', 'fastest', 'lowestCost'];
    const originCoords = getCoordinatesForLocation(origin);
    const destCoords = getCoordinatesForLocation(destination);

    // 1. Handle Geographical Routing Mode (Walk / Bike / Drive)
    if (routingMode === 'geographical' && geoRoute?.coordinates?.length >= 2) {
      // Hide standard transit preview lines
      routeKeys.forEach((key) => {
        if (routeLayersRef.current[key]) {
          const { casing, line } = routeLayersRef.current[key];
          if (map.hasLayer(casing)) map.removeLayer(casing);
          if (map.hasLayer(line)) map.removeLayer(line);
        }
      });

      const geoLatLngs = geoRoute.coordinates.map(([lng, lat]) => [lat, lng]);

      if (!geoRouteLayerRef.current) {
        const casing = L.polyline(geoLatLngs, {
          color: '#60C4D4',
          weight: 9,
          opacity: 0.6,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(map);

        const line = L.polyline(geoLatLngs, {
          color: '#263B68',
          weight: 5,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(map);

        geoRouteLayerRef.current = { casing, line };
      } else {
        const { casing, line } = geoRouteLayerRef.current;
        casing.setLatLngs(geoLatLngs);
        line.setLatLngs(geoLatLngs);
        if (!map.hasLayer(casing)) casing.addTo(map);
        if (!map.hasLayer(line)) line.addTo(map);
      }

      const bounds = L.latLngBounds(geoLatLngs);
      map.fitBounds(bounds, {
        padding: [60, 60],
        maxZoom: 15
      });
      return;
    } else {
      // Hide geo route layer if not in geo mode
      if (geoRouteLayerRef.current) {
        const { casing, line } = geoRouteLayerRef.current;
        if (map.hasLayer(casing)) map.removeLayer(casing);
        if (map.hasLayer(line)) map.removeLayer(line);
      }
    }

    // 2. Handle Public Transit Route Polylines (Illustrative Preview / Real Timetable)
    routeKeys.forEach((key) => {
      const route = routesData[key];

      // Check if route is filtered out
      const isFilteredOut =
        (preferences?.avoidStairs || preferences?.wheelchair) &&
        route &&
        (route.stairsCount > 0 || route.isStepFree === false);

      if (!route || isFilteredOut) {
        if (routeLayersRef.current[key]) {
          const { casing, line } = routeLayersRef.current[key];
          if (map.hasLayer(casing)) map.removeLayer(casing);
          if (map.hasLayer(line)) map.removeLayer(line);
        }
        return;
      }

      const isReal = Boolean(route.isRealTimetable || route.routingMode === 'timetable');
      const baseCoords = route.coordinates || CHENNAI_CANDIDATE_ROUTES[key]?.coordinates || [];
      const transformedCoords =
        isReal && route.coordinates?.length >= 2
          ? route.coordinates
          : getTransformedRouteCoords(baseCoords, originCoords, destCoords);

      const latLngs = transformedCoords.map(([lng, lat]) => [lat, lng]);
      const isActive = key === selectedRouteKey;

      if (!routeLayersRef.current[key]) {
        const casing = L.polyline(latLngs, {
          color: '#60C4D4',
          weight: isActive ? 8 : 0,
          opacity: isActive ? 0.5 : 0,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(map);

        const line = L.polyline(latLngs, {
          color: route.color || (key === 'recommended' ? '#263B68' : key === 'fastest' ? '#60C4D4' : '#5B6E88'),
          weight: isActive ? 5.5 : 3.5,
          opacity: isActive ? 0.95 : 0.45,
          dashArray: key === 'lowestCost' ? '6, 6' : undefined,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(map);

        casing.on('click', () => setSelectedRouteKey(key));
        line.on('click', () => setSelectedRouteKey(key));

        routeLayersRef.current[key] = { casing, line };
      } else {
        const { casing, line } = routeLayersRef.current[key];
        casing.setLatLngs(latLngs);
        casing.setStyle({
          weight: isActive ? 8 : 0,
          opacity: isActive ? 0.5 : 0
        });
        if (!map.hasLayer(casing)) casing.addTo(map);

        line.setLatLngs(latLngs);
        line.setStyle({
          color: route.color || (key === 'recommended' ? '#263B68' : key === 'fastest' ? '#60C4D4' : '#5B6E88'),
          weight: isActive ? 5.5 : 3.5,
          opacity: isActive ? 0.95 : 0.45,
          dashArray: key === 'lowestCost' ? '6, 6' : undefined
        });
        if (!map.hasLayer(line)) line.addTo(map);
      }
    });

    // Fit map bounds to active selected route
    const activeRouteData = routesData[selectedRouteKey] || routesData.recommended;
    if (activeRouteData) {
      const isReal = Boolean(activeRouteData.isRealTimetable || activeRouteData.routingMode === 'timetable');
      const activeBaseCoords =
        activeRouteData.coordinates || CHENNAI_CANDIDATE_ROUTES[selectedRouteKey]?.coordinates || [];
      const activeCoords =
        isReal && activeRouteData.coordinates?.length >= 2
          ? activeRouteData.coordinates
          : getTransformedRouteCoords(activeBaseCoords, originCoords, destCoords);
      const activeLatLngs = activeCoords.map(([lng, lat]) => [lat, lng]);
      if (activeLatLngs.length > 0) {
        const bounds = L.latLngBounds(activeLatLngs);
        map.fitBounds(bounds, {
          padding: [60, 60],
          maxZoom: 15
        });
      }
    }
  }, [mapLoaded, routes, geoRoute, routingMode, selectedRouteKey, origin, destination, preferences]);

  // Update Markers (Origin, Destination, Stations, Accessibility)
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !markersLayerRef.current || !accessMarkersLayerRef.current) return;

    markersLayerRef.current.clearLayers();
    accessMarkersLayerRef.current.clearLayers();

    const map = mapRef.current;

    // 1. Origin Marker
    const isGeo = routingMode === 'geographical' && geoRoute;
    const originCoords =
      isGeo && geoRoute.origin?.coordinates ? geoRoute.origin.coordinates : getCoordinatesForLocation(origin);

    const originIcon = L.divIcon({
      className: '',
      html: `
        <div class="origin-marker-container cursor-pointer transition-transform hover:scale-105 select-none" style="display: inline-block;">
          <div class="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl shadow-md border-2 border-[#263B68] whitespace-nowrap">
            <div class="w-7 h-7 rounded-lg bg-[#263B68] text-white flex items-center justify-center font-bold shadow-xs">
              <svg class="w-4 h-4 text-[#60C4D4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h8m-8 4h8m-4 4h4M6 3h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2z" />
              </svg>
            </div>
            <div>
              <div class="text-xs font-black text-[#263B68] leading-tight">${origin || 'Chennai Central'}</div>
              <div class="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                <span>●</span> ${isGeo ? 'Origin Point' : 'Step-free ramp'}
              </div>
            </div>
          </div>
        </div>
      `,
      iconSize: [180, 48],
      iconAnchor: [90, 48]
    });

    const originMarker = L.marker([originCoords[1], originCoords[0]], {
      icon: originIcon,
      zIndexOffset: 1000
    });
    originMarker.on('click', () => {
      const data = getStationAccessibilityData(origin || 'chennai central');
      setSelectedStationPopup(data);
    });
    markersLayerRef.current.addLayer(originMarker);

    // 2. Destination Marker
    const destCoords =
      isGeo && geoRoute.destination?.coordinates
        ? geoRoute.destination.coordinates
        : getCoordinatesForLocation(destination);

    const destIcon = L.divIcon({
      className: '',
      html: `
        <div class="dest-marker-container cursor-pointer transition-transform hover:scale-105 select-none" style="display: inline-block;">
          <div class="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl shadow-md border-2 border-[#DC2626] whitespace-nowrap">
            <div class="w-7 h-7 rounded-lg bg-[#DC2626] text-white flex items-center justify-center font-bold shadow-xs">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
              </svg>
            </div>
            <div>
              <div class="text-xs font-black text-slate-900 leading-tight">${destination || 'Guindy Metro'}</div>
              <div class="text-[10px] text-[#5B6E88] font-medium flex items-center gap-1">
                <span class="text-emerald-700 font-bold">●</span> ${isGeo ? 'Destination Point' : 'Verified Elevator'}
              </div>
            </div>
          </div>
        </div>
      `,
      iconSize: [180, 48],
      iconAnchor: [90, 48]
    });

    const destMarker = L.marker([destCoords[1], destCoords[0]], {
      icon: destIcon,
      zIndexOffset: 1000
    });
    destMarker.on('click', () => {
      const data = getStationAccessibilityData(destination || 'guindy');
      setSelectedStationPopup(data);
    });
    markersLayerRef.current.addLayer(destMarker);

    // 2b. Intermediate Waypoints for Geographical Route
    if (isGeo && geoRoute.steps && geoRoute.steps.length > 2) {
      geoRoute.steps.slice(1, -1).forEach((step, idx) => {
        if (!step.coordinates) return;
        const wpIcon = L.divIcon({
          className: '',
          html: `
            <div class="waypoint-marker cursor-pointer transition-transform hover:scale-125">
              <div class="w-4 h-4 rounded-full bg-[#60C4D4] border-2 border-[#263B68] shadow-xs flex items-center justify-center text-[8px] font-black text-[#263B68]" title="${step.instruction}">
                ${idx + 1}
              </div>
            </div>
          `,
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });

        const wpMarker = L.marker([step.coordinates[1], step.coordinates[0]], {
          icon: wpIcon,
          zIndexOffset: 600
        });
        wpMarker.on('click', () => {
          setSelectedStationPopup({
            name: `Maneuver Step ${idx + 1}`,
            type: 'WAYPOINT',
            details: step.instruction,
            status: 'Waypoints',
            coordinates: step.coordinates,
            isFeature: true
          });
        });
        markersLayerRef.current.addLayer(wpMarker);
      });
    }

    // 3. Curated Transit Network Explorer Station & Hub Markers (140 Curated Locations)
    ALL_TRANSIT_STATIONS.forEach((st) => {
      if (!(explorerActiveModes || []).includes(st.mode)) return;

      const modeMeta = TRANSIT_MODES[st.mode];
      const markerColor = modeMeta?.color || '#263B68';

      const stIcon = L.divIcon({
        className: '',
        html: `
          <div class="station-node-marker cursor-pointer transition-transform hover:scale-125">
            <div style="background-color: ${markerColor}" class="w-6 h-6 rounded-lg text-white border-2 border-white shadow-xs flex items-center justify-center font-black text-[10px] relative" title="${st.name} (${st.code}) - ${st.modeLabel}">
              <span>${st.markerBadge}</span>
              ${st.stepFreeAccess ? '<span class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 border border-white rounded-full"></span>' : ''}
            </div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const stMarker = L.marker([st.latitude, st.longitude], {
        icon: stIcon,
        zIndexOffset: 400
      });

      stMarker.on('click', () => {
        if (setSelectedStation) setSelectedStation(st);
        setSelectedStationPopup(st);
        map.flyTo([st.latitude, st.longitude], 14.5, { duration: 0.6 });
      });

      markersLayerRef.current.addLayer(stMarker);
    });

    // 3b. Real Journey Transfer Nodes
    if (selectedRoute?.legs) {
      selectedRoute.legs.forEach((leg) => {
        if (leg.type === 'transfer' && leg.fromCoordinates) {
          const trIcon = L.divIcon({
            className: '',
            html: `
              <div class="transfer-node-marker cursor-pointer transition-transform hover:scale-125">
                <div class="px-2 py-0.5 rounded-md bg-[#263B68] text-[#60C4D4] border border-white shadow-xs flex items-center gap-1 text-[9px] font-bold" title="Transfer: ${leg.fromStopName}">
                  <span>⇄</span>
                  <span>Transfer</span>
                </div>
              </div>
            `,
            iconSize: [64, 22],
            iconAnchor: [32, 11]
          });

          const trMarker = L.marker([leg.fromCoordinates[1], leg.fromCoordinates[0]], {
            icon: trIcon,
            zIndexOffset: 700
          });

          trMarker.on('click', () => {
            setSelectedStationPopup({
              name: `Transfer Point: ${leg.fromStopName}`,
              type: 'INTERCHANGE',
              details: `Transfer walkway to ${leg.toStopName}. Duration: ${leg.durationMinutes} min (${leg.isStepFree ? 'Step-free' : 'Stairs present'}).`,
              status: leg.isStepFree ? 'Step-free' : 'Stairs present',
              coordinates: leg.fromCoordinates,
              isFeature: true
            });
          });

          markersLayerRef.current.addLayer(trMarker);
        }
      });
    }

    // 4. Pedestrian Infrastructure & Accessibility Overlay Features (7 Types)
    const combinedFeatures =
      pedestrianFeatures && pedestrianFeatures.length > 0
        ? pedestrianFeatures
        : CHENNAI_ACCESSIBILITY_FEATURES;

    combinedFeatures.forEach((feature) => {
      const statusRing =
        feature.status === 'verified'
          ? 'ring-2 ring-emerald-500 shadow-sm'
          : feature.status === 'provisional'
          ? 'ring-2 ring-amber-500 shadow-sm'
          : 'ring-2 ring-slate-400 shadow-sm';

      let iconHtml = '';
      let badgeStyle = '';

      if (feature.type === 'elevator') {
        badgeStyle = `bg-[#263B68] text-[#60C4D4] border-white ${statusRing}`;
        iconHtml = `
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        `;
      } else if (feature.type === 'ramp') {
        badgeStyle = `bg-emerald-700 text-white border-white ${statusRing}`;
        iconHtml = `
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 19H5L19 5v14z" />
          </svg>
        `;
      } else if (feature.type === 'entrance' || feature.type === 'step_free_entrance') {
        badgeStyle = `bg-[#10B981] text-white border-white ${statusRing}`;
        iconHtml = `
          <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 13v-2c-1.54.02-3.09-.75-4.07-1.83l-1.29-1.43c-.17-.19-.38-.34-.61-.45-.44-.22-.96-.28-1.45-.16L8 8v4h2V9.38l1.45-.48c.19 1.13.79 2.14 1.69 2.82L11 14.5c-2.48 0-4.5 2.02-4.5 4.5s2.02 4.5 4.5 4.5 4.5-2.02 4.5-4.5h-2c0 1.38-1.12 2.5-2.5 2.5S8.5 20.38 8.5 19s1.12-2.5 2.5-2.5c.34 0 .66.07.96.2l1.64-2.87c.85.74 1.93 1.17 3.09 1.17h2.31z"/>
          </svg>
        `;
      } else if (feature.type === 'stairs') {
        badgeStyle = 'bg-red-600 text-white border-white ring-2 ring-red-400';
        iconHtml = `
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 5h-4v4h-4v4H7v4H3" />
          </svg>
        `;
      } else if (feature.type === 'footbridge') {
        badgeStyle = `bg-[#7C3AED] text-white border-white ${statusRing}`;
        iconHtml = `
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M3 17h18M5 17V8a2 2 0 012-2h10a2 2 0 012 2v9M9 17v-5M15 17v-5" />
          </svg>
        `;
      } else if (feature.type === 'underpass') {
        badgeStyle = `bg-[#0284C7] text-white border-white ${statusRing}`;
        iconHtml = `
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M4 19V9a8 8 0 0116 0v10M9 19v-4a3 3 0 016 0v4" />
          </svg>
        `;
      } else if (feature.type === 'crossing') {
        badgeStyle = `bg-[#D97706] text-white border-white ${statusRing}`;
        iconHtml = `
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        `;
      } else {
        badgeStyle = `bg-[#263B68] text-white border-white ${statusRing}`;
        iconHtml = `<span>●</span>`;
      }

      const accessIcon = L.divIcon({
        className: '',
        html: `
          <div class="accessibility-marker ${feature.type} cursor-pointer transition-all duration-300 transform hover:scale-125">
            <div class="w-6 h-6 rounded-lg ${badgeStyle} border flex items-center justify-center text-[10px]" title="${feature.name} (${feature.status || 'verified'})">
              ${iconHtml}
            </div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker([feature.coordinates[1], feature.coordinates[0]], {
        icon: accessIcon,
        zIndexOffset: 500
      });

      marker.on('click', () => {
        setSelectedStationPopup({
          name: feature.name,
          type: (feature.type || 'FEATURE').toUpperCase(),
          station: feature.stationName || feature.station || feature.locality,
          status:
            feature.status === 'verified'
              ? 'Verified Infrastructure'
              : feature.status === 'provisional'
              ? 'Provisional Infrastructure'
              : 'Unknown Status',
          confidence: feature.status || 'verified',
          details: feature.details || 'Pedestrian infrastructure amenity.',
          source: feature.source || 'MoHUA / GCC Survey',
          stepFree: Boolean(feature.isStepFree),
          coordinates: feature.coordinates,
          isFeature: true
        });
      });

      accessMarkersLayerRef.current.addLayer(marker);
    });

    // Control accessibility layer visibility on map
    if (isAccessibilityLayerOn) {
      if (!map.hasLayer(accessMarkersLayerRef.current)) {
        map.addLayer(accessMarkersLayerRef.current);
      }
    } else {
      if (map.hasLayer(accessMarkersLayerRef.current)) {
        map.removeLayer(accessMarkersLayerRef.current);
      }
    }
  }, [
    mapLoaded,
    isAccessibilityLayerOn,
    origin,
    destination,
    selectedRoute,
    geoRoute,
    routingMode,
    pedestrianFeatures,
    explorerActiveModes
  ]);

  // Toggle Accessibility Layer visibility
  const toggleAccessibilityLayer = () => {
    setIsAccessibilityLayerOn((prev) => !prev);
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
      const activeBaseCoords =
        activeRouteData?.coordinates || CHENNAI_CANDIDATE_ROUTES[selectedRouteKey]?.coordinates || [];
      const originCoords = getCoordinatesForLocation(origin);
      const destCoords = getCoordinatesForLocation(destination);
      const activeCoords = getTransformedRouteCoords(activeBaseCoords, originCoords, destCoords);
      const activeLatLngs = activeCoords.map(([lng, lat]) => [lat, lng]);
      if (activeLatLngs.length > 0) {
        const bounds = L.latLngBounds(activeLatLngs);
        mapRef.current.fitBounds(bounds, {
          padding: [60, 60],
          maxZoom: 15
        });
      }
    }
  };

  return (
    <div className="relative w-full h-full min-h-[420px] bg-[#F5F3ED] rounded-2xl overflow-hidden shadow-xs border border-[#DCE3EB] flex flex-col justify-between">
      {/* Leaflet Map Container */}
      <div id="map-view" ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

      {/* TOP OVERLAYS: Live Route Status & Voice Guidance */}
      <div className="z-20 p-3.5 pointer-events-auto space-y-2">
        <div className="flex items-center justify-between gap-2">
          {/* Live Route Pill */}
          <div className="bg-[#FFFFFF]/98 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-xs border border-[#DCE3EB] flex items-center gap-2 max-w-[70%]">
            <div className="w-2.5 h-2.5 rounded-full bg-[#60C4D4] shrink-0" />
            <div className="truncate">
              <span className="text-xs font-black text-[#263B68] block truncate">
                {origin} → {destination}
              </span>
              <span className="text-[10px] text-[#5B6E88] font-semibold">
                {selectedRoute?.durationText || '38 min'} • {selectedRoute?.fareText || '₹25'}
              </span>
            </div>
          </div>

          {/* Action Buttons: Accessibility Layer Toggle & Voice Guidance */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleAccessibilityLayer}
              className={`px-3 py-2 rounded-xl text-xs font-bold shadow-xs border transition-all flex items-center gap-1.5 cursor-pointer ${
                isAccessibilityLayerOn
                  ? 'bg-[#FFFFFF] text-[#263B68] border-[#DCE3EB] hover:bg-[#F5F3ED]'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
              title="Toggle Accessibility Layer"
            >
              {isAccessibilityLayerOn ? (
                <>
                  <Eye className="w-4 h-4 text-[#60C4D4]" />
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
              className={`text-xs font-bold px-3 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                isPlayingAudio
                  ? 'bg-[#60C4D4] text-[#263B68] animate-pulse'
                  : 'bg-[#263B68] text-[#FFFFFF] hover:bg-[#1B2B4C]'
              }`}
              title="Voice guidance directions"
            >
              <Volume2 className="w-4 h-4 text-[#60C4D4]" />
              <span className="hidden sm:inline">{isPlayingAudio ? 'Speaking...' : 'Voice Guidance'}</span>
            </button>
          </div>
        </div>

        {/* Floating Transport Mode Visibility Filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {Object.values(TRANSIT_MODES).map((mode) => {
            const isActive = (explorerActiveModes || []).includes(mode.id);
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => toggleExplorerMode(mode.id)}
                className={`px-2 py-1 rounded-xl text-[11px] font-bold shadow-xs border transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#FFFFFF]/95 text-[#263B68] border-[#263B68] shadow-xs'
                    : 'bg-[#F5F3ED]/90 text-[#8CA0BA] border-[#DCE3EB] opacity-65 hover:opacity-100'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded text-[9px] flex items-center justify-center font-black ${
                    isActive ? mode.badgeClass : 'bg-slate-300 text-slate-600'
                  }`}
                >
                  {mode.badge}
                </span>
                <span>{mode.shortLabel}</span>
                <span className="text-[10px] font-mono opacity-80">({mode.count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* MAP CONTROLS (Bottom Right) */}
      <div className="z-20 ml-auto mr-3.5 mb-3.5 space-y-2 pointer-events-auto flex flex-col items-end">
        {/* Accessibility Features Quick Legend Badge */}
        {isAccessibilityLayerOn && (
          <div className="bg-[#FFFFFF]/98 backdrop-blur-md p-2 rounded-xl shadow-xs border border-[#DCE3EB] text-[10px] font-semibold text-slate-700 space-y-1 hidden sm:block">
            <div className="font-bold text-[#263B68] border-b border-[#DCE3EB] pb-0.5">Accessibility Layer</div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#263B68] inline-block" />
              <span>🛗 Elevators & 🛝 Ramps</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#60C4D4] inline-block" />
              <span>♿ Step-Free Gate</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block" />
              <span>🪜 Stairs Warning</span>
            </div>
          </div>
        )}

        {/* Legend Drawer Toggle & Content */}
        {showLegend && (
          <div className="bg-[#FFFFFF]/98 backdrop-blur-md p-3 rounded-xl shadow-lg border border-[#DCE3EB] text-[11px] text-slate-700 space-y-2 max-w-xs max-h-96 overflow-y-auto animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-[#DCE3EB] pb-1">
              <span className="font-bold text-[#263B68]">Chennai Transit & Pedestrian Legend</span>
              <button
                type="button"
                onClick={() => setShowLegend(false)}
                className="text-slate-400 hover:text-[#263B68] p-0.5 cursor-pointer"
                aria-label="Close legend"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Pedestrian Infrastructure */}
            <div className="space-y-1 text-[10px]">
              <div className="font-bold text-[#263B68] pt-0.5">Pedestrian Infrastructure</div>
              <div className="grid grid-cols-2 gap-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-[#263B68] text-[#60C4D4] flex items-center justify-center text-[9px]">
                    🛗
                  </span>
                  <span>Elevator / Lift</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-red-600 text-white flex items-center justify-center text-[9px]">
                    🪜
                  </span>
                  <span>Stairs (Barrier)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-emerald-700 text-white flex items-center justify-center text-[9px]">
                    ♿
                  </span>
                  <span>Ramp</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-[#7C3AED] text-white flex items-center justify-center text-[9px]">
                    🌉
                  </span>
                  <span>Footbridge (FOB)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-[#0284C7] text-white flex items-center justify-center text-[9px]">
                    🚇
                  </span>
                  <span>Underpass</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-[#10B981] text-white flex items-center justify-center text-[9px]">
                    🚪
                  </span>
                  <span>Step-Free Gate</span>
                </div>
                <div className="flex items-center gap-1.5 col-span-2">
                  <span className="w-3.5 h-3.5 rounded bg-[#D97706] text-white flex items-center justify-center text-[9px]">
                    🚸
                  </span>
                  <span>Pedestrian Crossing</span>
                </div>
              </div>

              {/* Confidence Levels */}
              <div className="font-bold text-[#263B68] pt-1 border-t border-[#DCE3EB]">Confidence Statuses</div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-300" />
                  <span>
                    <strong>Verified:</strong> Physical/MoHUA survey
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-300" />
                  <span>
                    <strong>Provisional:</strong> Hub alignment/reported
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400 ring-2 ring-slate-300" />
                  <span>
                    <strong>Unknown:</strong> Unverified on site
                  </span>
                </div>
              </div>

              {/* Transit Modes */}
              <div className="font-bold text-[#263B68] pt-1 border-t border-[#DCE3EB]">Transport Modes</div>
              <div className="grid grid-cols-2 gap-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-[#0072CE] text-white flex items-center justify-center text-[8px] font-black">
                    M
                  </span>
                  <span>Metro (41)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-[#059669] text-white flex items-center justify-center text-[8px] font-black">
                    S
                  </span>
                  <span>Suburban (70)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-[#263B68] text-white flex items-center justify-center text-[8px] font-black">
                    B
                  </span>
                  <span>MTC Hub (21)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-[#7C3AED] text-white flex items-center justify-center text-[8px] font-black">
                    X
                  </span>
                  <span>Express (8)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col rounded-xl bg-[#FFFFFF] shadow-xs border border-[#DCE3EB] overflow-hidden">
          <button
            onClick={handleZoomIn}
            className="p-2.5 hover:bg-[#F5F3ED] text-[#263B68] transition-colors border-b border-[#DCE3EB] cursor-pointer"
            title="Zoom in"
            aria-label="Zoom in"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2.5 hover:bg-[#F5F3ED] text-[#263B68] transition-colors cursor-pointer"
            title="Zoom out"
            aria-label="Zoom out"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowLegend(!showLegend)}
            className={`p-2.5 rounded-xl shadow-xs border transition-colors flex items-center justify-center cursor-pointer ${
              showLegend
                ? 'bg-[#263B68] text-white border-[#263B68]'
                : 'bg-[#FFFFFF] text-[#263B68] hover:bg-[#F5F3ED] border-[#DCE3EB]'
            }`}
            title="Toggle Map Legend"
            aria-label="Toggle Map Legend"
          >
            <Layers className="w-4 h-4" />
          </button>

          <button
            onClick={handleCenterMap}
            className="p-2.5 rounded-xl bg-[#FFFFFF] shadow-xs border border-[#DCE3EB] text-[#263B68] hover:bg-[#F5F3ED] transition-colors flex items-center justify-center cursor-pointer"
            title="Center route corridor"
            aria-label="Center route corridor"
          >
            <Navigation className="w-4 h-4 text-[#263B68]" />
          </button>
        </div>
      </div>

      {/* INTERACTIVE STATION / FEATURE ACCESSIBILITY POPUP CARD */}
      {selectedStationPopup && (
        <div className="absolute inset-x-3 bottom-3 sm:left-4 sm:right-auto sm:max-w-sm z-30 bg-[#FFFFFF]/98 backdrop-blur-md rounded-2xl shadow-xl border border-[#DCE3EB] p-4 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              {selectedStationPopup.markerBadge && (
                <span
                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5 ${
                    TRANSIT_MODES[selectedStationPopup.mode]?.badgeClass || 'bg-[#263B68] text-white'
                  }`}
                >
                  {selectedStationPopup.markerBadge}
                </span>
              )}
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="text-sm font-extrabold text-[#263B68] leading-tight">
                    {selectedStationPopup.name}
                  </h3>
                  {selectedStationPopup.code && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[#F5F3ED] text-[#263B68] border border-[#DCE3EB]">
                      {selectedStationPopup.code}
                    </span>
                  )}
                  {selectedStationPopup.verified && (
                    <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[9px] font-bold flex items-center gap-0.5">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                      Verified
                    </span>
                  )}
                </div>
                {selectedStationPopup.tamilName && (
                  <p className="text-[11px] text-[#5B6E88] font-medium mt-0.5">
                    {selectedStationPopup.tamilName}
                  </p>
                )}
                <p className="text-[10px] text-[#5B6E88]">
                  {selectedStationPopup.modeLabel || selectedStationPopup.type || selectedStationPopup.station}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedStationPopup(null)}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer shrink-0"
              aria-label="Close place details"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Details Grid */}
          <div className="mt-2.5 space-y-2 text-xs">
            {selectedStationPopup.isFeature ? (
              <div className="p-2.5 rounded-xl bg-[#F5F3ED] border border-[#DCE3EB] space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-[#263B68]">
                    Status: <span className="text-emerald-700">{selectedStationPopup.status}</span>
                  </span>
                  {selectedStationPopup.confidence && (
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                        selectedStationPopup.confidence === 'verified'
                          ? 'bg-emerald-100 text-emerald-800'
                          : selectedStationPopup.confidence === 'provisional'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {selectedStationPopup.confidence}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-700 leading-relaxed">{selectedStationPopup.details}</p>
                {selectedStationPopup.source && (
                  <div className="text-[10px] text-[#5B6E88] pt-1 border-t border-[#DCE3EB]">
                    <strong>Source:</strong> {selectedStationPopup.source}
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-1.5 text-slate-700 font-medium text-[11px]">
                  <div className="p-2 rounded-xl bg-[#F5F3ED] border border-[#DCE3EB] flex items-center gap-1.5">
                    <ArrowDownUp className="w-3.5 h-3.5 text-[#263B68]" />
                    <span className="text-[#263B68] font-bold">
                      {selectedStationPopup.hasElevator !== undefined
                        ? selectedStationPopup.hasElevator
                          ? `${selectedStationPopup.platforms || 2} Elevators`
                          : 'No Elevators'
                        : `${selectedStationPopup.elevators || 0} Elevators`}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-[#F5F3ED] border border-[#DCE3EB] flex items-center gap-1.5">
                    <Accessibility className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-[#263B68] font-bold">
                      {selectedStationPopup.hasRamp || selectedStationPopup.ramps ? 'Ramp Ready' : 'No Ramp'}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl col-span-2 bg-[#F5F3ED] border border-[#DCE3EB] flex items-center justify-between">
                    <span className="text-[#5B6E88] font-normal">Step-Free Entry:</span>
                    <span className="font-bold text-[#263B68]">
                      {selectedStationPopup.stepFreeAccess ? 'Step-Free Access' : 'Limited Step-Free'}
                    </span>
                  </div>
                </div>

                {selectedStationPopup.timetableNote && (
                  <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[10px] space-y-0.5">
                    <div className="font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                      <span>Timetable Routing Isolated</span>
                    </div>
                    <p className="text-[10px] text-amber-800 leading-tight">
                      {selectedStationPopup.timetableNote}
                    </p>
                  </div>
                )}

                {/* Direct Action Buttons: Set as Starting Point or Destination */}
                <div className="pt-2 border-t border-[#DCE3EB] flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const stName = selectedStationPopup.name;
                      setOrigin(stName);
                      refreshRoutes(stName, destination, preferences);
                      setSelectedStationPopup(null);
                    }}
                    className="flex-1 py-1.5 px-2 rounded-xl bg-[#263B68] hover:bg-[#1B2B4C] text-[#FFFFFF] text-[11px] font-bold transition-colors cursor-pointer text-center shadow-xs"
                    aria-label={`Set ${selectedStationPopup.name} as starting point`}
                  >
                    Set as Origin
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const stName = selectedStationPopup.name;
                      setDestination(stName);
                      refreshRoutes(origin, stName, preferences);
                      setSelectedStationPopup(null);
                    }}
                    className="flex-1 py-1.5 px-2 rounded-xl bg-[#FFFFFF] hover:bg-[#F5F3ED] text-[#263B68] border border-[#DCE3EB] hover:border-[#60C4D4] text-[11px] font-bold transition-colors cursor-pointer text-center"
                    aria-label={`Set ${selectedStationPopup.name} as destination`}
                  >
                    Set as Destination
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
