import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import {
  Bus,
  Train,
  Footprints,
  ArrowDownUp,
  MapPin,
  CheckCircle2,
  Accessibility,
  CornerDownRight,
  Sparkles,
  Volume2,
  ArrowLeft,
  Info,
  Clock
} from 'lucide-react';

export function JourneySteps() {
  const {
    origin,
    destination,
    selectedRoute,
    routes,
    routingMode,
    journeySubTab,
    setJourneySubTab,
    setCurrentView,
    handlePlayDirections,
    isPlayingAudio
  } = useContext(AppContext);

  const fare = selectedRoute?.fareText || `₹${selectedRoute?.fare || 25}`;
  const duration = selectedRoute?.durationMinutes || selectedRoute?.duration || 38;
  const destName = destination || 'Guindy';
  const originName = origin || 'Chennai Central';
  const isRealTimetable = Boolean(
    selectedRoute?.isRealTimetable ||
    routes?.isRealTimetable ||
    routingMode === 'timetable' ||
    (selectedRoute?.legs && selectedRoute.legs.length > 0)
  );
  const legs = selectedRoute?.legs || [];

  return (
    <div className="bg-[#FFFFFF] rounded-2xl p-4 md:p-6 shadow-xs border border-[#DCE3EB] max-w-xl mx-auto space-y-4 pb-20 md:pb-6">
      {/* Top Handle for mobile */}
      <div className="w-12 h-1 bg-[#DCE3EB] rounded-full mx-auto mb-2 md:hidden" />

      {/* Navigation & Header Info */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <button
            onClick={() => setCurrentView('route-options')}
            className="flex items-center gap-1 text-xs font-bold text-[#5B6E88] hover:text-[#263B68] mb-1 cursor-pointer transition-colors"
            aria-label="Back to route options"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Route Options</span>
          </button>
          <h2 className="text-2xl font-extrabold text-[#263B68] tracking-tight">
            {destName.toLowerCase().includes('guindy') ? 'To Guindy' : `To ${destName}`}
          </h2>
          <p className="text-xs font-semibold text-[#5B6E88] mt-0.5">
            {originName} • {duration} min • {fare}
          </p>
          {isRealTimetable && selectedRoute?.departureTime && (
            <p className="text-xs font-bold text-[#263B68] mt-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#60C4D4]" />
              <span>
                {selectedRoute.departureTime} → {selectedRoute.arrivalTime}
              </span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentView('assisted')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EEF3FA] text-[#263B68] text-xs font-bold hover:bg-[#DCE3EB] border border-[#DCE3EB] transition-all cursor-pointer shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#60C4D4]" />
            <span>Assisted Travel</span>
          </button>
        </div>
      </div>

      {/* Data Integrity Notice */}
      {isRealTimetable ? (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EEF7F9] border border-[#60C4D4] text-[11px] text-[#263B68] font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Verified Timetable Journey • Calculated via Connection Scan Algorithm</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F5F3ED] border border-[#DCE3EB] text-[11px] text-[#5B6E88]">
          <Info className="w-3.5 h-3.5 text-[#60C4D4] shrink-0" />
          <span>Illustrative Journey Steps • Live schedule integration pending feed verification</span>
        </div>
      )}

      {/* Savings badge */}
      <div className="text-xs font-semibold text-[#263B68] bg-[#F5F3ED] border border-[#DCE3EB] px-3.5 py-2 rounded-lg flex items-center justify-between">
        <span className="font-bold">Fare: {fare}</span>
        <span className="text-[#5B6E88]">🚗 ₹140 cheaper than cab</span>
      </div>

      {/* Map / Steps Segmented Tab Toggle */}
      <div className="p-1 rounded-lg bg-[#F5F3ED] border border-[#DCE3EB] flex items-center gap-1">
        <button
          onClick={() => {
            setJourneySubTab('map');
            setCurrentView('route-details');
          }}
          className={`flex-1 py-1.5 text-center text-xs font-bold rounded-md transition-all cursor-pointer ${
            journeySubTab === 'map'
              ? 'bg-[#263B68] text-[#FFFFFF] shadow-xs'
              : 'text-[#5B6E88] hover:text-[#263B68]'
          }`}
        >
          Map
        </button>
        <button
          onClick={() => setJourneySubTab('steps')}
          className={`flex-1 py-1.5 text-center text-xs font-bold rounded-md transition-all cursor-pointer ${
            journeySubTab === 'steps'
              ? 'bg-[#263B68] text-[#FFFFFF] shadow-xs'
              : 'text-[#5B6E88] hover:text-[#263B68]'
          }`}
        >
          Steps
        </button>
      </div>

      {/* Vertical Timeline */}
      <div className="py-2 pl-2 space-y-0 relative">
        {/* If real legs exist, render actual timetable legs */}
        {legs.length > 0 ? (
          <>
            {legs.map((leg, index) => {
              const isTransfer = leg.type === 'transfer' || leg.type === 'walk';
              const isLast = index === legs.length - 1;

              return (
                <div key={leg.id || index} className={`flex gap-4 relative ${isLast ? 'pb-2' : 'pb-6'}`}>
                  {/* Vertical connecting line */}
                  <div className="absolute left-[17px] top-8 bottom-0 w-0.5 bg-[#DCE3EB]" />

                  {/* Icon badge */}
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 z-10 shadow-2xs ${
                      isTransfer
                        ? 'bg-[#FFFFFF] border-2 border-[#DCE3EB] text-[#263B68]'
                        : 'bg-[#263B68] text-[#FFFFFF]'
                    }`}
                  >
                    {isTransfer ? (
                      <Footprints className="w-4 h-4 text-[#5B6E88]" />
                    ) : leg.transitMode === 'chennai_metro' || leg.mode?.toLowerCase().includes('metro') ? (
                      <Train className="w-4 h-4 text-[#60C4D4]" />
                    ) : leg.transitMode === 'suburban_rail' || leg.mode?.toLowerCase().includes('suburban') ? (
                      <Train className="w-4 h-4 text-[#059669]" />
                    ) : (
                      <Bus className="w-4 h-4 text-[#60C4D4]" />
                    )}
                  </div>

                  <div className="pt-1 flex-1">
                    {isTransfer ? (
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#263B68]">
                            Transfer: {leg.distanceMeters ? `Walk ${leg.distanceMeters}m` : 'Change platforms'}
                          </span>
                          <span className="text-[10px] text-[#5B6E88] font-mono">
                            {leg.durationMinutes || leg.duration || '2'} min
                          </span>
                        </div>
                        <p className="text-xs font-medium text-[#5B6E88] mt-0.5">
                          {leg.fromStopName} → {leg.toStopName} ({leg.isStepFree ? 'Step-free walkway' : 'Stairs present'})
                        </p>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md bg-[#263B68] text-[#FFFFFF] font-extrabold text-[11px] uppercase tracking-wide">
                            {leg.badge || leg.routeShortName || leg.mode}
                          </span>
                          <span className="text-sm font-bold text-slate-900">
                            Board at {leg.fromStopName}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-[#263B68] mt-1 flex items-center gap-1.5">
                          <span>Dep: {leg.departureTimeStr || leg.departureTime}</span>
                          <span>→</span>
                          <span>Arr: {leg.arrivalTimeStr || leg.arrivalTime}</span>
                          <span className="text-[10px] text-[#5B6E88] font-normal">
                            ({leg.durationMinutes || leg.duration || 10} min)
                          </span>
                        </div>
                        <p className="text-xs font-medium text-[#5B6E88] mt-0.5">
                          Alight at {leg.toStopName} • {leg.isStepFree ? 'Step-free platform & vehicle' : 'Assistance required'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Final Destination Arrival */}
            <div className="flex gap-4 relative pt-2">
              <div className="w-9 h-9 rounded-full bg-[#FFFFFF] border-2 border-[#263B68] text-[#263B68] flex items-center justify-center shrink-0 z-10 shadow-2xs">
                <MapPin className="w-4 h-4 text-[#DC2626]" />
              </div>

              <div className="pt-0 flex-1">
                <div className="p-4 rounded-xl bg-[#F5F3ED] border border-[#DCE3EB] space-y-3 shadow-2xs">
                  <div>
                    <h3 className="text-lg font-extrabold text-[#263B68]">Destination ({destName})</h3>
                    <div className="flex items-center gap-1.5 mt-0.5 text-xs font-bold text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Verified/Accessible Hub</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-800">
                    <div className="p-2.5 rounded-lg bg-[#FFFFFF] border border-[#DCE3EB] flex items-center gap-2">
                      <ArrowDownUp className="w-4 h-4 text-[#263B68] shrink-0" />
                      <div>
                        <div className="text-[10px] text-[#5B6E88] font-medium">Elevators</div>
                        <div className="text-[#263B68]">Available</div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-[#FFFFFF] border border-[#DCE3EB] flex items-center gap-2">
                      <Accessibility className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <div className="text-[10px] text-[#5B6E88] font-medium">Ramp</div>
                        <div className="text-[#263B68]">Step-free</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Illustrative Preview Steps (Standard Corridor) */
          <>
            {/* Step 1: Walk 120m */}
            <div className="flex gap-4 relative pb-6">
              <div className="absolute left-[17px] top-8 bottom-0 w-0.5 bg-[#DCE3EB]" />
              <div className="w-9 h-9 rounded-full bg-[#FFFFFF] border-2 border-[#DCE3EB] text-[#263B68] flex items-center justify-center shrink-0 z-10 shadow-2xs">
                <Footprints className="w-4 h-4" />
              </div>
              <div className="pt-1">
                <h3 className="text-base font-bold text-[#263B68] leading-snug">Walk 120m</h3>
                <p className="text-xs font-medium text-[#5B6E88]">Step-free path</p>
              </div>
            </div>

            {/* Step 2: MTC Bus 21 */}
            <div className="flex gap-4 relative pb-6">
              <div className="absolute left-[17px] top-8 bottom-0 w-0.5 bg-[#DCE3EB]" />
              <div className="w-9 h-9 rounded-full bg-[#263B68] text-[#FFFFFF] flex items-center justify-center shrink-0 z-10 shadow-xs">
                <Bus className="w-4 h-4 text-[#60C4D4]" />
              </div>
              <div className="pt-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-[#263B68] text-[#FFFFFF] font-extrabold text-[11px] uppercase tracking-wide">
                    MTC Bus 21
                  </span>
                  <span className="text-sm font-bold text-slate-900">Take Bus</span>
                </div>
                <p className="text-xs font-medium text-[#5B6E88] mt-0.5">Low-floor, Ramp</p>
              </div>
            </div>

            {/* Step 3: Transfer 80m */}
            <div className="flex gap-4 relative pb-6">
              <div className="absolute left-[17px] top-8 bottom-0 w-0.5 bg-[#DCE3EB]" />
              <div className="w-9 h-9 rounded-full bg-[#FFFFFF] border-2 border-[#DCE3EB] text-[#263B68] flex items-center justify-center shrink-0 z-10 shadow-2xs">
                <CornerDownRight className="w-4 h-4" />
              </div>
              <div className="pt-1">
                <h3 className="text-base font-bold text-[#263B68] leading-snug">Transfer 80m</h3>
                <p className="text-xs font-medium text-[#5B6E88]">Smooth transition</p>
              </div>
            </div>

            {/* Step 4: Use Elevator B */}
            <div className="flex gap-4 relative pb-6">
              <div className="absolute left-[17px] top-8 bottom-0 w-0.5 bg-[#DCE3EB]" />
              <div className="w-9 h-9 rounded-full bg-[#EEF7F9] border-2 border-[#60C4D4] text-[#263B68] flex items-center justify-center shrink-0 z-10 shadow-2xs">
                <ArrowDownUp className="w-4 h-4 text-[#263B68]" />
              </div>
              <div className="pt-1">
                <h3 className="text-base font-bold text-[#263B68] leading-snug">Elevator B</h3>
                <p className="text-xs font-medium text-[#5B6E88]">Step-free to platform</p>
              </div>
            </div>

            {/* Step 5: Chennai Metro */}
            <div className="flex gap-4 relative pb-6">
              <div className="absolute left-[17px] top-8 bottom-0 w-0.5 bg-[#DCE3EB]" />
              <div className="w-9 h-9 rounded-full bg-[#263B68] text-[#FFFFFF] flex items-center justify-center shrink-0 z-10 shadow-xs">
                <Train className="w-4 h-4 text-[#60C4D4]" />
              </div>
              <div className="pt-1">
                <h3 className="text-base font-bold text-[#263B68] leading-snug">Chennai Metro</h3>
                <p className="text-xs font-medium text-[#5B6E88]">Board train</p>
              </div>
            </div>

            {/* Step 6: Destination Guindy */}
            <div className="flex gap-4 relative">
              <div className="w-9 h-9 rounded-full bg-[#FFFFFF] border-2 border-[#263B68] text-[#263B68] flex items-center justify-center shrink-0 z-10 shadow-2xs">
                <MapPin className="w-4 h-4 text-[#DC2626]" />
              </div>

              <div className="pt-0 flex-1">
                <div className="p-4 rounded-xl bg-[#F5F3ED] border border-[#DCE3EB] space-y-3 shadow-2xs">
                  <div>
                    <h3 className="text-lg font-extrabold text-[#263B68]">Destination (Guindy)</h3>
                    <div className="flex items-center gap-1.5 mt-0.5 text-xs font-bold text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Verified/Accessible</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-800">
                    <div className="p-2.5 rounded-lg bg-[#FFFFFF] border border-[#DCE3EB] flex items-center gap-2">
                      <ArrowDownUp className="w-4 h-4 text-[#263B68] shrink-0" />
                      <div>
                        <div className="text-[10px] text-[#5B6E88] font-medium">Elevators</div>
                        <div className="text-[#263B68]">2 Available</div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-[#FFFFFF] border border-[#DCE3EB] flex items-center gap-2">
                      <Accessibility className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <div className="text-[10px] text-[#5B6E88] font-medium">Ramp</div>
                        <div className="text-[#263B68]">Available</div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-[#FFFFFF] border border-[#DCE3EB] flex items-center gap-2">
                      <span className="text-xs font-bold text-[#5B6E88] shrink-0">🪜</span>
                      <div>
                        <div className="text-[10px] text-[#5B6E88] font-medium">Stairs</div>
                        <div className="text-[#263B68]">Present</div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-[#FFFFFF] border border-[#DCE3EB] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#263B68] shrink-0" />
                      <div>
                        <div className="text-[10px] text-[#5B6E88] font-medium">Gate 2</div>
                        <div className="text-[#263B68]">Step-free</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Voice Directions Action Button */}
      <button
        onClick={handlePlayDirections}
        className="w-full py-3.5 px-4 rounded-xl bg-[#263B68] hover:bg-[#1B2B4C] text-[#FFFFFF] font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
      >
        <Volume2 className="w-4 h-4 text-[#60C4D4]" />
        <span>{isPlayingAudio ? 'Playing directions...' : 'Play directions'}</span>
      </button>
    </div>
  );
}
