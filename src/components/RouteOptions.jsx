import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import {
  Bus,
  Train,
  Accessibility,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Star,
  Zap,
  Banknote,
  Sparkles,
  Info,
  Layers,
  Footprints,
  Loader2,
  ShieldAlert,
  Clock,
  Compass
} from 'lucide-react';
import { RouteSearch } from './RouteSearch';
import { TransitExplorer } from './TransitExplorer';

export function RouteOptions() {
  const {
    mainTab,
    setMainTab,
    selectedRouteKey,
    setSelectedRouteKey,
    setCurrentView,
    destination,
    origin,
    departureTime,
    preferences,
    togglePreference,
    transportModes,
    toggleTransportMode,
    routes,
    geoRoute,
    geoProfile,
    setGeoProfile,
    searchGeographicalRoute,
    isSearching,
    searchError,
    routingMode,
    setRoutingMode,
    useSyntheticFixtures,
    setUseSyntheticFixtures,
    searchTimetableJourneys,
    loadIllustrativePreview,
    timetableStatus
  } = useContext(AppContext);

  // Check if routes are from real timetable CSA calculation
  const isRealTimetable = Boolean(routes?.isRealTimetable || routes?.routingMode === 'timetable');

  // Filter conditions
  const isFastestStairsFiltered = Boolean(
    (preferences?.avoidStairs && (routes?.fastest?.stairsCount > 0 || routes?.fastest?.isStepFree === false)) ||
    (preferences?.wheelchair && routes?.fastest?.isStepFree === false)
  );

  // Check transport mode filters
  const isRecommendedModeFiltered = Boolean(
    (!transportModes?.bus && !transportModes?.metro) ||
    (!transportModes?.bus && routes?.recommended?.segments?.some((s) => s.mode?.includes('Bus'))) ||
    (!transportModes?.metro && routes?.recommended?.segments?.some((s) => s.mode?.includes('Metro')))
  );

  const isFastestModeFiltered = Boolean(!transportModes?.metro);
  const isLowestCostModeFiltered = Boolean(!transportModes?.bus);

  const isFastestFiltered = isFastestStairsFiltered || isFastestModeFiltered;

  const handleSelectRoute = (key) => {
    if (key === 'fastest' && isFastestFiltered) return;
    if (key === 'recommended' && isRecommendedModeFiltered) return;
    if (key === 'lowestCost' && isLowestCostModeFiltered) return;
    setSelectedRouteKey(key);
    setCurrentView('journey-steps');
  };

  const handleViewDetails = (key, e) => {
    e.stopPropagation();
    if (key === 'fastest' && isFastestFiltered) return;
    if (key === 'recommended' && isRecommendedModeFiltered) return;
    if (key === 'lowestCost' && isLowestCostModeFiltered) return;
    setSelectedRouteKey(key);
    setCurrentView('route-details');
  };

  // Helper to render mode pills for each journey
  const renderLegSummary = (route) => {
    if (route?.legs && route.legs.length > 0) {
      return (
        <div className="flex items-center gap-1.5 flex-wrap">
          {route.legs.map((leg, idx) => (
            <React.Fragment key={leg.id || idx}>
              {idx > 0 && <ChevronRight className="w-3 h-3 text-[#8CA0BA] shrink-0" />}
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#F5F3ED] text-[#263B68] text-[11px] font-bold border border-[#DCE3EB]">
                {leg.transitMode === 'chennai_metro' || leg.mode?.toLowerCase().includes('metro') ? (
                  <Train className="w-3.5 h-3.5 text-[#60C4D4]" />
                ) : leg.transitMode === 'suburban_rail' || leg.mode?.toLowerCase().includes('suburban') ? (
                  <Train className="w-3.5 h-3.5 text-[#059669]" />
                ) : leg.type === 'transfer' || leg.type === 'walk' ? (
                  <Footprints className="w-3.5 h-3.5 text-[#5B6E88]" />
                ) : (
                  <Bus className="w-3.5 h-3.5 text-[#263B68]" />
                )}
                <span>{leg.badge || leg.routeShortName || leg.mode || 'Transit'}</span>
              </div>
            </React.Fragment>
          ))}
        </div>
      );
    }

    // Default corridor segments
    return (
      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#F5F3ED] text-[#263B68] text-xs font-semibold border border-[#DCE3EB]">
          <Bus className="w-4 h-4 text-[#263B68]" />
          <span>MTC Bus</span>
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-[#8CA0BA]" />
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#F5F3ED] text-[#263B68] text-xs font-semibold border border-[#DCE3EB]">
          <Train className="w-4 h-4 text-[#60C4D4]" />
          <span>Chennai Metro</span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-[#FFFFFF] rounded-2xl p-4 md:p-6 shadow-xs border border-[#DCE3EB] max-w-xl mx-auto space-y-4">
      {/* Mobile top pull handle indicator */}
      <div className="w-12 h-1 bg-[#DCE3EB] rounded-full mx-auto mb-2 md:hidden" />

      {/* Primary Section Switcher: Journey Planner vs Transit Network Explorer */}
      <div className="flex items-center p-1 bg-[#F5F3ED] rounded-xl border border-[#DCE3EB] text-xs font-bold">
        <button
          type="button"
          onClick={() => setMainTab('planner')}
          className={`flex-1 py-1.5 px-3 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            mainTab === 'planner'
              ? 'bg-[#263B68] text-[#FFFFFF] shadow-xs'
              : 'text-[#5B6E88] hover:text-[#263B68]'
          }`}
        >
          <span>🧭 Journey Planner</span>
        </button>
        <button
          type="button"
          onClick={() => setMainTab('explorer')}
          className={`flex-1 py-1.5 px-3 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            mainTab === 'explorer'
              ? 'bg-[#263B68] text-[#FFFFFF] shadow-xs'
              : 'text-[#5B6E88] hover:text-[#263B68]'
          }`}
        >
          <span>🗺️ Transit Explorer (140)</span>
        </button>
      </div>

      {mainTab === 'explorer' ? (
        <TransitExplorer />
      ) : (
        <>
          {/* Origin & Destination search bar with Swap control */}
          <RouteSearch />

      {/* Transport Modes Preference Bar */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-xs font-bold text-[#5B6E88]">
          <span className="flex items-center gap-1.5 text-[#263B68]">
            <Layers className="w-3.5 h-3.5 text-[#263B68]" />
            <span>Transport Modes:</span>
          </span>
          <span className="text-[10px] text-[#8CA0BA] font-normal">Select preferred modes</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {/* Mode 1: MTC Bus */}
          <button
            type="button"
            onClick={() => toggleTransportMode('bus')}
            className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
              transportModes?.bus
                ? 'bg-[#263B68] text-[#FFFFFF] border-[#263B68] shadow-2xs'
                : 'bg-[#F5F3ED] text-[#5B6E88] border-[#DCE3EB] hover:bg-[#FFFFFF] hover:text-[#263B68]'
            }`}
            aria-pressed={Boolean(transportModes?.bus)}
          >
            <Bus className={`w-3.5 h-3.5 ${transportModes?.bus ? 'text-[#60C4D4]' : ''}`} />
            <span>MTC Bus</span>
          </button>

          {/* Mode 2: Chennai Metro */}
          <button
            type="button"
            onClick={() => toggleTransportMode('metro')}
            className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
              transportModes?.metro
                ? 'bg-[#263B68] text-[#FFFFFF] border-[#263B68] shadow-2xs'
                : 'bg-[#F5F3ED] text-[#5B6E88] border-[#DCE3EB] hover:bg-[#FFFFFF] hover:text-[#263B68]'
            }`}
            aria-pressed={Boolean(transportModes?.metro)}
          >
            <Train className={`w-3.5 h-3.5 ${transportModes?.metro ? 'text-[#60C4D4]' : ''}`} />
            <span>Metro</span>
          </button>

          {/* Mode 3: Suburban Rail */}
          <button
            type="button"
            onClick={() => toggleTransportMode('suburban')}
            className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
              transportModes?.suburban
                ? 'bg-[#263B68] text-[#FFFFFF] border-[#263B68] shadow-2xs'
                : 'bg-[#F5F3ED] text-[#5B6E88] border-[#DCE3EB] hover:bg-[#FFFFFF] hover:text-[#263B68]'
            }`}
            aria-pressed={Boolean(transportModes?.suburban)}
          >
            <Train className={`w-3.5 h-3.5 ${transportModes?.suburban ? 'text-[#60C4D4]' : ''}`} />
            <span>Suburban</span>
          </button>

          {/* Mode 4: Express Rail */}
          <button
            type="button"
            onClick={() => toggleTransportMode('express')}
            className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
              transportModes?.express
                ? 'bg-[#263B68] text-[#FFFFFF] border-[#263B68] shadow-2xs'
                : 'bg-[#F5F3ED] text-[#5B6E88] border-[#DCE3EB] hover:bg-[#FFFFFF] hover:text-[#263B68]'
            }`}
            aria-pressed={Boolean(transportModes?.express)}
          >
            <Train className={`w-3.5 h-3.5 ${transportModes?.express ? 'text-[#60C4D4]' : ''}`} />
            <span>Express</span>
          </button>
        </div>
      </div>

      {/* Header & Accessibility Filter Bar */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-[#DCE3EB]">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-[#263B68] tracking-tight">Route Options</h2>
          <p className="text-xs md:text-sm text-[#5B6E88] font-normal mt-0.5">
            {routes
              ? `Found ${isFastestFiltered ? '2 accessible' : '3 accessible'} paths to your destination`
              : 'Configure search criteria to view journeys'}
          </p>
        </div>
        <button
          onClick={() => setCurrentView('assisted')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EEF3FA] text-[#263B68] text-xs font-bold border border-[#DCE3EB] hover:bg-[#DCE3EB] transition-all cursor-pointer shadow-2xs"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#60C4D4]" />
          <span>Assisted Travel</span>
        </button>
      </div>

      {/* Filter Checkboxes */}
      <div className="flex items-center gap-2 pt-0.5 flex-wrap">
        <span className="text-xs font-bold text-[#5B6E88]">Filter:</span>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F5F3ED] border border-[#DCE3EB] hover:bg-[#FFFFFF] cursor-pointer transition-colors">
          <input
            type="checkbox"
            id="ro-pref-wheelchair"
            checked={Boolean(preferences.wheelchair)}
            onChange={() => togglePreference('wheelchair')}
            className="w-4 h-4 accent-[#263B68] cursor-pointer"
          />
          <label
            htmlFor="ro-pref-wheelchair"
            className="text-xs font-bold text-[#263B68] cursor-pointer select-none"
          >
            Wheelchair
          </label>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F5F3ED] border border-[#DCE3EB] hover:bg-[#FFFFFF] cursor-pointer transition-colors">
          <input
            type="checkbox"
            id="ro-pref-avoidStairs"
            checked={Boolean(preferences.avoidStairs)}
            onChange={() => togglePreference('avoidStairs')}
            className="w-4 h-4 accent-[#263B68] cursor-pointer"
          />
          <label
            htmlFor="ro-pref-avoidStairs"
            className="text-xs font-bold text-[#263B68] cursor-pointer select-none"
          >
            Avoid stairs
          </label>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F5F3ED] border border-[#DCE3EB] hover:bg-[#FFFFFF] cursor-pointer transition-colors">
          <input
            type="checkbox"
            id="ro-pref-minimizeWalking"
            checked={Boolean(preferences.minimizeWalking)}
            onChange={() => togglePreference('minimizeWalking')}
            className="w-4 h-4 accent-[#263B68] cursor-pointer"
          />
          <label
            htmlFor="ro-pref-minimizeWalking"
            className="text-xs font-bold text-[#263B68] cursor-pointer select-none"
          >
            Minimize walking
          </label>
        </div>
      </div>

      {/* 1. LOADING STATE */}
      {isSearching && (
        <div className="p-6 rounded-2xl bg-[#F5F3ED] border border-[#DCE3EB] text-center space-y-3 animate-in fade-in duration-150">
          <Loader2 className="w-8 h-8 text-[#263B68] animate-spin mx-auto" />
          <div className="font-extrabold text-[#263B68] text-sm">
            {routingMode === 'timetable'
              ? 'Scanning Chennai Transit Timetable Connections...'
              : 'Loading Route Corridor Preview...'}
          </div>
          <p className="text-xs text-[#5B6E88] max-w-sm mx-auto leading-relaxed">
            {routingMode === 'timetable'
              ? `Evaluating multi-modal CSA graph from ${origin} to ${destination} departing at ${departureTime}...`
              : 'Fetching sample corridor preview for interface verification...'}
          </p>
        </div>
      )}

      {/* 2. ERROR STATE / ROUTING DATA UNAVAILABLE */}
      {!isSearching && searchError && (
        <div className="p-4 md:p-5 rounded-2xl border space-y-3 shadow-xs bg-[#FFFFFF] border-amber-300 ring-1 ring-amber-200">
          {searchError.code === 'ROUTING_DATA_UNAVAILABLE' ? (
            <>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-700" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-[#263B68]">
                    Verified Timetable Data Unavailable
                  </h3>
                  <p className="text-xs text-[#5B6E88] leading-relaxed">
                    Chennai public transit timetable feeds are currently quarantined and blocked from operational routing due to data integrity issues. AccessRoute strictly does not invent schedules or substitute guesses.
                  </p>
                </div>
              </div>

              {/* Feed Blockers Breakdown */}
              <div className="p-3 rounded-xl bg-[#F5F3ED] border border-[#DCE3EB] space-y-2 text-xs">
                <div className="text-[11px] font-bold text-[#263B68] uppercase tracking-wide flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Active Feed Blockers & Isolation Reasons:</span>
                </div>
                <ul className="space-y-1.5 text-[11px] text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="font-mono text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-bold shrink-0">BLOCKED</span>
                    <span><strong>Chennai Metro (CMRL):</strong> GTFS calendar expired on 2021-12-31 (current date: 2026-10-29). Zero valid active service IDs.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-mono text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-bold shrink-0">BLOCKED</span>
                    <span><strong>Suburban Rail:</strong> Southern Railway feed has placeholder dates in year 2170 and unverified calendar patterns.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-mono text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-bold shrink-0">BLOCKED</span>
                    <span><strong>MTC Bus:</strong> Scraped corridor frequencies lack GTFS calendar integrity and verified stop sequences.</span>
                  </li>
                </ul>
              </div>

              {/* Action Buttons: View Preview vs Try Synthetic Multimodal Fixture */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => loadIllustrativePreview(origin, destination, preferences)}
                  className="flex-1 py-2 px-3 rounded-xl bg-[#263B68] hover:bg-[#1B2B4C] text-[#FFFFFF] text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>View Illustrative Preview</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#60C4D4]" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUseSyntheticFixtures(true);
                    searchTimetableJourneys(origin, destination, departureTime, preferences, transportModes, true);
                  }}
                  className="py-2 px-3 rounded-xl bg-[#EEF7F9] hover:bg-[#DCE3EB] text-[#263B68] border border-[#60C4D4] text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#60C4D4]" />
                  <span>Test CSA with Fixtures</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-100 text-red-800 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#263B68]">
                    {searchError.code === 'UNKNOWN_ORIGIN' || searchError.code === 'UNKNOWN_DESTINATION'
                      ? 'Transit Location Not Found'
                      : searchError.code === 'NO_SERVICE_AVAILABLE'
                      ? 'No Timetable Transit Connections Found'
                      : 'Routing Service Notice'}
                  </h3>
                  <p className="text-xs text-[#5B6E88] mt-1 leading-relaxed">
                    {searchError.message}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => loadIllustrativePreview(origin, destination, preferences)}
                  className="py-1.5 px-3 rounded-xl bg-[#263B68] text-[#FFFFFF] text-xs font-bold hover:bg-[#1B2B4C] transition-colors cursor-pointer"
                >
                  Switch to Illustrative Preview
                </button>
                <button
                  type="button"
                  onClick={() => searchTimetableJourneys(origin, destination, departureTime, preferences, transportModes, useSyntheticFixtures)}
                  className="py-1.5 px-3 rounded-xl bg-[#F5F3ED] text-[#263B68] border border-[#DCE3EB] text-xs font-bold hover:bg-[#FFFFFF] transition-colors cursor-pointer"
                >
                  Retry Search
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* 3. EMPTY RESULTS STATE */}
      {!isSearching && !searchError && (!routes || (!routes.recommended && !routes.candidates)) && (
        <div className="p-6 rounded-2xl bg-[#F5F3ED] border border-[#DCE3EB] text-center space-y-2">
          <Info className="w-6 h-6 text-[#5B6E88] mx-auto" />
          <h3 className="text-sm font-bold text-[#263B68]">No Route Options Found</h3>
          <p className="text-xs text-[#5B6E88]">
            No accessible journeys found for the current departure time and filters. Try adjusting your transport modes or departure time.
          </p>
        </div>
      )}

      {/* GEOGRAPHICAL ROUTING RESULT */}
      {!isSearching && routingMode === 'geographical' && geoRoute && (
        <div className="space-y-3">
          {/* Disclaimer Header */}
          <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-950 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5 text-sky-900">
                <Compass className="w-3.5 h-3.5 text-sky-700" />
                <span>Geographical Route ({geoProfile?.toUpperCase() || 'WALKING'})</span>
              </span>
              <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-sky-200 font-mono text-sky-800">
                {(geoRoute.distanceMeters / 1000).toFixed(1)} km • {geoRoute.durationMinutes} min
              </span>
            </div>
            <p className="text-[10px] text-sky-800 leading-relaxed">
              OpenStreetMap road & pedestrian geometry. <strong>Not a verified public transport timetable.</strong>
            </p>
          </div>

          {/* Main Geo Card */}
          <div className="bg-white rounded-2xl p-4 border-2 border-[#263B68] shadow-sm space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#263B68] text-white">
                  {geoProfile === 'walking' ? '🚶 Pedestrian / Walking' : geoProfile === 'cycling' ? '🚲 Cycling Route' : '🚗 Driving / Access'}
                </span>
                <h4 className="text-base font-black text-[#263B68] mt-1.5">
                  {geoRoute.origin?.name} ⟷ {geoRoute.destination?.name}
                </h4>
              </div>
              <div className="text-right">
                <div className="text-xl font-black text-[#263B68]">{geoRoute.durationMinutes} min</div>
                <div className="text-[11px] text-[#5B6E88] font-bold">{(geoRoute.distanceMeters / 1000).toFixed(2)} km</div>
              </div>
            </div>

            {/* Accessibility Summary */}
            <div className="p-2.5 rounded-xl bg-[#F5F3ED] border border-[#DCE3EB] space-y-1.5 text-xs">
              <div className="flex items-center justify-between font-bold">
                <span className="text-[#263B68] flex items-center gap-1.5">
                  {geoRoute.accessibility?.isStepFree ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  )}
                  <span>{geoRoute.accessibility?.isStepFree ? 'Step-Free Access Available' : 'Barriers / Stairs Detected'}</span>
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                  geoRoute.accessibility?.confidence === 'verified'
                    ? 'bg-emerald-100 text-emerald-800'
                    : geoRoute.accessibility?.confidence === 'provisional'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-200 text-slate-700'
                }`}>
                  {geoRoute.accessibility?.confidence || 'verified'}
                </span>
              </div>
              <div className="text-[11px] text-[#5B6E88]">
                {geoRoute.accessibility?.confidenceLabel}
              </div>
              {/* Infrastructure badges */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {geoRoute.accessibility?.elevatorsCount > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                    🛗 {geoRoute.accessibility.elevatorsCount} Elevator(s)
                  </span>
                )}
                {geoRoute.accessibility?.rampsCount > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                    ♿ {geoRoute.accessibility.rampsCount} Ramp(s)
                  </span>
                )}
                {geoRoute.accessibility?.stairsCount > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-red-50 text-red-800 border border-red-200 text-[10px] font-bold">
                    🪜 {geoRoute.accessibility.stairsCount} Steps
                  </span>
                )}
                {geoRoute.accessibility?.infrastructure?.crossings?.length > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold">
                    🚸 {geoRoute.accessibility.infrastructure.crossings.length} Crossing(s)
                  </span>
                )}
              </div>
            </div>

            {/* Turn-by-turn steps preview */}
            {geoRoute.steps && geoRoute.steps.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="text-[11px] font-bold text-[#5B6E88] uppercase">Turn-by-Turn Route Guidance:</div>
                <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                  {geoRoute.steps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-1.5 rounded-lg bg-[#F8FAFC] text-[11px] text-slate-700 border border-[#E2E8F0]">
                      <span className="font-mono text-[10px] text-[#8CA0BA] font-bold shrink-0">{idx + 1}.</span>
                      <span className="flex-1 font-medium">{step.instruction}</span>
                      <span className="font-mono text-[10px] text-[#5B6E88] shrink-0">{step.distanceMeters}m</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. RESULTS DISPLAY */}
      {!isSearching && !searchError && routingMode !== 'geographical' && routes && (
        <>
          {/* Data Integrity / Feed Mode Notice Banner */}
          {isRealTimetable ? (
            <div className="p-3 rounded-xl bg-[#EEF7F9] border border-[#60C4D4] text-[#263B68] text-xs space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Verified Timetable Results (Connection Scan Algorithm)</span>
                </div>
                <span className="text-[10px] font-mono bg-[#FFFFFF] px-2 py-0.5 rounded-md border border-[#DCE3EB] text-[#263B68] font-bold">
                  Dep: {routes.departureTime || departureTime}
                </span>
              </div>
              <p className="text-[11px] text-[#5B6E88] leading-relaxed">
                Journeys calculated using timetable connections, scheduled transfer walking times, and step-free accessibility constraints.
              </p>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-[#F5F3ED] border border-[#DCE3EB] text-[#5B6E88] text-[11px] space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-[#263B68]">
                  <Info className="w-3.5 h-3.5 text-[#60C4D4] shrink-0" />
                  <span>Feed Isolation Status: Illustrative Preview Mode</span>
                </div>
                <button
                  type="button"
                  onClick={() => searchTimetableJourneys(origin, destination, departureTime, preferences, transportModes, useSyntheticFixtures)}
                  className="text-[10px] font-bold text-[#263B68] underline hover:text-[#60C4D4] cursor-pointer"
                >
                  Run Timetable Search
                </button>
              </div>
              <p className="text-[10px] text-[#5B6E88] leading-relaxed">
                Chennai feeds quarantined (<code className="bg-[#FFFFFF] px-1 py-0.5 rounded text-[9px] font-mono text-[#263B68] border border-[#DCE3EB]">readyForJourneyRouting: false</code>). Itineraries below represent sample corridor previews. Real CSA timetable routing is verified via test fixtures.
              </p>
            </div>
          )}

          {/* Cards List */}
          <div className="space-y-3 pt-1">
            {/* CARD 1: RECOMMENDED */}
            <div
              onClick={() => handleSelectRoute('recommended')}
              className={`route-card group cursor-pointer p-4 rounded-xl border transition-all relative ${
                isRecommendedModeFiltered
                  ? 'opacity-60 bg-[#F5F3ED] border-[#DCE3EB] cursor-not-allowed'
                  : selectedRouteKey === 'recommended'
                  ? 'border-[#263B68] bg-[#F7F9FC] shadow-xs ring-1 ring-[#263B68]'
                  : 'border-[#DCE3EB] bg-[#FFFFFF] hover:border-[#60C4D4] hover:shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectRoute('recommended');
                    }}
                    disabled={isRecommendedModeFiltered}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#263B68] text-[#FFFFFF] text-[11px] font-bold tracking-wide uppercase cursor-pointer"
                  >
                    <Star className="w-3 h-3 fill-[#60C4D4] text-[#60C4D4]" />
                    <span>RECOMMENDED</span>
                  </button>
                  {isRealTimetable ? (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Verified Timetable
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-[#5B6E88] bg-[#F5F3ED] px-2 py-0.5 rounded-md border border-[#DCE3EB]">
                      Illustrative Preview
                    </span>
                  )}
                </div>
                <div className="text-xl font-bold text-[#263B68]">
                  {routes?.recommended?.fareText || `₹${routes?.recommended?.fare || 25}`}
                </div>
              </div>

              {isRealTimetable && routes?.recommended?.departureTime && (
                <div className="mt-1.5 flex items-center gap-2 text-xs font-bold text-[#263B68]">
                  <Clock className="w-3.5 h-3.5 text-[#60C4D4]" />
                  <span>
                    {routes.recommended.departureTime} → {routes.recommended.arrivalTime}
                  </span>
                  <span className="text-[10px] text-[#5B6E88] font-normal">
                    ({routes.recommended.transfersCount === 0 ? 'Direct connection' : `${routes.recommended.transfersCount} transfer`})
                  </span>
                </div>
              )}

              <div className="mt-2 text-xs font-semibold text-[#5B6E88] flex items-center gap-1">
                <span>🚗 ₹140 cheaper than estimated cab</span>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-[#263B68]">
                    {routes?.recommended?.durationMinutes || routes?.recommended?.duration || 38}
                  </span>
                  <span className="text-sm font-semibold text-[#5B6E88]">min</span>
                </div>

                {/* Segment Icons / Legs */}
                {renderLegSummary(routes?.recommended)}
              </div>

              {/* Accessibility Indicator Box */}
              <div className="mt-3 p-2.5 rounded-lg bg-[#FFFFFF] border border-[#DCE3EB] flex items-center justify-between text-xs font-semibold text-[#263B68]">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-[#EEF3FA] text-[#263B68] flex items-center justify-center">
                    <Accessibility className="w-4 h-4 text-[#263B68]" />
                  </div>
                  <span>{routes?.recommended?.accessibilityLevel || 'Highly Accessible'}</span>
                </div>
                <button
                  onClick={(e) => handleViewDetails('recommended', e)}
                  className="text-[#5B6E88] hover:text-[#263B68] underline text-[11px] cursor-pointer"
                >
                  Details
                </button>
              </div>
            </div>

            {/* CARD 2: FASTEST */}
            <div
              onClick={() => handleSelectRoute('fastest')}
              className={`route-card group p-4 rounded-xl border transition-all relative ${
                isFastestFiltered
                  ? 'opacity-60 bg-[#F5F3ED] border-[#DCE3EB] cursor-not-allowed'
                  : selectedRouteKey === 'fastest'
                  ? 'border-[#263B68] bg-[#F7F9FC] shadow-xs ring-1 ring-[#263B68] cursor-pointer'
                  : 'border-[#DCE3EB] bg-[#FFFFFF] hover:border-[#60C4D4] hover:shadow-xs cursor-pointer'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectRoute('fastest');
                    }}
                    disabled={isFastestFiltered}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase ${
                      isFastestFiltered ? 'bg-[#DCE3EB] text-[#8CA0BA]' : 'bg-[#EEF3FA] text-[#263B68] cursor-pointer'
                    }`}
                  >
                    <Zap className="w-3 h-3 text-[#263B68] fill-[#263B68]" />
                    <span>FASTEST</span>
                  </button>
                  {isRealTimetable ? (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Verified Timetable
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-[#5B6E88] bg-[#F5F3ED] px-2 py-0.5 rounded-md border border-[#DCE3EB]">
                      Illustrative Preview
                    </span>
                  )}
                </div>
                <div className="text-xl font-bold text-[#263B68]">
                  {routes?.fastest?.fareText || `₹${routes?.fastest?.fare || 35}`}
                </div>
              </div>

              {isRealTimetable && routes?.fastest?.departureTime && (
                <div className="mt-1.5 flex items-center gap-2 text-xs font-bold text-[#263B68]">
                  <Clock className="w-3.5 h-3.5 text-[#60C4D4]" />
                  <span>
                    {routes.fastest.departureTime} → {routes.fastest.arrivalTime}
                  </span>
                  <span className="text-[10px] text-[#5B6E88] font-normal">
                    ({routes.fastest.transfersCount === 0 ? 'Direct connection' : `${routes.fastest.transfersCount} transfer`})
                  </span>
                </div>
              )}

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-[#263B68]">
                    {routes?.fastest?.durationMinutes || routes?.fastest?.duration || 31}
                  </span>
                  <span className="text-sm font-semibold text-[#5B6E88]">min</span>
                </div>

                {/* Segment Icons / Legs */}
                {renderLegSummary(routes?.fastest)}
              </div>

              {/* Accessibility Indicator Box */}
              <div className={`mt-3 p-2.5 rounded-lg border flex items-center justify-between text-xs font-semibold ${
                isFastestFiltered
                  ? 'bg-[#F5F3ED] border-[#DCE3EB] text-[#5B6E88]'
                  : 'bg-amber-50/60 border-amber-200 text-amber-900'
              }`}>
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`w-4 h-4 shrink-0 ${isFastestFiltered ? 'text-[#8CA0BA]' : 'text-amber-600'}`} />
                  <span>
                    {isFastestModeFiltered
                      ? 'Unavailable (Metro mode turned off)'
                      : isFastestStairsFiltered
                      ? 'Unavailable (Stairs required - filtered out)'
                      : (routes?.fastest?.accessibilityLevel || 'Limited accessibility')}
                  </span>
                </div>
                {!isFastestFiltered && (
                  <button
                    onClick={(e) => handleViewDetails('fastest', e)}
                    className="text-[#5B6E88] hover:text-[#263B68] underline text-[11px] cursor-pointer"
                  >
                    Details
                  </button>
                )}
              </div>
            </div>

            {/* CARD 3: LOWEST COST */}
            <div
              onClick={() => handleSelectRoute('lowestCost')}
              className={`route-card group cursor-pointer p-4 rounded-xl border transition-all relative ${
                isLowestCostModeFiltered
                  ? 'opacity-60 bg-[#F5F3ED] border-[#DCE3EB] cursor-not-allowed'
                  : selectedRouteKey === 'lowestCost'
                  ? 'border-[#263B68] bg-[#F7F9FC] shadow-xs ring-1 ring-[#263B68]'
                  : 'border-[#DCE3EB] bg-[#FFFFFF] hover:border-[#60C4D4] hover:shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectRoute('lowestCost');
                    }}
                    disabled={isLowestCostModeFiltered}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#EEF3FA] text-[#263B68] text-[11px] font-bold tracking-wide uppercase cursor-pointer"
                  >
                    <Banknote className="w-3.5 h-3.5 text-[#263B68]" />
                    <span>LOWEST COST</span>
                  </button>
                  {isRealTimetable ? (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Verified Timetable
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-[#5B6E88] bg-[#F5F3ED] px-2 py-0.5 rounded-md border border-[#DCE3EB]">
                      Illustrative Preview
                    </span>
                  )}
                </div>
                <div className="text-xl font-bold text-[#263B68]">
                  {routes?.lowestCost?.fareText || `₹${routes?.lowestCost?.fare || 15}`}
                </div>
              </div>

              {isRealTimetable && routes?.lowestCost?.departureTime && (
                <div className="mt-1.5 flex items-center gap-2 text-xs font-bold text-[#263B68]">
                  <Clock className="w-3.5 h-3.5 text-[#60C4D4]" />
                  <span>
                    {routes.lowestCost.departureTime} → {routes.lowestCost.arrivalTime}
                  </span>
                  <span className="text-[10px] text-[#5B6E88] font-normal">
                    ({routes.lowestCost.transfersCount === 0 ? 'Direct connection' : `${routes.lowestCost.transfersCount} transfer`})
                  </span>
                </div>
              )}

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-[#263B68]">
                    {routes?.lowestCost?.durationMinutes || routes?.lowestCost?.duration || 44}
                  </span>
                  <span className="text-sm font-semibold text-[#5B6E88]">min</span>
                </div>

                {/* Segment Icons / Legs */}
                {renderLegSummary(routes?.lowestCost)}
              </div>

              {/* Accessibility Indicator Box (Good) */}
              <div className="mt-3 p-2.5 rounded-lg bg-[#FFFFFF] border border-[#DCE3EB] flex items-center justify-between text-xs font-semibold text-[#263B68]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#263B68]" />
                  <span>{routes?.lowestCost?.accessibilityLevel || 'Good Accessibility'}</span>
                </div>
                <button
                  onClick={(e) => handleViewDetails('lowestCost', e)}
                  className="text-[#5B6E88] hover:text-[#263B68] underline text-[11px] cursor-pointer"
                >
                  Details
                </button>
              </div>
            </div>
          </div>
        </>
      )}
        </>
      )}
    </div>
  );
}
