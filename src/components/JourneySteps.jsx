import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Bus, Train, Footprints, ArrowDownUp, MapPin, CheckCircle2, Accessibility, CornerDownRight } from 'lucide-react';

export function JourneySteps() {
  const { selectedRoute, journeySubTab, setJourneySubTab, setCurrentView } = useContext(AppContext);

  return (
    <div className="bg-white rounded-t-3xl md:rounded-2xl p-4 md:p-6 shadow-sm border border-slate-100 max-w-xl mx-auto space-y-4 pb-20 md:pb-6">
      {/* Top Handle for mobile */}
      <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-2 md:hidden" />

      {/* Header Info */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-[#1F3A5F] tracking-tight">To Guindy</h2>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">Chennai Central • 45 min</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#6EE7B7] text-[#064E3B] text-xs font-bold shadow-2xs">
          <Accessibility className="w-4 h-4" />
          <span>Accessible Route</span>
        </div>
      </div>

      {/* Map / Steps Segmented Tab Toggle */}
      <div className="p-1 rounded-xl bg-slate-100 flex items-center gap-1">
        <button
          onClick={() => {
            setJourneySubTab('map');
            setCurrentView('route-details');
          }}
          className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all ${
            journeySubTab === 'map'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Map
        </button>
        <button
          onClick={() => setJourneySubTab('steps')}
          className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all ${
            journeySubTab === 'steps'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Steps
        </button>
      </div>

      {/* Vertical Timeline */}
      <div className="py-2 pl-2 space-y-0 relative">
        {/* Step 1: Walk 120m */}
        <div className="flex gap-4 relative pb-6">
          {/* Vertical connecting line */}
          <div className="absolute left-[17px] top-8 bottom-0 w-0.5 bg-[#1F3A5F]" />

          <div className="w-9 h-9 rounded-full bg-white border-2 border-slate-300 text-slate-700 flex items-center justify-center shrink-0 z-10 shadow-2xs">
            <Footprints className="w-4 h-4" />
          </div>

          <div className="pt-1">
            <h2 className="text-base font-bold text-slate-900 leading-snug">Walk 120m</h2>
            <p className="text-xs font-medium text-slate-500">Step-free path</p>
          </div>
        </div>

        {/* Step 2: MTC Bus 21 */}
        <div className="flex gap-4 relative pb-6">
          <div className="absolute left-[17px] top-8 bottom-0 w-0.5 bg-[#1F3A5F]" />

          <div className="w-9 h-9 rounded-full bg-[#1F3A5F] text-white flex items-center justify-center shrink-0 z-10 shadow-xs">
            <Bus className="w-4 h-4" />
          </div>

          <div className="pt-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-[#FF9800] text-slate-900 font-extrabold text-[11px] uppercase tracking-wide">
                MTC Bus 21
              </span>
              <span className="text-sm font-bold text-slate-900">Take Bus</span>
            </div>
            <p className="text-xs font-medium text-slate-500 mt-0.5">Low-floor, Ramp</p>
          </div>
        </div>

        {/* Step 3: Transfer 80m */}
        <div className="flex gap-4 relative pb-6">
          <div className="absolute left-[17px] top-8 bottom-0 w-0.5 bg-[#1F3A5F]" />

          <div className="w-9 h-9 rounded-full bg-white border-2 border-slate-300 text-slate-700 flex items-center justify-center shrink-0 z-10 shadow-2xs">
            <CornerDownRight className="w-4 h-4" />
          </div>

          <div className="pt-1">
            <h2 className="text-base font-bold text-slate-900 leading-snug">Transfer 80m</h2>
            <p className="text-xs font-medium text-slate-500">Smooth transition</p>
          </div>
        </div>

        {/* Step 4: Use Elevator B */}
        <div className="flex gap-4 relative pb-6">
          <div className="absolute left-[17px] top-8 bottom-0 w-0.5 bg-[#1F3A5F]" />

          <div className="w-9 h-9 rounded-full bg-white border-2 border-[#1AC8A0] text-[#064E3B] flex items-center justify-center shrink-0 z-10 shadow-2xs">
            <ArrowDownUp className="w-4 h-4" />
          </div>

          <div className="pt-1">
            <h2 className="text-base font-bold text-slate-900 leading-snug">Use Elevator B</h2>
            <p className="text-xs font-medium text-slate-500">Step-free to platform</p>
          </div>
        </div>

        {/* Step 5: Chennai Metro */}
        <div className="flex gap-4 relative pb-6">
          <div className="absolute left-[17px] top-8 bottom-0 w-0.5 bg-[#1F3A5F]" />

          <div className="w-9 h-9 rounded-full bg-[#1F3A5F] text-white flex items-center justify-center shrink-0 z-10 shadow-xs">
            <Train className="w-4 h-4" />
          </div>

          <div className="pt-1">
            <h2 className="text-base font-bold text-slate-900 leading-snug">Chennai Metro</h2>
            <p className="text-xs font-medium text-slate-500">Board train</p>
          </div>
        </div>

        {/* Step 6: Destination Guindy */}
        <div className="flex gap-4 relative">
          <div className="w-9 h-9 rounded-full bg-white border-2 border-[#1F3A5F] text-[#1F3A5F] flex items-center justify-center shrink-0 z-10 shadow-2xs">
            <MapPin className="w-4 h-4" />
          </div>

          <div className="pt-0 flex-1">
            {/* Destination Card Container */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 shadow-2xs">
              <div>
                <h2 className="text-lg font-extrabold text-[#1F3A5F]">Destination (Guindy)</h2>
                <div className="flex items-center gap-1.5 mt-0.5 text-xs font-bold text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verified/Accessible</span>
                </div>
              </div>

              {/* Grid 2x2 Station Details */}
              <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-800">
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center gap-2">
                  <ArrowDownUp className="w-4 h-4 text-[#1F3A5F] shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-500 font-medium">Elevators</div>
                    <div>2 Available</div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center gap-2">
                  <Accessibility className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-500 font-medium">Ramp</div>
                    <div>Available</div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600 shrink-0">🪜</span>
                  <div>
                    <div className="text-[10px] text-slate-500 font-medium">Stairs</div>
                    <div>Present</div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#1AC8A0] shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-500 font-medium">Gate 2</div>
                    <div>Step-free</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
