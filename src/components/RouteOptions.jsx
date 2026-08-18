import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Bus, Train, Accessibility, AlertTriangle, CheckCircle2, ChevronRight, Star, Zap, Banknote, MapPin, Sparkles } from 'lucide-react';

export function RouteOptions() {
  const {
    selectedRouteKey,
    setSelectedRouteKey,
    setCurrentView,
    destination,
    setDestination,
    origin,
    preferences,
    togglePreference,
    refreshRoutes
  } = useContext(AppContext);

  const handleSelectRoute = (key) => {
    setSelectedRouteKey(key);
    setCurrentView('journey-steps');
  };

  const handleViewDetails = (key, e) => {
    e.stopPropagation();
    setSelectedRouteKey(key);
    setCurrentView('route-details');
  };

  return (
    <div className="bg-white rounded-t-3xl md:rounded-2xl p-4 md:p-6 shadow-sm border border-slate-100 max-w-xl mx-auto space-y-4">
      {/* Mobile top pull handle indicator */}
      <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-2 md:hidden" />

      {/* Destination search bar */}
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
          onClick={() => refreshRoutes(origin, destination, preferences)}
          className="px-3 py-1.5 bg-[#1F3A5F] hover:bg-[#132A4A] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
        >
          Find Routes
        </button>
      </div>

      {/* Header & Preferences filter bar */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-[#1F3A5F] tracking-tight">Route Options</h2>
          <p className="text-xs md:text-sm text-slate-500 font-normal mt-0.5">
            Found 3 accessible paths to your destination
          </p>
        </div>
        <button
          onClick={() => setCurrentView('assisted')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E6FAF5] text-[#064E3B] text-xs font-bold border border-[#1AC8A0]/30 hover:bg-[#1AC8A0]/20 transition-all cursor-pointer shadow-2xs"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#14A080]" />
          <span>Assisted Travel</span>
        </button>
      </div>

      {/* Filter Checkboxes */}
      <div className="flex items-center gap-2 pt-0.5 flex-wrap">
        <span className="text-xs font-bold text-slate-500">Filter:</span>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 cursor-pointer">
          <input
            type="checkbox"
            id="ro-pref-wheelchair"
            checked={Boolean(preferences.wheelchair)}
            onChange={() => togglePreference('wheelchair')}
            className="w-4 h-4 accent-[#1AC8A0] cursor-pointer"
          />
          <label
            htmlFor="ro-pref-wheelchair"
            className="text-xs font-bold text-slate-800 cursor-pointer select-none"
          >
            Wheelchair
          </label>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 cursor-pointer">
          <input
            type="checkbox"
            id="ro-pref-avoidStairs"
            checked={Boolean(preferences.avoidStairs)}
            onChange={() => togglePreference('avoidStairs')}
            className="w-4 h-4 accent-[#1AC8A0] cursor-pointer"
          />
          <label
            htmlFor="ro-pref-avoidStairs"
            className="text-xs font-bold text-slate-800 cursor-pointer select-none"
          >
            Avoid stairs
          </label>
        </div>
      </div>

      {/* Cards List */}
      <div className="space-y-3.5 pt-1">
        {/* CARD 1: RECOMMENDED */}
        <div
          onClick={() => handleSelectRoute('recommended')}
          className={`route-card group cursor-pointer p-4 rounded-2xl border-2 transition-all relative ${
            selectedRouteKey === 'recommended'
              ? 'border-[#1AC8A0] bg-[#F4FBF9] shadow-sm'
              : 'border-slate-200 bg-white hover:border-[#1AC8A0]/60 hover:shadow-xs'
          }`}
        >
          <div className="flex items-start justify-between">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSelectRoute('recommended');
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#1AC8A0] text-slate-900 text-[11px] font-bold tracking-wide uppercase cursor-pointer"
            >
              <Star className="w-3 h-3 fill-slate-900" />
              <span>RECOMMENDED</span>
            </button>
            <div className="text-xl font-bold text-slate-900">₹25</div>
          </div>

          <div className="mt-2 text-xs font-semibold text-[#14A080] flex items-center gap-1">
            <span>🚗 ₹140 cheaper than estimated cab</span>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-[#1F3A5F]">38</span>
              <span className="text-sm font-semibold text-slate-500">min</span>
            </div>

            {/* Segment Icons */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                <Bus className="w-4 h-4 text-[#1F3A5F]" />
                <span>MTC Bus</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                <Train className="w-4 h-4 text-[#1F3A5F]" />
                <span>Chennai Metro</span>
              </div>
            </div>
          </div>

          {/* Accessibility Indicator Box */}
          <div className="mt-3 p-2.5 rounded-xl bg-white border border-[#1AC8A0]/40 flex items-center justify-between text-xs font-semibold text-[#064E3B]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#1AC8A0]/20 flex items-center justify-center">
                <Accessibility className="w-4 h-4 text-[#064E3B]" />
              </div>
              <span>Highly Accessible</span>
            </div>
            <button
              onClick={(e) => handleViewDetails('recommended', e)}
              className="text-slate-500 hover:text-[#1F3A5F] underline text-[11px] cursor-pointer"
            >
              Details
            </button>
          </div>
        </div>

        {/* CARD 2: FASTEST */}
        <div
          onClick={() => handleSelectRoute('fastest')}
          className={`route-card group cursor-pointer p-4 rounded-2xl border-2 transition-all relative ${
            selectedRouteKey === 'fastest'
              ? 'border-[#1F3A5F] bg-slate-50 shadow-sm'
              : 'border-slate-200 bg-white hover:border-slate-400 hover:shadow-xs'
          }`}
        >
          <div className="flex items-start justify-between">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSelectRoute('fastest');
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-200 text-slate-800 text-[11px] font-bold tracking-wide uppercase cursor-pointer"
            >
              <Zap className="w-3 h-3 text-amber-600 fill-amber-600" />
              <span>FASTEST</span>
            </button>
            <div className="text-xl font-bold text-slate-900">₹35</div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-[#1F3A5F]">31</span>
              <span className="text-sm font-semibold text-slate-500">min</span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
              <Train className="w-4 h-4 text-[#1F3A5F]" />
              <span>Chennai Metro</span>
            </div>
          </div>

          {/* Accessibility Indicator Box (Limited / Warning) */}
          <div className="mt-3 p-2.5 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between text-xs font-semibold text-red-700">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>Limited accessibility</span>
            </div>
            <button
              onClick={(e) => handleViewDetails('fastest', e)}
              className="text-slate-500 hover:text-slate-900 underline text-[11px] cursor-pointer"
            >
              Details
            </button>
          </div>
        </div>

        {/* CARD 3: LOWEST COST */}
        <div
          onClick={() => handleSelectRoute('lowestCost')}
          className={`route-card group cursor-pointer p-4 rounded-2xl border-2 transition-all relative ${
            selectedRouteKey === 'lowestCost'
              ? 'border-slate-400 bg-slate-50 shadow-sm'
              : 'border-slate-200 bg-white hover:border-slate-400 hover:shadow-xs'
          }`}
        >
          <div className="flex items-start justify-between">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSelectRoute('lowestCost');
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-200 text-slate-800 text-[11px] font-bold tracking-wide uppercase cursor-pointer"
            >
              <Banknote className="w-3.5 h-3.5 text-emerald-600" />
              <span>LOWEST COST</span>
            </button>
            <div className="text-xl font-bold text-slate-900">₹15</div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-[#1F3A5F]">44</span>
              <span className="text-sm font-semibold text-slate-500">min</span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
              <Bus className="w-4 h-4 text-[#1F3A5F]" />
              <span>MTC Bus</span>
            </div>
          </div>

          {/* Accessibility Indicator Box (Good) */}
          <div className="mt-3 p-2.5 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#1F3A5F]" />
              <span>Good Accessibility</span>
            </div>
            <button
              onClick={(e) => handleViewDetails('lowestCost', e)}
              className="text-slate-500 hover:text-slate-900 underline text-[11px] cursor-pointer"
            >
              Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
