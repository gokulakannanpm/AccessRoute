import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Bus, Train, Accessibility, AlertTriangle, CheckCircle2, ChevronRight, Star, Zap, Banknote, MapPin, Sparkles } from 'lucide-react';
import { RouteSearch } from './RouteSearch';

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
    refreshRoutes,
    routes
  } = useContext(AppContext);

  const isFastestFiltered = Boolean(
    (preferences?.avoidStairs && (routes?.fastest?.stairsCount > 0 || routes?.fastest?.isStepFree === false)) ||
    (preferences?.wheelchair && routes?.fastest?.isStepFree === false)
  );

  const handleSelectRoute = (key) => {
    if (key === 'fastest' && isFastestFiltered) return;
    setSelectedRouteKey(key);
    setCurrentView('journey-steps');
  };

  const handleViewDetails = (key, e) => {
    e.stopPropagation();
    if (key === 'fastest' && isFastestFiltered) return;
    setSelectedRouteKey(key);
    setCurrentView('route-details');
  };

  return (
    <div className="bg-[#FFFFFF] rounded-t-3xl md:rounded-2xl p-4 md:p-6 shadow-xs border border-slate-100 max-w-xl mx-auto space-y-4">
      {/* Mobile top pull handle indicator */}
      <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-2 md:hidden" />

      {/* Origin & Destination search bar */}
      <RouteSearch />

      {/* Header & Preferences filter bar */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-[#1F3A5F] tracking-tight">Route Options</h2>
          <p className="text-xs md:text-sm text-slate-500 font-normal mt-0.5">
            Found {isFastestFiltered ? '2 accessible' : '3 accessible'} paths to your destination
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
            <div className="text-xl font-bold text-slate-900">
              {routes?.recommended?.fareText || `₹${routes?.recommended?.fare || 25}`}
            </div>
          </div>

          <div className="mt-2 text-xs font-semibold text-[#14A080] flex items-center gap-1">
            <span>🚗 ₹140 cheaper than estimated cab</span>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-[#1F3A5F]">
                {routes?.recommended?.durationMinutes || routes?.recommended?.duration || 38}
              </span>
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
          className={`route-card group p-4 rounded-2xl border-2 transition-all relative ${
            isFastestFiltered
              ? 'opacity-60 bg-slate-50 border-slate-200 cursor-not-allowed'
              : selectedRouteKey === 'fastest'
              ? 'border-[#1F3A5F] bg-slate-50 shadow-sm cursor-pointer'
              : 'border-slate-200 bg-white hover:border-slate-400 hover:shadow-xs cursor-pointer'
          }`}
        >
          <div className="flex items-start justify-between">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSelectRoute('fastest');
              }}
              disabled={isFastestFiltered}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase ${
                isFastestFiltered ? 'bg-slate-300 text-slate-600' : 'bg-slate-200 text-slate-800 cursor-pointer'
              }`}
            >
              <Zap className="w-3 h-3 text-amber-600 fill-amber-600" />
              <span>FASTEST</span>
            </button>
            <div className="text-xl font-bold text-slate-900">
              {routes?.fastest?.fareText || `₹${routes?.fastest?.fare || 35}`}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-[#1F3A5F]">
                {routes?.fastest?.durationMinutes || routes?.fastest?.duration || 31}
              </span>
              <span className="text-sm font-semibold text-slate-500">min</span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
              <Train className="w-4 h-4 text-[#1F3A5F]" />
              <span>Chennai Metro</span>
            </div>
          </div>

          {/* Accessibility Indicator Box */}
          <div className={`mt-3 p-2.5 rounded-xl border flex items-center justify-between text-xs font-semibold ${
            isFastestFiltered
              ? 'bg-slate-100 border-slate-300 text-slate-600'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            <div className="flex items-center gap-2">
              <AlertTriangle className={`w-4 h-4 shrink-0 ${isFastestFiltered ? 'text-slate-500' : 'text-red-600'}`} />
              <span>{isFastestFiltered ? 'Unavailable (Stairs required - filtered out)' : 'Limited accessibility'}</span>
            </div>
            {!isFastestFiltered && (
              <button
                onClick={(e) => handleViewDetails('fastest', e)}
                className="text-slate-500 hover:text-slate-900 underline text-[11px] cursor-pointer"
              >
                Details
              </button>
            )}
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
            <div className="text-xl font-bold text-slate-900">
              {routes?.lowestCost?.fareText || `₹${routes?.lowestCost?.fare || 15}`}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-[#1F3A5F]">
                {routes?.lowestCost?.durationMinutes || routes?.lowestCost?.duration || 44}
              </span>
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
