import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Check, Volume2, Bus, Train, ArrowUpRight, Sparkles, Navigation2, Mic, Loader2 } from 'lucide-react';

export function AssistedTravel() {
  const {
    preferences,
    togglePreference,
    isPlayingAudio,
    handlePlayDirections,
    setCurrentView,
    selectedRoute,
    preferencesUnderstood,
    aiRouteExplanation,
    isAiProcessing,
    isListeningVoice,
    triggerVoiceSearch,
    voiceTranscript
  } = useContext(AppContext);

  const duration = selectedRoute?.durationMinutes || 38;
  const fare = selectedRoute?.fareText || `₹${selectedRoute?.fare || 25}`;

  return (
    <div className="bg-white min-h-screen md:min-h-0 md:rounded-2xl p-4 md:p-6 shadow-sm border border-slate-100 max-w-xl mx-auto space-y-4 pb-20 md:pb-6">
      {/* Top Header Controls with Voice Trigger */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#1AC8A0]/15 text-[#14A080]">
            <Sparkles className="w-4 h-4" />
          </div>
          <h1 className="text-lg font-bold text-[#1F3A5F]">Assisted Travel</h1>
        </div>

        <button
          onClick={triggerVoiceSearch}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer ${
            isListeningVoice
              ? 'bg-red-500 text-white animate-pulse'
              : isAiProcessing
              ? 'bg-[#1F3A5F] text-white'
              : 'bg-[#E6FAF5] text-[#064E3B] border border-[#1AC8A0]/40 hover:bg-[#1AC8A0]/20'
          }`}
          title="Voice Search with Gemini"
        >
          {isAiProcessing ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Interpreting...</span>
            </>
          ) : isListeningVoice ? (
            <>
              <Mic className="w-3.5 h-3.5 animate-bounce" />
              <span>Listening...</span>
            </>
          ) : (
            <>
              <Mic className="w-3.5 h-3.5 text-[#14A080]" />
              <span>Voice</span>
            </>
          )}
        </button>
      </div>

      {/* Voice Transcript Box (if active) */}
      {voiceTranscript && (
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-center gap-2">
          <span className="font-bold text-[#1F3A5F] uppercase text-[10px] tracking-wider">You said:</span>
          <span className="italic text-slate-800 font-medium truncate">"{voiceTranscript}"</span>
        </div>
      )}

      {/* Header Banner - Preferences understood card */}
      {preferencesUnderstood && (
        <div className="p-4 rounded-2xl bg-[#E6FAF5] border border-[#1AC8A0]/30 flex items-center gap-3 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-[#1AC8A0] text-slate-900 flex items-center justify-center shrink-0 shadow-2xs">
            <Check className="w-6 h-6 stroke-[3]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#064E3B] tracking-tight">Preferences understood</h2>
            <p className="text-xs text-slate-600 font-medium">Route generated based on your voice request.</p>
          </div>
        </div>
      )}

      {/* Active Preference Toggles */}
      <div className="flex flex-wrap gap-2.5">
        {/* Avoid Stairs Toggle */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 cursor-pointer">
          <input
            type="checkbox"
            id="pref-avoidStairs"
            checked={Boolean(preferences.avoidStairs)}
            onChange={() => togglePreference('avoidStairs')}
            className="w-4 h-4 accent-[#1AC8A0] cursor-pointer"
          />
          <label
            htmlFor="pref-avoidStairs"
            className="text-xs font-bold text-slate-800 cursor-pointer select-none flex items-center gap-1"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Avoid stairs</span>
          </label>
        </div>

        {/* Wheelchair Toggle */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 cursor-pointer">
          <input
            type="checkbox"
            id="pref-wheelchair"
            checked={Boolean(preferences.wheelchair)}
            onChange={() => togglePreference('wheelchair')}
            className="w-4 h-4 accent-[#1AC8A0] cursor-pointer"
          />
          <label
            htmlFor="pref-wheelchair"
            className="text-xs font-bold text-slate-800 cursor-pointer select-none flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-2.5 7h4a1.5 1.5 0 0 1 1.5 1.5V14a1 1 0 0 1-2 0v-2.5h-1V21a1 1 0 0 1-2 0v-5h-1.5a1 1 0 0 1 0-2h2.5V10.5a.5.5 0 0 0-.5-.5h-1a1 1 0 0 1 0-2z" />
            </svg>
            <span>Wheelchair</span>
          </label>
        </div>

        {/* Voice Guidance Toggle */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 cursor-pointer">
          <input
            type="checkbox"
            id="pref-voiceGuidance"
            checked={Boolean(preferences.voiceGuidance)}
            onChange={() => togglePreference('voiceGuidance')}
            className="w-4 h-4 accent-[#1AC8A0] cursor-pointer"
          />
          <label
            htmlFor="pref-voiceGuidance"
            className="text-xs font-bold text-slate-800 cursor-pointer select-none flex items-center gap-1"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Voice guidance</span>
          </label>
        </div>
      </div>

      {/* Map Preview Card Container */}
      <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-xs relative bg-slate-100">
        <div className="h-36 bg-linear-to-r from-blue-100 via-emerald-50 to-slate-200 flex items-center justify-center relative p-3">
          {/* Mock Map Background Visual */}
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#1F3A5F_1px,transparent_1px)] [background-size:12px_12px]" />

          {/* Recommendation Banner */}
          <div className="z-10 bg-white/95 backdrop-blur-md px-5 py-3 rounded-xl border border-slate-200 shadow-md flex items-center gap-4 text-center">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">RECOMMENDED JOURNEY:</p>
              <p className="text-[11px] font-bold text-[#14A080]">₹140 cheaper than cab</p>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-[#1F3A5F]">{duration}</span>
              <span className="text-xs font-bold text-slate-600">min</span>
            </div>
            <div className="text-xl font-extrabold text-[#1F3A5F]">{fare}</div>
          </div>
        </div>

        {/* AI Explanation Details */}
        <div className="p-5 bg-white space-y-4">
          <p className="text-base md:text-lg leading-relaxed text-slate-800 font-medium">
            {aiRouteExplanation ? (
              aiRouteExplanation
            ) : (
              <>
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
              </>
            )}
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
        className={`w-full py-4 px-6 rounded-2xl text-white font-bold text-base md:text-lg flex items-center justify-center gap-3 shadow-md transition-all active:scale-[0.99] cursor-pointer ${
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
        className="w-full py-2.5 text-center text-xs font-semibold text-slate-500 hover:text-[#1F3A5F] flex items-center justify-center gap-1 cursor-pointer"
      >
        <Navigation2 className="w-3.5 h-3.5" />
        <span>View step-by-step timeline</span>
      </button>
    </div>
  );
}
