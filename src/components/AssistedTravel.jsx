import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Check, Volume2, Bus, Train, ArrowUpRight, Sparkles, Navigation2, Mic, Loader2 } from 'lucide-react';

export function AssistedTravel() {
  const {
    origin,
    destination,
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
    handleProcessVoice,
    voiceTranscript
  } = useContext(AppContext);

  const [typedInput, setTypedInput] = useState('');

  const duration = selectedRoute?.durationMinutes || 38;
  const fare = selectedRoute?.fareText || `₹${selectedRoute?.fare || 25}`;

  const handleSubmitText = (e) => {
    e.preventDefault();
    if (typedInput.trim()) {
      handleProcessVoice(typedInput.trim());
      setTypedInput('');
    }
  };

  return (
    <div className="bg-[#FFFFFF] min-h-screen md:min-h-0 md:rounded-2xl p-4 md:p-6 shadow-xs border border-[#DCE3EB] max-w-xl mx-auto space-y-4 pb-20 md:pb-6">
      {/* Top Header Controls with Voice & Typed Input */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#EEF3FA] text-[#263B68]">
            <Sparkles className="w-4 h-4 text-[#60C4D4]" />
          </div>
          <h1 className="text-lg font-bold text-[#263B68]">Assisted Travel</h1>
        </div>

        <button
          onClick={triggerVoiceSearch}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer ${
            isListeningVoice
              ? 'bg-red-500 text-white animate-pulse'
              : isAiProcessing
              ? 'bg-[#263B68] text-white'
              : 'bg-[#EEF3FA] text-[#263B68] border border-[#DCE3EB] hover:bg-[#DCE3EB]'
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
              <Mic className="w-3.5 h-3.5 text-[#60C4D4]" />
              <span>Voice</span>
            </>
          )}
        </button>
      </div>

      {/* Free-form Typed/Voice Input Bar */}
      <form
        onSubmit={handleSubmitText}
        className="flex items-center gap-2 p-2.5 rounded-xl bg-[#FFFFFF] border border-[#DCE3EB] text-xs font-semibold text-slate-800 focus-within:border-[#263B68] focus-within:ring-2 focus-within:ring-[#60C4D4]/30"
      >
        <Sparkles className="w-4 h-4 text-[#60C4D4] shrink-0 ml-1" />
        <input
          type="text"
          value={typedInput}
          onChange={(e) => setTypedInput(e.target.value)}
          placeholder="Type journey (e.g. Egmore to Guindy without stairs)..."
          className="bg-transparent w-full focus:outline-hidden text-slate-900 font-medium text-xs placeholder:text-[#8CA0BA]"
        />
        <button
          type="submit"
          disabled={!typedInput.trim() || isAiProcessing}
          className="px-3 py-1.5 bg-[#263B68] hover:bg-[#1B2B4C] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 disabled:opacity-50"
        >
          {isAiProcessing ? 'Thinking...' : 'Go'}
        </button>
      </form>

      {/* Voice Transcript Box (if active) */}
      {voiceTranscript && (
        <div className="p-3 rounded-xl bg-[#F5F3ED] border border-[#DCE3EB] text-xs text-slate-700 flex items-center gap-2">
          <span className="font-bold text-[#263B68] uppercase text-[10px] tracking-wider">You said:</span>
          <span className="italic text-slate-800 font-medium truncate">"{voiceTranscript}"</span>
        </div>
      )}

      {/* Header Banner - Preferences understood card */}
      {preferencesUnderstood && (
        <div className="p-4 rounded-xl bg-[#EEF7F9] border border-[#60C4D4]/40 flex items-center gap-3 shadow-2xs">
          <div className="w-10 h-10 rounded-lg bg-[#263B68] text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Check className="w-6 h-6 stroke-[3] text-[#60C4D4]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#263B68] tracking-tight">Preferences understood</h2>
            <p className="text-xs text-[#5B6E88] font-medium">
              Route generated for {origin} → {destination} based on your request.
            </p>
          </div>
        </div>
      )}

      {/* Active Preference Toggles */}
      <div className="flex flex-wrap gap-2.5">
        {/* Avoid Stairs Toggle */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F5F3ED] border border-[#DCE3EB] hover:bg-[#FFFFFF] cursor-pointer transition-colors">
          <input
            type="checkbox"
            id="pref-avoidStairs"
            checked={Boolean(preferences.avoidStairs)}
            onChange={() => togglePreference('avoidStairs')}
            className="w-4 h-4 accent-[#263B68] cursor-pointer"
          />
          <label
            htmlFor="pref-avoidStairs"
            className="text-xs font-bold text-[#263B68] cursor-pointer select-none flex items-center gap-1"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Avoid stairs</span>
          </label>
        </div>

        {/* Wheelchair Toggle */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F5F3ED] border border-[#DCE3EB] hover:bg-[#FFFFFF] cursor-pointer transition-colors">
          <input
            type="checkbox"
            id="pref-wheelchair"
            checked={Boolean(preferences.wheelchair)}
            onChange={() => togglePreference('wheelchair')}
            className="w-4 h-4 accent-[#263B68] cursor-pointer"
          />
          <label
            htmlFor="pref-wheelchair"
            className="text-xs font-bold text-[#263B68] cursor-pointer select-none flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-2.5 7h4a1.5 1.5 0 0 1 1.5 1.5V14a1 1 0 0 1-2 0v-2.5h-1V21a1 1 0 0 1-2 0v-5h-1.5a1 1 0 0 1 0-2h2.5V10.5a.5.5 0 0 0-.5-.5h-1a1 1 0 0 1 0-2z" />
            </svg>
            <span>Wheelchair</span>
          </label>
        </div>

        {/* Voice Guidance Toggle */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F5F3ED] border border-[#DCE3EB] hover:bg-[#FFFFFF] cursor-pointer transition-colors">
          <input
            type="checkbox"
            id="pref-voiceGuidance"
            checked={Boolean(preferences.voiceGuidance)}
            onChange={() => togglePreference('voiceGuidance')}
            className="w-4 h-4 accent-[#263B68] cursor-pointer"
          />
          <label
            htmlFor="pref-voiceGuidance"
            className="text-xs font-bold text-[#263B68] cursor-pointer select-none flex items-center gap-1"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Voice guidance</span>
          </label>
        </div>
      </div>

      {/* Map Preview Card Container */}
      <div className="rounded-xl border border-[#DCE3EB] overflow-hidden shadow-xs relative bg-[#F5F3ED]">
        <div className="h-28 bg-[#EEF3FA] flex items-center justify-center relative p-3">
          {/* Recommendation Banner */}
          <div className="z-10 bg-[#FFFFFF]/98 backdrop-blur-md px-4 py-2.5 rounded-xl border border-[#DCE3EB] shadow-xs flex items-center gap-4 text-center">
            <div>
              <p className="text-[10px] font-bold text-[#5B6E88] uppercase tracking-wider">JOURNEY: {origin} → {destination}</p>
              <p className="text-[11px] font-semibold text-[#5B6E88]">🚗 ₹140 cheaper than cab</p>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-[#263B68]">{duration}</span>
              <span className="text-xs font-bold text-[#5B6E88]">min</span>
            </div>
            <div className="text-xl font-extrabold text-[#263B68]">{fare}</div>
          </div>
        </div>

        {/* AI Explanation Details */}
        <div className="p-4 bg-white space-y-3">
          <p className="text-sm md:text-base leading-relaxed text-slate-800 font-medium">
            {aiRouteExplanation ? (
              aiRouteExplanation
            ) : (
              <>
                Take public transit from <span className="font-bold text-[#263B68]">{origin}</span> to <span className="font-bold text-[#263B68]">{destination}</span>. Step-free access and elevators are available.
              </>
            )}
          </p>

          {/* Segment visual flow timeline */}
          {selectedRoute?.segments && selectedRoute.segments.length > 0 ? (
            <div className="pt-1 flex items-center justify-center gap-2 flex-wrap">
              {selectedRoute.segments.map((seg, idx) => (
                <React.Fragment key={seg.id || idx}>
                  {idx > 0 && <div className="h-1 w-6 bg-[#DCE3EB] rounded-full shrink-0" />}
                  <div
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F5F3ED] text-[#263B68] text-xs font-bold border border-[#DCE3EB]"
                    title={seg.description}
                  >
                    {seg.type === 'bus' ? (
                      <Bus className="w-4 h-4 text-[#263B68]" />
                    ) : seg.type === 'metro' ? (
                      <Train className="w-4 h-4 text-[#60C4D4]" />
                    ) : (
                      <Navigation2 className="w-4 h-4 text-[#263B68]" />
                    )}
                    <span>{seg.badge || seg.mode || seg.routeName}</span>
                  </div>
                </React.Fragment>
              ))}
            </div>
          ) : (
            <div className="pt-1 flex items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#263B68] text-white flex items-center justify-center shadow-xs">
                <Bus className="w-4 h-4" />
              </div>
              <div className="h-0.5 w-8 bg-[#DCE3EB]" />
              <div className="w-8 h-8 rounded-lg bg-[#263B68] text-white flex items-center justify-center shadow-xs">
                <Train className="w-4 h-4 text-[#60C4D4]" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Audio Direction Button */}
      <button
        onClick={handlePlayDirections}
        className={`w-full py-3.5 px-5 rounded-xl text-white font-bold text-sm md:text-base flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.99] cursor-pointer ${
          isPlayingAudio
            ? 'bg-[#60C4D4] text-[#263B68] animate-pulse'
            : 'bg-[#263B68] hover:bg-[#1B2B4C]'
        }`}
      >
        <Volume2 className="w-5 h-5 text-[#60C4D4]" />
        <span>{isPlayingAudio ? 'Playing directions...' : 'Play directions'}</span>
      </button>

      <button
        onClick={() => setCurrentView('journey-steps')}
        className="w-full py-2 text-center text-xs font-semibold text-[#5B6E88] hover:text-[#263B68] flex items-center justify-center gap-1 cursor-pointer"
      >
        <Navigation2 className="w-3.5 h-3.5" />
        <span>View step-by-step timeline</span>
      </button>
    </div>
  );
}
