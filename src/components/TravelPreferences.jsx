import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Search, Mic, ArrowLeft, Check, Sparkles, Navigation, Clock } from 'lucide-react';

export function TravelPreferences() {
  const { preferences, setPreferences, setCurrentView, setOrigin, setDestination } = useContext(AppContext);
  const [localPrefs, setLocalPrefs] = useState({ ...preferences });
  const [searchInput, setSearchInput] = useState('Guindy');
  const [isListening, setIsListening] = useState(false);

  const handleToggle = (key) => {
    setLocalPrefs(prev => ({
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
    setIsListening(true);
    setTimeout(() => {
      setIsListening(false);
      setSearchInput('Guindy via Accessible Metro');
      setCurrentView('assisted');
    }, 1800);
  };

  return (
    <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-slate-100 max-w-xl mx-auto space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentView('route-options')}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-[#1F3A5F]">Plan Journey</h2>
        </div>
        <button
          onClick={handleVoiceClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1AC8A0]/15 text-[#14A080] text-xs font-bold hover:bg-[#1AC8A0]/25 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Voice Search</span>
        </button>
      </div>

      {/* Destination Search Box */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Destination</label>
        <div className="relative flex items-center">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Where to?"
            className="w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-hidden focus:border-[#1AC8A0] focus:ring-2 focus:ring-[#1AC8A0]/20"
          />
          <button
            onClick={handleVoiceClick}
            className={`p-2 rounded-xl absolute right-2.5 transition-all ${
              isListening ? 'bg-red-500 text-white animate-bounce' : 'text-[#1F3A5F] hover:bg-slate-200'
            }`}
            title="Speak destination"
          >
            <Mic className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Recent Destinations */}
      <div className="space-y-2">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Recent Destinations</div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              setSearchInput('Egmore Station');
              setDestination('Egmore Station');
              setCurrentView('route-options');
            }}
            className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 text-left"
          >
            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate">Egmore Station</span>
          </button>
          <button
            onClick={() => {
              setSearchInput('Apollo Hospital');
              setDestination('Apollo Hospital');
              setCurrentView('route-options');
            }}
            className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 text-left"
          >
            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate">Apollo Hospital</span>
          </button>
        </div>
      </div>

      {/* Travel Preferences Toggles */}
      <div className="space-y-3 pt-2 border-t border-slate-200">
        <h3 className="text-sm font-extrabold text-[#1F3A5F]">Travel Preferences</h3>

        <div className="space-y-2.5">
          {/* Wheelchair accessible */}
          <div
            onClick={() => handleToggle('wheelchair')}
            className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors"
          >
            <span className="text-sm font-semibold text-slate-800">Wheelchair accessible</span>
            <div className={`w-11 h-6 rounded-full p-1 transition-colors ${localPrefs.wheelchair ? 'bg-[#1AC8A0]' : 'bg-slate-300'}`}>
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${localPrefs.wheelchair ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
          </div>

          {/* Avoid stairs */}
          <div
            onClick={() => handleToggle('avoidStairs')}
            className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors"
          >
            <span className="text-sm font-semibold text-slate-800">Avoid stairs</span>
            <div className={`w-11 h-6 rounded-full p-1 transition-colors ${localPrefs.avoidStairs ? 'bg-[#1AC8A0]' : 'bg-slate-300'}`}>
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${localPrefs.avoidStairs ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
          </div>

          {/* Limited mobility */}
          <div
            onClick={() => handleToggle('limitedMobility')}
            className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors"
          >
            <span className="text-sm font-semibold text-slate-800">Limited mobility</span>
            <div className={`w-11 h-6 rounded-full p-1 transition-colors ${localPrefs.limitedMobility ? 'bg-[#1AC8A0]' : 'bg-slate-300'}`}>
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${localPrefs.limitedMobility ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
          </div>

          {/* Audio navigation needed */}
          <div
            onClick={() => handleToggle('audioNavigation')}
            className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors"
          >
            <span className="text-sm font-semibold text-slate-800">Audio navigation needed</span>
            <div className={`w-11 h-6 rounded-full p-1 transition-colors ${localPrefs.audioNavigation ? 'bg-[#1AC8A0]' : 'bg-slate-300'}`}>
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${localPrefs.audioNavigation ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        className="w-full py-3.5 px-4 rounded-2xl bg-[#1F3A5F] hover:bg-[#132A4A] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-colors"
      >
        <Check className="w-4 h-4 text-[#1AC8A0]" />
        <span>Save Preferences & Search</span>
      </button>
    </div>
  );
}
