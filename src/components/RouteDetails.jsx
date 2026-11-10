import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Bus, Train, ArrowDownUp, Accessibility, AlertTriangle, CheckCircle2, Navigation, MapPin, Footprints, Sparkles } from 'lucide-react';
import { RouteSearch } from './RouteSearch';

export function RouteDetails() {
  const {
    origin,
    setOrigin,
    destination,
    setDestination,
    preferences,
    togglePreference,
    selectedRouteKey,
    setSelectedRouteKey,
    setCurrentView,
    refreshRoutes
  } = useContext(AppContext);

  return (
    <div className="bg-[#FFFFFF] p-4 md:p-6 rounded-2xl shadow-xs border border-[#DCE3EB] space-y-4 max-w-xl mx-auto pb-20 md:pb-6">
      {/* Search inputs header */}
      <RouteSearch onSearchComplete={() => setCurrentView('route-options')} />

      {/* Preferences tags & Assisted Travel button */}
      <div className="flex items-center justify-between gap-2 text-xs font-semibold text-[#5B6E88] flex-wrap pt-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[#5B6E88] font-bold text-xs">Preferences:</span>

          {/* Wheelchair toggle checkbox */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F5F3ED] border border-[#DCE3EB] hover:bg-[#FFFFFF] cursor-pointer transition-colors">
            <input
              type="checkbox"
              id="rd-pref-wheelchair"
              checked={Boolean(preferences.wheelchair)}
              onChange={() => togglePreference('wheelchair')}
              className="w-4 h-4 accent-[#263B68] cursor-pointer"
            />
            <label
              htmlFor="rd-pref-wheelchair"
              className="text-xs font-bold text-[#263B68] cursor-pointer select-none"
            >
              Wheelchair
            </label>
          </div>

          {/* Avoid stairs toggle checkbox */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F5F3ED] border border-[#DCE3EB] hover:bg-[#FFFFFF] cursor-pointer transition-colors">
            <input
              type="checkbox"
              id="rd-pref-avoidStairs"
              checked={Boolean(preferences.avoidStairs)}
              onChange={() => togglePreference('avoidStairs')}
              className="w-4 h-4 accent-[#263B68] cursor-pointer"
            />
            <label
              htmlFor="rd-pref-avoidStairs"
              className="text-xs font-bold text-[#263B68] cursor-pointer select-none"
            >
              Avoid stairs
            </label>
          </div>
        </div>

        <button
          onClick={() => setCurrentView('assisted')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EEF3FA] text-[#263B68] font-bold text-xs hover:bg-[#DCE3EB] transition-all shrink-0 cursor-pointer shadow-2xs border border-[#DCE3EB]"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#60C4D4]" />
          <span>Assisted Travel</span>
        </button>
      </div>

      {/* Route Cards */}
      <div className="space-y-3 pt-1">
        {/* CARD 1: RECOMMENDED */}
        <div
          onClick={() => {
            setSelectedRouteKey('recommended');
            setCurrentView('journey-steps');
          }}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            selectedRouteKey === 'recommended'
              ? 'border-[#263B68] bg-[#F7F9FC] shadow-xs ring-1 ring-[#263B68]'
              : 'border-[#DCE3EB] hover:border-[#60C4D4] bg-[#FFFFFF]'
          }`}
        >
          <div className="flex items-center justify-between">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedRouteKey('recommended');
                setCurrentView('journey-steps');
              }}
              className="px-2.5 py-1 rounded-md bg-[#263B68] text-[#FFFFFF] text-[10px] font-extrabold uppercase tracking-wider cursor-pointer"
            >
              RECOMMENDED
            </button>
            <span className="text-xl font-bold text-[#263B68]">₹25</span>
          </div>

          <div className="mt-1 text-xs font-semibold text-[#5B6E88]">
            <span>🚗 ₹140 cheaper than estimated cab</span>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-[#263B68]">38</span>
                <span className="text-sm font-bold text-[#5B6E88]">min</span>
              </div>
              <p className="text-xs text-[#5B6E88] font-medium">Arrive by 10:23 AM</p>
            </div>

            {/* Segment Icons Flow */}
            <div className="flex items-center gap-1">
              <div className="w-7 h-7 rounded-lg bg-[#F5F3ED] text-[#263B68] border border-[#DCE3EB] flex items-center justify-center">
                <Footprints className="w-3.5 h-3.5" />
              </div>
              <div className="w-2.5 h-0.5 bg-[#DCE3EB]" />
              <div className="w-7 h-7 rounded-lg bg-[#263B68] text-white flex items-center justify-center">
                <Bus className="w-3.5 h-3.5" />
              </div>
              <div className="w-2.5 h-0.5 bg-[#DCE3EB]" />
              <div className="w-7 h-7 rounded-lg bg-[#EEF7F9] text-[#263B68] border border-[#60C4D4] flex items-center justify-center">
                <ArrowDownUp className="w-3.5 h-3.5" />
              </div>
              <div className="w-2.5 h-0.5 bg-[#DCE3EB]" />
              <div className="w-7 h-7 rounded-lg bg-[#263B68] text-[#60C4D4] flex items-center justify-center">
                <Train className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Detailed Accessibility breakdown */}
          <div className="mt-3.5 p-3 rounded-lg bg-[#F5F3ED] border border-[#DCE3EB] text-xs space-y-2">
            <div className="flex items-center gap-1.5 text-[#263B68] font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Highly Accessible</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-slate-700 font-medium text-[11px] pt-1">
              <div className="flex items-center gap-1.5">
                <ArrowDownUp className="w-3.5 h-3.5 text-[#263B68]" />
                <span className="text-[#263B68] font-bold">2 elevators</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#5B6E88]">🪜</span>
                <span className="text-[#263B68] font-bold">0 stairs</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Accessibility className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[#263B68] font-bold">Ramp available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Bus className="w-3.5 h-3.5 text-[#263B68]" />
                <span className="text-[#263B68] font-bold">Low-floor bus</span>
              </div>
              <div className="flex items-center gap-1.5 col-span-2 text-[#5B6E88]">
                <Footprints className="w-3.5 h-3.5" />
                <span>180m walking distance</span>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: FASTEST */}
        <div
          onClick={() => {
            setSelectedRouteKey('fastest');
            setCurrentView('journey-steps');
          }}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            selectedRouteKey === 'fastest'
              ? 'border-[#263B68] bg-[#F7F9FC] shadow-xs ring-1 ring-[#263B68]'
              : 'border-[#DCE3EB] hover:border-[#60C4D4] bg-[#FFFFFF]'
          }`}
        >
          <div className="flex items-center justify-between">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedRouteKey('fastest');
                setCurrentView('journey-steps');
              }}
              className="text-[10px] font-extrabold text-[#263B68] bg-[#EEF3FA] px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1 cursor-pointer"
            >
              FASTEST
            </button>
            <span className="text-xl font-bold text-[#263B68]">₹35</span>
          </div>

          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-[#263B68]">31</span>
            <span className="text-xs font-bold text-[#5B6E88]">min</span>
            <span className="text-xs text-[#8CA0BA] ml-2">Arrive by 10:16 AM</span>
          </div>

          <div className="mt-3 p-2.5 rounded-lg bg-amber-50/60 border border-amber-200 text-xs text-amber-900 font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold">Limited accessibility</p>
              <p className="text-[11px] font-medium text-amber-800">2 flights of stairs, 620m walking</p>
            </div>
          </div>
        </div>

        {/* CARD 3: LOWEST COST */}
        <div
          onClick={() => {
            setSelectedRouteKey('lowestCost');
            setCurrentView('journey-steps');
          }}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            selectedRouteKey === 'lowestCost'
              ? 'border-[#263B68] bg-[#F7F9FC] shadow-xs ring-1 ring-[#263B68]'
              : 'border-[#DCE3EB] hover:border-[#60C4D4] bg-[#FFFFFF]'
          }`}
        >
          <div className="flex items-center justify-between">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedRouteKey('lowestCost');
                setCurrentView('journey-steps');
              }}
              className="text-[10px] font-extrabold text-[#263B68] bg-[#EEF3FA] px-2 py-0.5 rounded-md uppercase tracking-wider cursor-pointer"
            >
              LOWEST COST
            </button>
            <span className="text-xl font-bold text-[#263B68]">₹15</span>
          </div>

          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-[#263B68]">44</span>
            <span className="text-xs font-bold text-[#5B6E88]">min</span>
            <span className="text-xs text-[#8CA0BA] ml-2">Arrive by 10:29 AM</span>
          </div>

          <div className="mt-3 p-2.5 rounded-lg bg-[#F5F3ED] border border-[#DCE3EB] text-xs text-[#263B68] space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <Accessibility className="w-3.5 h-3.5 text-emerald-600" />
              <span>Good Accessibility</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[#5B6E88]">
              <Footprints className="w-3.5 h-3.5" />
              <span>300m walking distance</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
