import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Check, Volume2, Bus, Train, ArrowUpRight, Sparkles, Navigation2 } from 'lucide-react';

export function AssistedTravel() {
  const { preferences, togglePreference, isPlayingAudio, handlePlayDirections, setCurrentView } = useContext(AppContext);

  return (
    <div className="bg-white min-h-screen md:min-h-0 md:rounded-2xl p-4 md:p-6 shadow-sm border border-slate-100 max-w-xl mx-auto space-y-4 pb-20 md:pb-6">
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-[#E6FAF5] border border-[#1AC8A0]/30 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#1AC8A0] text-slate-900 flex items-center justify-center shrink-0 shadow-2xs">
          <Check className="w-6 h-6 stroke-[3]" />
        </div>
        <div>
          <h2 className="text-base font-bold text-[#064E3B] tracking-tight">Preferences understood</h2>
          <p className="text-xs text-slate-600 font-medium">Route generated based on your voice request.</p>
        </div>
      </div>

      {/* Active Preference Toggles */}
      <div className="flex flex-wrap gap-2.5">
        <button
          onClick={() => togglePreference('avoidStairs')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            preferences.avoidStairs
              ? 'bg-[#6EE7B7] text-[#064E3B] shadow-2xs'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>Avoid stairs</span>
          <div className={`w-7 h-4 rounded-full p-0.5 flex items-center ${preferences.avoidStairs ? 'bg-[#064E3B] justify-end' : 'bg-slate-300 justify-start'}`}>
            <div className="w-3 h-3 rounded-full bg-white shadow-2xs" />
          </div>
        </button>

        <button
          onClick={() => togglePreference('wheelchair')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            preferences.wheelchair
              ? 'bg-[#6EE7B7] text-[#064E3B] shadow-2xs'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M12 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-2.5 7h4a1.5 1.5 0 0 1 1.5 1.5V14a1 1 0 0 1-2 0v-2.5h-1V21a1 1 0 0 1-2 0v-5h-1.5a1 1 0 0 1 0-2h2.5V10.5a.5.5 0 0 0-.5-.5h-1a1 1 0 0 1 0-2z" />
          </svg>
          <span>Wheelchair</span>
          <div className={`w-7 h-4 rounded-full p-0.5 flex items-center ${preferences.wheelchair ? 'bg-[#064E3B] justify-end' : 'bg-slate-300 justify-start'}`}>
            <div className="w-3 h-3 rounded-full bg-white shadow-2xs" />
          </div>
        </button>

        <button
          onClick={() => togglePreference('voiceGuidance')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            preferences.voiceGuidance
              ? 'bg-blue-100 text-blue-900 border border-blue-300 shadow-2xs'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          <Volume2 className="w-4 h-4" />
          <span>Voice guidance</span>
          <div className={`w-7 h-4 rounded-full p-0.5 flex items-center ${preferences.voiceGuidance ? 'bg-blue-900 justify-end' : 'bg-slate-300 justify-start'}`}>
            <div className="w-3 h-3 rounded-full bg-white shadow-2xs" />
          </div>
        </button>
      </div>

      {/* Map Preview Card Container */}
      <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-xs relative bg-slate-100">
        <div className="h-32 bg-linear-to-r from-blue-100 via-emerald-50 to-slate-200 flex items-center justify-center relative">
          {/* Mock Map Background Visual */}
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#1F3A5F_1px,transparent_1px)] [background-size:12px_12px]" />
          
          {/* Recommendation Banner */}
          <div className="z-10 bg-white/95 backdrop-blur-md px-5 py-3 rounded-xl border border-slate-200 shadow-md flex items-center gap-4 text-center">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">RECOMMENDED JOURNEY:</p>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-[#1F3A5F]">38</span>
              <span className="text-xs font-bold text-slate-600">min</span>
            </div>
            <div className="text-xl font-extrabold text-[#1F3A5F]">₹25</div>
          </div>
        </div>

        {/* AI Explanation Details */}
        <div className="p-5 bg-white space-y-4">
          <p className="text-base md:text-lg leading-relaxed text-slate-800 font-medium">
            Take{' '}
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[#1F3A5F] font-bold border border-slate-200">
              Bus 21
            </span>
            , then{' '}
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[#1F3A5F] font-bold border border-slate-200">
              Chennai Metro
            </span>
            . Elevator access is available at the transfer and{' '}
            <span className="px-2 py-0.5 rounded-md bg-[#6EE7B7]/40 text-[#064E3B] font-bold">
              no stairs are required
            </span>
            .
          </p>

          {/* Segment visual flow timeline */}
          <div className="pt-2 flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1F3A5F] text-white flex items-center justify-center shadow-xs">
              <Bus className="w-5 h-5" />
            </div>
            <div className="h-1 w-10 bg-slate-800 rounded-full" />
            <div className="w-10 h-10 rounded-xl bg-[#064E3B] text-white flex items-center justify-center shadow-xs">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14H7v-2h3v2zm0-4H7v-2h3v2zm0-4H7V7h3v2zm7 8h-5V7h5v10z" />
              </svg>
            </div>
            <div className="h-1 w-10 bg-slate-800 rounded-full" />
            <div className="w-10 h-10 rounded-xl bg-[#1F3A5F] text-white flex items-center justify-center shadow-xs">
              <Train className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Audio Direction Button */}
      <button
        onClick={handlePlayDirections}
        className={`w-full py-4 px-6 rounded-2xl text-white font-bold text-base md:text-lg flex items-center justify-center gap-3 shadow-md transition-all active:scale-[0.99] ${
          isPlayingAudio
            ? 'bg-emerald-600 hover:bg-emerald-700 animate-pulse'
            : 'bg-[#0A192F] hover:bg-[#132A4A]'
        }`}
      >
        <Volume2 className="w-6 h-6 text-[#1AC8A0]" />
        <span>{isPlayingAudio ? 'Playing directions...' : 'Play directions'}</span>
      </button>

      <button
        onClick={() => setCurrentView('journey-steps')}
        className="w-full py-2.5 text-center text-xs font-semibold text-slate-500 hover:text-[#1F3A5F] flex items-center justify-center gap-1"
      >
        <Navigation2 className="w-3.5 h-3.5" />
        <span>View step-by-step timeline</span>
      </button>
    </div>
  );
}
