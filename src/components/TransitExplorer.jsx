import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import {
  TRANSIT_MODES,
  ALL_TRANSIT_STATIONS,
  TRANSIT_CORRIDORS,
  filterStations,
  getStationById
} from '../utils/transitExplorerData';
import {
  Search,
  Train,
  Bus,
  Compass,
  Accessibility,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Info,
  MapPin,
  ExternalLink,
  ChevronRight,
  X,
  Layers,
  ShieldAlert,
  ArrowUpDown,
  Navigation2
} from 'lucide-react';

export function TransitExplorer() {
  const {
    explorerActiveModes,
    toggleExplorerMode,
    selectedStation,
    setSelectedStation,
    explorerSearchQuery,
    setExplorerSearchQuery,
    selectedCorridorId,
    setSelectedCorridorId,
    explorerViewMode,
    setExplorerViewMode,
    setStationAsOrigin,
    setStationAsDestination,
    setSelectedPlace
  } = useContext(AppContext);

  const [stepFreeOnly, setStepFreeOnly] = useState(false);

  // Filtered station list based on active modes, search query, and step-free filter
  const filteredStations = useMemo(() => {
    return filterStations({
      modes: explorerActiveModes,
      q: explorerSearchQuery,
      stepFreeOnly
    });
  }, [explorerActiveModes, explorerSearchQuery, stepFreeOnly]);

  // Selected corridor details
  const activeCorridor = useMemo(() => {
    return TRANSIT_CORRIDORS.find((c) => c.id === selectedCorridorId) || TRANSIT_CORRIDORS[0];
  }, [selectedCorridorId]);

  const handleSelectStation = (station) => {
    setSelectedStation(station);
    if (station) {
      setSelectedPlace({
        id: station.id,
        name: station.name,
        code: station.code,
        coordinates: [station.longitude, station.latitude],
        mode: station.mode,
        modeLabel: station.modeLabel,
        stepFreeAccess: station.stepFreeAccess,
        elevators: station.hasElevator ? (station.platforms || 2) : 0,
        ramps: station.hasRamp,
        stairs: 2,
        stepFreeEntrance: station.stepFreeAccess ? 'Level / Ramped Entrance' : 'Steps Only'
      });
    }
  };

  const getModeIcon = (mode) => {
    switch (mode) {
      case 'chennai_metro':
        return <Train className="w-3.5 h-3.5 text-[#0072CE]" />;
      case 'suburban_rail':
        return <Train className="w-3.5 h-3.5 text-[#059669]" />;
      case 'mtc_bus':
        return <Bus className="w-3.5 h-3.5 text-[#263B68]" />;
      case 'express_rail':
        return <Compass className="w-3.5 h-3.5 text-[#7C3AED]" />;
      default:
        return <MapPin className="w-3.5 h-3.5 text-[#5B6E88]" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#DCE3EB] shadow-xs space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#263B68] text-white flex items-center justify-center font-bold">
                <Layers className="w-4 h-4 text-[#60C4D4]" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-[#263B68] leading-tight">
                  Chennai Transit Explorer
                </h2>
                <p className="text-[11px] text-[#5B6E88] font-medium">
                  Curated Network of 140 Stations, Terminals & Interchange Hubs
                </p>
              </div>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#F5F3ED] text-[#263B68] border border-[#DCE3EB] shrink-0">
            Routing Safely Isolated
          </span>
        </div>

        {/* View Switcher Subtabs */}
        <div className="flex items-center p-1 bg-[#F5F3ED] rounded-xl border border-[#DCE3EB] text-xs font-bold">
          <button
            type="button"
            onClick={() => setExplorerViewMode('list')}
            className={`flex-1 py-1.5 px-2 rounded-lg transition-all cursor-pointer ${
              explorerViewMode === 'list'
                ? 'bg-[#263B68] text-[#FFFFFF] shadow-xs'
                : 'text-[#5B6E88] hover:text-[#263B68]'
            }`}
          >
            Stations ({filteredStations.length})
          </button>
          <button
            type="button"
            onClick={() => setExplorerViewMode('corridors')}
            className={`flex-1 py-1.5 px-2 rounded-lg transition-all cursor-pointer ${
              explorerViewMode === 'corridors'
                ? 'bg-[#263B68] text-[#FFFFFF] shadow-xs'
                : 'text-[#5B6E88] hover:text-[#263B68]'
            }`}
          >
            Corridors (6)
          </button>
          <button
            type="button"
            onClick={() => setExplorerViewMode('transparency')}
            className={`flex-1 py-1.5 px-2 rounded-lg transition-all cursor-pointer ${
              explorerViewMode === 'transparency'
                ? 'bg-[#263B68] text-[#FFFFFF] shadow-xs'
                : 'text-[#5B6E88] hover:text-[#263B68]'
            }`}
          >
            Data Audit
          </button>
        </div>

        {/* Mode Visibility Filters */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-bold text-[#5B6E88] flex items-center justify-between">
            <span>Transport Modes</span>
            <button
              type="button"
              onClick={() => setStepFreeOnly((prev) => !prev)}
              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition-all cursor-pointer flex items-center gap-1 ${
                stepFreeOnly
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-[#5B6E88] border-[#DCE3EB] hover:border-emerald-600 hover:text-emerald-700'
              }`}
            >
              <Accessibility className="w-3 h-3" />
              <span>Step-Free Only</span>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {Object.values(TRANSIT_MODES).map((mode) => {
              const isActive = explorerActiveModes.includes(mode.id);
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => toggleExplorerMode(mode.id)}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#FFFFFF] shadow-xs ' + mode.borderClass + ' text-[#263B68]'
                      : 'bg-[#F5F3ED] border-transparent text-[#8CA0BA] opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black ${
                        isActive ? mode.badgeClass : 'bg-slate-300 text-slate-600'
                      }`}
                    >
                      {mode.badge}
                    </span>
                    <span className="truncate">{mode.shortLabel}</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#F5F3ED] text-[#5B6E88]">
                    {mode.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* SELECTED STATION DETAIL PANEL */}
      {selectedStation && (
        <div className="bg-[#FFFFFF] p-4 rounded-2xl border-2 border-[#60C4D4] shadow-md space-y-3 relative">
          <button
            type="button"
            onClick={() => setSelectedStation(null)}
            className="absolute top-3 right-3 text-[#5B6E88] hover:text-[#263B68] p-1 rounded-lg hover:bg-[#F5F3ED] cursor-pointer"
            title="Close station details"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-2.5 pr-6">
            <span
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                TRANSIT_MODES[selectedStation.mode]?.badgeClass || 'bg-[#263B68] text-white'
              }`}
            >
              {selectedStation.markerBadge}
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-black text-[#263B68] leading-tight">
                  {selectedStation.name}
                </h3>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#F5F3ED] text-[#263B68] border border-[#DCE3EB]">
                  {selectedStation.code}
                </span>
              </div>
              {selectedStation.tamilName && (
                <div className="text-xs text-[#5B6E88] font-medium mt-0.5">
                  {selectedStation.tamilName}
                </div>
              )}
            </div>
          </div>

          {/* Quick facts grid */}
          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
            <div className="p-2 rounded-xl bg-[#F5F3ED] border border-[#DCE3EB]">
              <div className="text-[10px] text-[#5B6E88] font-semibold">Operator & Mode</div>
              <div className="font-bold text-[#263B68] truncate">{selectedStation.modeLabel}</div>
              <div className="text-[10px] text-[#5B6E88] truncate">{selectedStation.operator}</div>
            </div>
            <div className="p-2 rounded-xl bg-[#F5F3ED] border border-[#DCE3EB]">
              <div className="text-[10px] text-[#5B6E88] font-semibold">District & Platforms</div>
              <div className="font-bold text-[#263B68]">{selectedStation.district}</div>
              <div className="text-[10px] text-[#5B6E88]">
                {selectedStation.platforms} platform{selectedStation.platforms > 1 ? 's' : ''} •{' '}
                {selectedStation.stationType}
              </div>
            </div>
          </div>

          {/* Accessibility status breakdown */}
          <div className="space-y-1.5 p-2.5 rounded-xl bg-[#EEF7F9] border border-[#60C4D4]">
            <div className="flex items-center justify-between text-xs font-bold text-[#263B68]">
              <span className="flex items-center gap-1.5">
                <Accessibility className="w-3.5 h-3.5 text-[#263B68]" />
                Station Accessibility Features
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  selectedStation.stepFreeAccess
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {selectedStation.stepFreeAccess ? 'Step-Free Verified' : 'Limited Step-Free'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-[10px] pt-1">
              <div className="bg-[#FFFFFF] p-1.5 rounded-lg border border-[#DCE3EB] text-center">
                <div className="text-[#5B6E88]">Elevators</div>
                <div className="font-bold text-[#263B68] text-[10px]">
                  {selectedStation.hasElevator
                    ? (selectedStation.mode === 'suburban_rail' ? 'Available (Divyangjan)' : 'Available')
                    : (selectedStation.mode === 'suburban_rail' ? 'None (FOB Stairs)' : selectedStation.mode === 'mtc_bus' ? 'N/A' : 'None')}
                </div>
              </div>
              <div className="bg-[#FFFFFF] p-1.5 rounded-lg border border-[#DCE3EB] text-center">
                <div className="text-[#5B6E88]">Access Ramps</div>
                <div className="font-bold text-[#263B68] text-[10px]">
                  {selectedStation.hasRamp
                    ? (selectedStation.mode === 'mtc_bus' ? 'Curb Ramps' : 'Installed')
                    : 'None'}
                </div>
              </div>
              <div className="bg-[#FFFFFF] p-1.5 rounded-lg border border-[#DCE3EB] text-center">
                <div className="text-[#5B6E88]">Interchange</div>
                <div className="font-bold text-[#263B68] text-[10px]">
                  {selectedStation.isInterchange ? 'Intermodal' : 'Standard'}
                </div>
              </div>
            </div>
            {selectedStation.accessibilitySource && (
              <div className="text-[9px] text-[#5B6E88] pt-1 border-t border-[#60C4D4]/30 leading-tight">
                <strong>Source:</strong> {selectedStation.accessibilitySource}
              </div>
            )}
          </div>

          {/* Interchange Connections */}
          {selectedStation.interchangeWith && selectedStation.interchangeWith.length > 0 && (
            <div className="text-[11px] space-y-1">
              <span className="font-bold text-[#263B68]">Interchange Connections:</span>
              <div className="flex flex-wrap gap-1">
                {selectedStation.interchangeWith.map((conn, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] px-2 py-0.5 rounded bg-[#F5F3ED] text-[#263B68] border border-[#DCE3EB]"
                  >
                    {conn}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Timetable / Verification Transparency Notice */}
          <div className="p-2.5 rounded-xl bg-[#F5F3ED] border border-[#DCE3EB] space-y-1 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#263B68] flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-[#5B6E88]" />
                Timetable Data Isolation Notice
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-200 font-bold">
                {selectedStation.timetableStatus}
              </span>
            </div>
            <p className="text-[10px] text-[#5B6E88] leading-relaxed">
              {selectedStation.timetableNote}
            </p>
          </div>

          {/* Action Buttons: Set as Origin / Set as Destination */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => setStationAsOrigin(selectedStation)}
              className="py-2 px-3 rounded-xl bg-[#263B68] text-white text-xs font-bold hover:bg-[#1B2B4C] transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Navigation2 className="w-3.5 h-3.5 text-[#60C4D4]" />
              <span>Set as Origin</span>
            </button>
            <button
              type="button"
              onClick={() => setStationAsDestination(selectedStation)}
              className="py-2 px-3 rounded-xl bg-[#60C4D4] text-[#263B68] text-xs font-bold hover:bg-[#4FB3C3] transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
            >
              <MapPin className="w-3.5 h-3.5 text-[#263B68]" />
              <span>Set as Destination</span>
            </button>
          </div>
        </div>
      )}

      {/* VIEW 1: STATIONS LIST & SEARCH */}
      {explorerViewMode === 'list' && (
        <div className="space-y-3">
          {/* Instant Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#8CA0BA] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={explorerSearchQuery}
              onChange={(e) => setExplorerSearchQuery(e.target.value)}
              placeholder="Search station, hub, locality, or code (e.g. Guindy, BWAY)..."
              className="w-full pl-9 pr-8 py-2.5 bg-white border border-[#DCE3EB] rounded-xl text-xs font-medium text-[#263B68] placeholder-[#8CA0BA] focus:outline-none focus:ring-2 focus:ring-[#60C4D4] focus:border-transparent transition-all shadow-xs"
            />
            {explorerSearchQuery && (
              <button
                type="button"
                onClick={() => setExplorerSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8CA0BA] hover:text-[#263B68] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between text-[11px] text-[#5B6E88] px-1 font-medium">
            <span>
              Showing <strong className="text-[#263B68]">{filteredStations.length}</strong> of 140 curated locations
            </span>
            {explorerSearchQuery && (
              <span>Matching &ldquo;{explorerSearchQuery}&rdquo;</span>
            )}
          </div>

          {/* Station Cards Grid */}
          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {filteredStations.length === 0 ? (
              <div className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#DCE3EB] text-center space-y-2">
                <Info className="w-6 h-6 text-[#8CA0BA] mx-auto" />
                <h4 className="text-xs font-bold text-[#263B68]">No Stations Matched</h4>
                <p className="text-[11px] text-[#5B6E88]">
                  Try searching a different locality, station name, or enable more transport modes above.
                </p>
              </div>
            ) : (
              filteredStations.map((station) => {
                const isSelected = selectedStation?.id === station.id;
                const modeMeta = TRANSIT_MODES[station.mode];
                return (
                  <div
                    key={station.id}
                    data-station-code={station.code}
                    onClick={() => handleSelectStation(station)}
                    className={`station-card-item p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#FFFFFF] border-2 border-[#60C4D4] shadow-sm'
                        : 'bg-[#FFFFFF] border-[#DCE3EB] hover:border-[#8CA0BA] hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <span
                          className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5 ${
                            modeMeta?.badgeClass || 'bg-[#263B68] text-white'
                          }`}
                        >
                          {station.markerBadge}
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-extrabold text-[#263B68]">
                              {station.name}
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[#F5F3ED] text-[#263B68] border border-[#DCE3EB]">
                              {station.code}
                            </span>
                          </div>
                          {station.tamilName && (
                            <div className="text-[10px] text-[#5B6E88]">
                              {station.tamilName}
                            </div>
                          )}
                          <div className="text-[10px] text-[#5B6E88] mt-1 flex items-center gap-2 flex-wrap">
                            <span>{station.modeLabel}</span>
                            <span>•</span>
                            <span>{station.district}</span>
                            {station.stepFreeAccess && (
                              <>
                                <span>•</span>
                                <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                                  <Accessibility className="w-2.5 h-2.5" /> Step-free
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <ChevronRight className="w-4 h-4 text-[#8CA0BA]" />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: CORRIDORS & STATION SEQUENCES */}
      {explorerViewMode === 'corridors' && (
        <div className="space-y-3">
          {/* Corridor Selector Buttons */}
          <div className="grid grid-cols-2 gap-1.5">
            {TRANSIT_CORRIDORS.map((corr) => {
              const isSelected = corr.id === activeCorridor.id;
              return (
                <button
                  key={corr.id}
                  type="button"
                  onClick={() => setSelectedCorridorId(corr.id)}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#FFFFFF] border-2 border-[#263B68] shadow-xs'
                      : 'bg-[#F5F3ED] border-[#DCE3EB] hover:bg-[#FFFFFF]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-[#263B68]">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: corr.color }}
                    />
                    <span className="truncate">{corr.name}</span>
                  </div>
                  <div className="text-[10px] text-[#5B6E88] mt-0.5">
                    {corr.stations.length} verified stations
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Corridor Card */}
          <div className="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#DCE3EB] shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="w-3.5 h-3.5 rounded-full"
                  style={{ backgroundColor: activeCorridor.color }}
                />
                <h3 className="text-sm font-extrabold text-[#263B68]">
                  {activeCorridor.name}
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold bg-[#F5F3ED] px-2 py-0.5 rounded border border-[#DCE3EB] text-[#263B68]">
                {activeCorridor.stations.length} Stops
              </span>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-1 text-[11px] text-[#5B6E88]">
              <div>
                <strong>Terminals:</strong> {activeCorridor.terminals.join(' ⟷ ')}
              </div>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                activeCorridor.connectionType === 'verified_physical'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : activeCorridor.connectionType === 'historical_timetable'
                  ? 'bg-teal-50 text-teal-800 border-teal-200'
                  : activeCorridor.connectionType === 'provisional_catalogue'
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-blue-50 text-blue-800 border-blue-200'
              }`}>
                {activeCorridor.connectionTypeLabel || 'Catalogue Alignment'}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-[#F5F3ED] border border-[#DCE3EB] text-[10px] text-[#5B6E88] leading-relaxed space-y-1">
              <div>
                Station sequence illustrates catalogue connectivity along the physical corridor. Operating timetables, live frequency, and train schedules are not inferred.
              </div>
              {activeCorridor.connectionNote && (
                <div className="text-amber-800 font-medium">
                  <strong>Notice:</strong> {activeCorridor.connectionNote}
                </div>
              )}
            </div>

            {/* Linear Station Sequence */}
            <div className="pt-2 space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
              {activeCorridor.stations.map((st, index) => {
                const isSelected = selectedStation?.id === st.id;
                const isFirst = index === 0;
                const isLast = index === activeCorridor.stations.length - 1;
                return (
                  <div
                    key={st.id}
                    onClick={() => handleSelectStation(st)}
                    className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#EEF7F9] border-[#60C4D4] font-bold'
                        : 'bg-[#FFFFFF] border-[#DCE3EB] hover:bg-[#F5F3ED]'
                    }`}
                  >
                    <div className="w-5 flex flex-col items-center">
                      <div
                        className={`w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center ${
                          isFirst || isLast ? 'bg-[#263B68]' : 'bg-[#60C4D4]'
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0 flex items-center justify-between gap-1">
                      <div className="truncate">
                        <span className="text-xs font-bold text-[#263B68]">
                          {index + 1}. {st.name}
                        </span>
                        {st.tamilName && (
                          <span className="text-[10px] text-[#8CA0BA] ml-1.5">
                            {st.tamilName}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {st.stepFreeAccess && (
                          <span className="w-2 h-2 rounded-full bg-emerald-600" title="Step-free access" />
                        )}
                        <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-[#F5F3ED] text-[#5B6E88] border border-[#DCE3EB]">
                          {st.code}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: DATA AUDIT & TRANSPARENCY */}
      {explorerViewMode === 'transparency' && (
        <div className="space-y-3">
          <div className="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#DCE3EB] shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#263B68]">
              <ShieldAlert className="w-4 h-4 text-[#263B68]" />
              <span>Data Source Audit & Verification Status</span>
            </div>
            <p className="text-[11px] text-[#5B6E88] leading-relaxed">
              AccessRoute follows strict integrity rules. Where public transit datasets have expired calendars, distant placeholder dates, or proprietary barriers, production journey routing is kept disabled to avoid misinforming passengers.
            </p>
          </div>

          {/* Mode Audit Cards */}
          <div className="space-y-2.5">
            {Object.values(TRANSIT_MODES).map((mode) => (
              <div
                key={mode.id}
                className="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#DCE3EB] shadow-xs space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black ${mode.badgeClass}`}>
                      {mode.badge}
                    </span>
                    <span className="font-extrabold text-[#263B68]">{mode.label}</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-[#F5F3ED] px-2 py-0.5 rounded border border-[#DCE3EB] text-[#263B68]">
                    {mode.count} Curated Stops
                  </span>
                </div>

                <div className="text-[11px] text-[#5B6E88]">
                  <strong>Operator:</strong> {mode.operator}
                </div>

                <div className="p-2 rounded-xl bg-[#F5F3ED] border border-[#DCE3EB] space-y-1 text-[10px] text-[#5B6E88]">
                  <div className="flex items-center justify-between font-bold text-[#263B68]">
                    <span>Routing Blocker Reason</span>
                    <span className="font-mono text-amber-900 bg-amber-100 px-1 rounded">
                      {mode.timetableStatus}
                    </span>
                  </div>
                  <p>
                    {mode.id === 'chennai_metro' &&
                      'Static GTFS calendar expired on 2021-12-31. Live headways are not available in open formats.'}
                    {mode.id === 'suburban_rail' &&
                      'Schedule dataset contains placeholder 2170 calendar end dates and unconfirmed redistribution rights.'}
                    {mode.id === 'mtc_bus' &&
                      'MTC GTFS is an unauthenticated reverse-engineering scrape; real-time GPS (Chalo) is closed.'}
                    {mode.id === 'express_rail' &&
                      'Catalogued exclusively for major terminal intermodal boundaries. PRS/UTS ticket separation applies.'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
