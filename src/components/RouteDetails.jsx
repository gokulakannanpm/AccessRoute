import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Bus, Train, ArrowDownUp, Accessibility, AlertTriangle, CheckCircle2, Navigation, MapPin, Footprints, Sparkles } from 'lucide-react';

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

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    refreshRoutes(origin, destination, preferences);
    setCurrentView('route-options');
  };

  return (
    <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4 max-w-xl mx-auto pb-20 md:pb-6">
      {/* Search inputs header */}
      <form onSubmit={handleSearchSubmit} className="space-y-2.5">
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800">
          <Navigation className="w-4 h-4 text-[#1F3A5F] shrink-0" />
          <input
            type="text"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            placeholder="Starting point (e.g. Chennai Central)"
            className="bg-transparent w-full focus:outline-hidden text-slate-900 font-bold text-xs"
          />
        </div>

        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800 focus-within:border-[#1AC8A0]">
          <MapPin className="w-4 h-4 text-red-600 shrink-0" />
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Where to? (e.g. Guindy)"
            className="bg-transparent w-full focus:outline-hidden text-slate-900 font-bold text-xs"
          />
          <button
            type="submit"
            className="px-3 py-1 bg-[#1F3A5F] hover:bg-[#132A4A] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
          >
            Find Routes
          </button>
        </div>
      </form>

      {/* Preferences tags & Assisted Travel button */}
      <div className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-600 flex-wrap pt-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-500 font-bold text-xs">Preferences:</span>

          {/* Wheelchair toggle checkbox */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 cursor-pointer">
            <input
              type="checkbox"
              id="rd-pref-wheelchair"
              checked={Boolean(preferences.wheelchair)}
              onChange={() => togglePreference('wheelchair')}
              className="w-4 h-4 accent-[#1AC8A0] cursor-pointer"
            />
            <label
              htmlFor="rd-pref-wheelchair"
              className="text-xs font-bold text-slate-800 cursor-pointer select-none"
            >
              Wheelchair
            </label>
          </div>

          {/* Avoid stairs toggle checkbox */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 cursor-pointer">
            <input
              type="checkbox"
              id="rd-pref-avoidStairs"
              checked={Boolean(preferences.avoidStairs)}
              onChange={() => togglePreference('avoidStairs')}
              className="w-4 h-4 accent-[#1AC8A0] cursor-pointer"
            />
            <label
              htmlFor="rd-pref-avoidStairs"
              className="text-xs font-bold text-slate-800 cursor-pointer select-none"
            >
              Avoid stairs
            </label>
          </div>
        </div>

        <button
          onClick={() => setCurrentView('assisted')}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#E6FAF5] text-[#064E3B] font-bold text-xs hover:bg-[#1AC8A0]/20 transition-all shrink-0 cursor-pointer shadow-2xs border border-[#1AC8A0]/30"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#14A080]" />
          <span>Assisted Travel</span>
        </button>
      </div>

      {/* Route Cards */}
      <div className="space-y-4 pt-1">
        {/* CARD 1: RECOMMENDED */}
        <div
          onClick={() => {
            setSelectedRouteKey('recommended');
            setCurrentView('journey-steps');
          }}
          className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
            selectedRouteKey === 'recommended'
              ? 'border-[#1F3A5F] bg-white shadow-md'
              : 'border-slate-200 hover:border-[#1F3A5F]/40 bg-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedRouteKey('recommended');
                setCurrentView('journey-steps');
              }}
              className="px-2.5 py-1 rounded-md bg-[#1F3A5F] text-[#1AC8A0] text-[10px] font-extrabold uppercase tracking-wider cursor-pointer"
            >
              RECOMMENDED
            </button>
            <span className="text-xl font-black text-slate-900">₹25</span>
          </div>

          <div className="mt-1 text-xs font-semibold text-[#14A080]">
            <span>🚗 ₹140 cheaper than estimated cab</span>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-[#1F3A5F]">38</span>
                <span className="text-sm font-bold text-slate-500">min</span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Arrive by 10:23 AM</p>
            </div>

            {/* Segment Icons Flow */}
            <div className="flex items-center gap-1">
              <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center">
                <Footprints className="w-3.5 h-3.5" />
              </div>
              <div className="w-3 h-0.5 bg-slate-400" />
              <div className="w-7 h-7 rounded-full bg-[#1F3A5F] text-white flex items-center justify-center">
                <Bus className="w-3.5 h-3.5" />
              </div>
              <div className="w-3 h-0.5 bg-slate-400" />
              <div className="w-7 h-7 rounded-full bg-[#064E3B] text-white flex items-center justify-center">
                <ArrowDownUp className="w-3.5 h-3.5" />
              </div>
              <div className="w-3 h-0.5 bg-slate-400" />
              <div className="w-7 h-7 rounded-full bg-[#1F3A5F] text-white flex items-center justify-center">
                <Train className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Detailed Accessibility breakdown */}
          <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <div className="flex items-center gap-1.5 text-[#064E3B] font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Highly Accessible</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-slate-700 font-medium text-[11px] pt-1">
              <div className="flex items-center gap-1.5">
                <ArrowDownUp className="w-3.5 h-3.5 text-slate-500" />
                <span>2 elevators</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-400">🪜</span>
                <span>0 stairs</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Accessibility className="w-3.5 h-3.5 text-emerald-600" />
                <span>Ramp available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Bus className="w-3.5 h-3.5 text-[#1F3A5F]" />
                <span>Low-floor bus</span>
              </div>
              <div className="flex items-center gap-1.5 col-span-2">
                <Footprints className="w-3.5 h-3.5 text-slate-500" />
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
          className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
            selectedRouteKey === 'fastest'
              ? 'border-slate-800 bg-white shadow-md'
              : 'border-slate-200 hover:border-slate-400 bg-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedRouteKey('fastest');
                setCurrentView('journey-steps');
              }}
              className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1 cursor-pointer"
            >
              FASTEST
            </button>
            <span className="text-xl font-black text-slate-900">₹35</span>
          </div>

          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-[#1F3A5F]">31</span>
            <span className="text-xs font-bold text-slate-500">min</span>
            <span className="text-xs text-slate-400 ml-2">Arrive by 10:16 AM</span>
          </div>

          <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <div>
              <p className="font-bold">Limited accessibility</p>
              <p className="text-[11px] font-medium text-red-600">2 flights of stairs, 620m walking</p>
            </div>
          </div>
        </div>

        {/* CARD 3: LOWEST COST */}
        <div
          onClick={() => {
            setSelectedRouteKey('lowestCost');
            setCurrentView('journey-steps');
          }}
          className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
            selectedRouteKey === 'lowestCost'
              ? 'border-slate-800 bg-white shadow-md'
              : 'border-slate-200 hover:border-slate-400 bg-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedRouteKey('lowestCost');
                setCurrentView('journey-steps');
              }}
              className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider cursor-pointer"
            >
              LOWEST COST
            </button>
            <span className="text-xl font-black text-slate-900">₹15</span>
          </div>

          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-[#1F3A5F]">44</span>
            <span className="text-xs font-bold text-slate-500">min</span>
            <span className="text-xs text-slate-400 ml-2">Arrive by 10:29 AM</span>
          </div>

          <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
            <div className="flex items-center gap-1.5">
              <Accessibility className="w-3.5 h-3.5 text-emerald-600" />
              <span>Good Accessibility</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Footprints className="w-3.5 h-3.5 text-slate-500" />
              <span>300m walking distance</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
