import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Search, Mic, ArrowLeft, Check, Sparkles, Clock, Loader2 } from 'lucide-react';

export function TravelPreferences() {
  const {
    preferences,
    setPreferences,
    setCurrentView,
    setDestination,
    triggerVoiceSearch,
    isListeningVoice,
    isAiProcessing
  } = useContext(AppContext);

  const [localPrefs, setLocalPrefs] = useState({ ...preferences });
  const [searchInput, setSearchInput] = useState('Guindy');

  const handleToggle = (key) => {
    setLocalPrefs((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = () => {
    setPreferences(localPrefs);
    setDestination(searchInput);
    setCurrentView('route-options');
  };

  const handleVoiceClick = () => {
    triggerVoiceSearch();
  };

  return (
    <div className="bg-[#FFFFFF] rounded-2xl p-4 md:p-6 shadow-xs border border-[#DCE3EB] max-w-xl mx-auto space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentView('route-options')}
            className="p-1.5 rounded-lg hover:bg-[#F5F3ED] text-[#263B68] cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-[#263B68]">Plan Journey</h2>
        </div>
        <button
          onClick={handleVoiceClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EEF3FA] text-[#263B68] text-xs font-bold hover:bg-[#DCE3EB] border border-[#DCE3EB] transition-colors cursor-pointer"
        >
          {isAiProcessing ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Interpreting AI...</span>
            </>
          ) : isListeningVoice ? (
            <>
              <Mic className="w-3.5 h-3.5 text-red-500 animate-bounce" />
              <span>Listening...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-[#60C4D4]" />
              <span>Voice</span>
            </>
          )}
        </button>
      </div>

      {/* Destination Search Box */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-[#5B6E88] uppercase tracking-wider">Destination</label>
        <div className="relative flex items-center">
          <Search className="w-5 h-5 text-[#8CA0BA] absolute left-3.5" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Where to?"
            className="w-full pl-11 pr-12 py-3 bg-[#FFFFFF] border border-[#DCE3EB] rounded-xl text-sm font-semibold text-slate-900 focus:outline-hidden focus:border-[#263B68] focus:ring-2 focus:ring-[#60C4D4]/30"
          />
          <button
            onClick={handleVoiceClick}
            className={`p-2 rounded-lg absolute right-2.5 transition-all cursor-pointer ${
              isListeningVoice ? 'bg-red-500 text-white animate-bounce' : 'text-[#263B68] hover:bg-[#F5F3ED]'
            }`}
            title="Speak destination with Voice AI"
          >
            <Mic className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Recent Destinations */}
      <div className="space-y-2">
        <div className="text-xs font-bold text-[#5B6E88] uppercase tracking-wider">Recent Destinations</div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              setSearchInput('Egmore Station');
              setDestination('Egmore Station');
              setCurrentView('route-options');
            }}
            className="flex items-center gap-2 p-2.5 rounded-xl bg-[#F5F3ED] border border-[#DCE3EB] text-xs font-semibold text-[#263B68] hover:bg-[#FFFFFF] text-left cursor-pointer transition-colors"
          >
            <Clock className="w-4 h-4 text-[#8CA0BA] shrink-0" />
            <span className="truncate">Egmore Station</span>
          </button>
          <button
            onClick={() => {
              setSearchInput('Apollo Hospital');
              setDestination('Apollo Hospital');
              setCurrentView('route-options');
            }}
            className="flex items-center gap-2 p-2.5 rounded-xl bg-[#F5F3ED] border border-[#DCE3EB] text-xs font-semibold text-[#263B68] hover:bg-[#FFFFFF] text-left cursor-pointer transition-colors"
          >
            <Clock className="w-4 h-4 text-[#8CA0BA] shrink-0" />
            <span className="truncate">Apollo Hospital</span>
          </button>
        </div>
      </div>

      {/* Travel Preferences Toggles */}
      <div className="space-y-3 pt-2 border-t border-[#DCE3EB]">
        <h3 className="text-sm font-extrabold text-[#263B68]">Travel Preferences</h3>

        <div className="space-y-2.5">
          {/* Wheelchair accessible */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#F5F3ED] border border-[#DCE3EB] hover:bg-[#FFFFFF] transition-colors">
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                id="search-pref-wheelchair"
                checked={Boolean(localPrefs.wheelchair)}
                onChange={() => handleToggle('wheelchair')}
                className="w-4 h-4 accent-[#263B68] cursor-pointer"
              />
              <label
                htmlFor="search-pref-wheelchair"
                className="text-sm font-semibold text-[#263B68] cursor-pointer select-none"
              >
                Wheelchair
              </label>
            </div>
            <div
              onClick={() => handleToggle('wheelchair')}
              className={`w-11 h-6 rounded-full p-1 cursor-pointer transition-colors ${
                localPrefs.wheelchair ? 'bg-[#263B68]' : 'bg-[#DCE3EB]'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  localPrefs.wheelchair ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
          </div>

          {/* Avoid stairs */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#F5F3ED] border border-[#DCE3EB] hover:bg-[#FFFFFF] transition-colors">
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                id="search-pref-avoidStairs"
                checked={Boolean(localPrefs.avoidStairs)}
                onChange={() => handleToggle('avoidStairs')}
                className="w-4 h-4 accent-[#263B68] cursor-pointer"
              />
              <label
                htmlFor="search-pref-avoidStairs"
                className="text-sm font-semibold text-[#263B68] cursor-pointer select-none"
              >
                Avoid stairs
              </label>
            </div>
            <div
              onClick={() => handleToggle('avoidStairs')}
              className={`w-11 h-6 rounded-full p-1 cursor-pointer transition-colors ${
                localPrefs.avoidStairs ? 'bg-[#263B68]' : 'bg-[#DCE3EB]'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  localPrefs.avoidStairs ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
          </div>

          {/* Limited mobility */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#F5F3ED] border border-[#DCE3EB] hover:bg-[#FFFFFF] transition-colors">
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                id="search-pref-limitedMobility"
                checked={Boolean(localPrefs.limitedMobility)}
                onChange={() => handleToggle('limitedMobility')}
                className="w-4 h-4 accent-[#263B68] cursor-pointer"
              />
              <label
                htmlFor="search-pref-limitedMobility"
                className="text-sm font-semibold text-[#263B68] cursor-pointer select-none"
              >
                Limited mobility
              </label>
            </div>
            <div
              onClick={() => handleToggle('limitedMobility')}
              className={`w-11 h-6 rounded-full p-1 cursor-pointer transition-colors ${
                localPrefs.limitedMobility ? 'bg-[#263B68]' : 'bg-[#DCE3EB]'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  localPrefs.limitedMobility ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
          </div>

          {/* Audio navigation needed */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#F5F3ED] border border-[#DCE3EB] hover:bg-[#FFFFFF] transition-colors">
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                id="search-pref-audioNavigation"
                checked={Boolean(localPrefs.audioNavigation)}
                onChange={() => handleToggle('audioNavigation')}
                className="w-4 h-4 accent-[#263B68] cursor-pointer"
              />
              <label
                htmlFor="search-pref-audioNavigation"
                className="text-sm font-semibold text-[#263B68] cursor-pointer select-none"
              >
                Voice guidance
              </label>
            </div>
            <div
              onClick={() => handleToggle('audioNavigation')}
              className={`w-11 h-6 rounded-full p-1 cursor-pointer transition-colors ${
                localPrefs.audioNavigation ? 'bg-[#263B68]' : 'bg-[#DCE3EB]'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  localPrefs.audioNavigation ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        className="w-full py-3.5 px-4 rounded-xl bg-[#263B68] hover:bg-[#1B2B4C] text-[#FFFFFF] font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
      >
        <Check className="w-4 h-4 text-[#60C4D4]" />
        <span>Find Routes</span>
      </button>
    </div>
  );
}
