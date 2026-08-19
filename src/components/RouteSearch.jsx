import React, { useContext, useState, useEffect, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { Navigation, MapPin, Mic, AlertCircle, Check } from 'lucide-react';
import { startVoiceRecognition, stopVoiceRecognition } from '../utils/voiceInput';

export const ALLOWED_LOCATIONS = [
  'Chennai Central',
  'Egmore',
  'T. Nagar',
  'Koyambedu',
  'Guindy',
  'Tambaram'
];

const LOCATION_DETAILS = {
  'Chennai Central': 'Main railway terminus',
  'Egmore': 'Railway station & hospital hub',
  'T. Nagar': 'Commercial & bus transit hub',
  'Koyambedu': 'Largest bus terminus in Chennai',
  'Guindy': 'Metro & suburban rail interchange',
  'Tambaram': 'Suburban rail terminus'
};

const LOCATION_ALIASES = {
  'chennai central': 'Chennai Central',
  'central': 'Chennai Central',
  'central station': 'Chennai Central',
  'egmore': 'Egmore',
  'egmore station': 'Egmore',
  't. nagar': 'T. Nagar',
  't nagar': 'T. Nagar',
  'tnagar': 'T. Nagar',
  'thyagaraya nagar': 'T. Nagar',
  'koyambedu': 'Koyambedu',
  'cmbt': 'Koyambedu',
  'koyambedu bus stand': 'Koyambedu',
  'guindy': 'Guindy',
  'guindy metro': 'Guindy',
  'guindy station': 'Guindy',
  'tambaram': 'Tambaram',
  'tambaram station': 'Tambaram',
  'tambaram bus stand': 'Tambaram'
};

export function matchLocation(transcript) {
  if (!transcript || typeof transcript !== 'string') return null;
  const normalized = transcript.trim().toLowerCase();

  // 1. Direct alias match
  if (LOCATION_ALIASES[normalized]) {
    return LOCATION_ALIASES[normalized];
  }

  // 2. Direct string match
  const exactMatch = ALLOWED_LOCATIONS.find(
    (loc) => loc.toLowerCase() === normalized
  );
  if (exactMatch) return exactMatch;

  // 3. Substring match
  const substringMatch = ALLOWED_LOCATIONS.find(
    (loc) =>
      normalized.includes(loc.toLowerCase()) ||
      loc.toLowerCase().includes(normalized)
  );
  if (substringMatch) return substringMatch;

  // 4. Word overlap match
  const words = normalized.split(/\s+/);
  for (const loc of ALLOWED_LOCATIONS) {
    const locLower = loc.toLowerCase();
    if (words.some((word) => word.length > 2 && locLower.includes(word))) {
      return loc;
    }
  }

  return null;
}

export function RouteSearch({ onSearchComplete }) {
  const {
    origin,
    setOrigin,
    destination,
    setDestination,
    preferences,
    refreshRoutes,
    setCurrentView
  } = useContext(AppContext);

  const [originText, setOriginText] = useState(origin || 'Chennai Central');
  const [destText, setDestText] = useState(destination || 'Guindy');

  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);

  const [isListeningOrigin, setIsListeningOrigin] = useState(false);
  const [isListeningDest, setIsListeningDest] = useState(false);

  const originContainerRef = useRef(null);
  const destContainerRef = useRef(null);

  // Keep state in sync with context
  useEffect(() => {
    if (origin && ALLOWED_LOCATIONS.includes(origin)) {
      setOriginText(origin);
    }
  }, [origin]);

  useEffect(() => {
    if (destination && ALLOWED_LOCATIONS.includes(destination)) {
      setDestText(destination);
    }
  }, [destination]);

  // Click outside listener to close dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        originContainerRef.current &&
        !originContainerRef.current.contains(event.target)
      ) {
        setShowOriginDropdown(false);
      }
      if (
        destContainerRef.current &&
        !destContainerRef.current.contains(event.target)
      ) {
        setShowDestDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const originValid = ALLOWED_LOCATIONS.includes(originText);
  const destValid = ALLOWED_LOCATIONS.includes(destText);
  const isSameLocation = originValid && destValid && originText === destText;
  const isFormValid = originValid && destValid && !isSameLocation;

  // Filtered lists for dropdowns
  const originFiltered = ALLOWED_LOCATIONS.filter((loc) =>
    loc.toLowerCase().includes(originText.toLowerCase().trim())
  );
  const destFiltered = ALLOWED_LOCATIONS.filter((loc) =>
    loc.toLowerCase().includes(destText.toLowerCase().trim())
  );

  const handleSelectOrigin = (loc) => {
    setOriginText(loc);
    setOrigin(loc);
    setShowOriginDropdown(false);
  };

  const handleSelectDest = (loc) => {
    setDestText(loc);
    setDestination(loc);
    setShowDestDropdown(false);
  };

  // Voice recognition for Origin
  const handleVoiceOrigin = () => {
    if (isListeningOrigin) {
      stopVoiceRecognition();
      setIsListeningOrigin(false);
      return;
    }
    setIsListeningOrigin(true);
    startVoiceRecognition({
      onStart: () => setIsListeningOrigin(true),
      onResult: (transcript) => {
        setIsListeningOrigin(false);
        if (transcript) {
          const matched = matchLocation(transcript);
          if (matched) {
            setOriginText(matched);
            setOrigin(matched);
            setShowOriginDropdown(false);
          } else {
            setOriginText(transcript);
            setShowOriginDropdown(true);
          }
        }
      },
      onError: () => setIsListeningOrigin(false),
      onEnd: () => setIsListeningOrigin(false)
    });
  };

  // Voice recognition for Destination
  const handleVoiceDest = () => {
    if (isListeningDest) {
      stopVoiceRecognition();
      setIsListeningDest(false);
      return;
    }
    setIsListeningDest(true);
    startVoiceRecognition({
      onStart: () => setIsListeningDest(true),
      onResult: (transcript) => {
        setIsListeningDest(false);
        if (transcript) {
          const matched = matchLocation(transcript);
          if (matched) {
            setDestText(matched);
            setDestination(matched);
            setShowDestDropdown(false);
          } else {
            setDestText(transcript);
            setShowDestDropdown(true);
          }
        }
      },
      onError: () => setIsListeningDest(false),
      onEnd: () => setIsListeningDest(false)
    });
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (!isFormValid) return;

    setOrigin(originText);
    setDestination(destText);
    refreshRoutes(originText, destText, preferences);

    if (onSearchComplete) {
      onSearchComplete();
    } else if (setCurrentView) {
      setCurrentView('route-options');
    }
  };

  return (
    <form onSubmit={handleSearchSubmit} className="space-y-3 relative">
      {/* ORIGIN FIELD */}
      <div ref={originContainerRef} className="relative">
        <div
          className={`flex items-center gap-2 p-2.5 rounded-xl bg-slate-100 border text-xs font-semibold text-slate-800 transition-colors ${
            !originValid && originText.trim() !== ''
              ? 'border-amber-400 bg-amber-50/50'
              : showOriginDropdown
              ? 'border-[#1AC8A0] bg-white ring-2 ring-[#1AC8A0]/20'
              : 'border-slate-200'
          }`}
        >
          <Navigation className="w-4 h-4 text-[#1F3A5F] shrink-0" />
          <input
            type="text"
            value={originText}
            onChange={(e) => {
              setOriginText(e.target.value);
              setShowOriginDropdown(true);
            }}
            onFocus={() => setShowOriginDropdown(true)}
            placeholder="Starting point (e.g. Chennai Central)"
            className="bg-transparent w-full focus:outline-hidden text-slate-900 font-bold text-xs"
          />
          {originValid && (
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <button
            type="button"
            onClick={handleVoiceOrigin}
            title="Voice input for origin"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
              isListeningOrigin
                ? 'bg-red-100 text-red-600 animate-pulse'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Origin Dropdown */}
        {showOriginDropdown && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden max-h-56 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
              Select Starting Point (6 Hotspots)
            </div>
            {originFiltered.length > 0 ? (
              originFiltered.map((loc) => {
                const isSelected = loc === originText;
                const isDestMatch = loc === destText;
                return (
                  <button
                    key={loc}
                    type="button"
                    disabled={isDestMatch}
                    onClick={() => handleSelectOrigin(loc)}
                    className={`w-full text-left px-3.5 py-2.5 text-xs font-bold transition-colors flex items-center justify-between border-b border-slate-50 last:border-0 ${
                      isDestMatch
                        ? 'bg-slate-50 text-slate-400 cursor-not-allowed opacity-60'
                        : isSelected
                        ? 'bg-[#E6FAF5] text-[#064E3B]'
                        : 'hover:bg-slate-50 text-slate-800 cursor-pointer'
                    }`}
                  >
                    <div>
                      <div className="font-bold">{loc}</div>
                      <div className="text-[10px] font-normal text-slate-500">
                        {LOCATION_DETAILS[loc]}
                      </div>
                    </div>
                    {isDestMatch ? (
                      <span className="text-[10px] font-semibold text-slate-400">
                        (Selected as Destination)
                      </span>
                    ) : isSelected ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : null}
                  </button>
                );
              })
            ) : (
              <div className="p-3 text-xs text-amber-700 bg-amber-50">
                No matching hotspot found.
              </div>
            )}
          </div>
        )}

        {/* Origin Validation Warning */}
        {!originValid && originText.trim() !== '' && !showOriginDropdown && (
          <div className="mt-1 text-[11px] font-semibold text-amber-700 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>
              Try one of: Chennai Central, Egmore, T. Nagar, Koyambedu, Guindy, Tambaram
            </span>
          </div>
        )}
      </div>

      {/* DESTINATION FIELD & FIND ROUTES BUTTON */}
      <div ref={destContainerRef} className="relative">
        <div
          className={`flex items-center gap-2 p-2.5 rounded-xl bg-slate-100 border text-xs font-semibold text-slate-800 transition-colors ${
            !destValid && destText.trim() !== ''
              ? 'border-amber-400 bg-amber-50/50'
              : showDestDropdown
              ? 'border-[#1AC8A0] bg-white ring-2 ring-[#1AC8A0]/20'
              : 'border-slate-200'
          }`}
        >
          <MapPin className="w-4 h-4 text-red-600 shrink-0" />
          <input
            type="text"
            value={destText}
            onChange={(e) => {
              setDestText(e.target.value);
              setShowDestDropdown(true);
            }}
            onFocus={() => setShowDestDropdown(true)}
            placeholder="Where to? (e.g. Guindy)"
            className="bg-transparent w-full focus:outline-hidden text-slate-900 font-bold text-xs"
          />
          {destValid && (
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <button
            type="button"
            onClick={handleVoiceDest}
            title="Voice input for destination"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
              isListeningDest
                ? 'bg-red-100 text-red-600 animate-pulse'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
          </button>
          <button
            type="submit"
            disabled={!isFormValid}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
              isFormValid
                ? 'bg-[#1F3A5F] hover:bg-[#132A4A] text-white cursor-pointer shadow-xs'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-60'
            }`}
          >
            Find Routes
          </button>
        </div>

        {/* Destination Dropdown */}
        {showDestDropdown && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden max-h-56 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
              Select Destination (6 Hotspots)
            </div>
            {destFiltered.length > 0 ? (
              destFiltered.map((loc) => {
                const isSelected = loc === destText;
                const isOriginMatch = loc === originText;
                return (
                  <button
                    key={loc}
                    type="button"
                    disabled={isOriginMatch}
                    onClick={() => handleSelectDest(loc)}
                    className={`w-full text-left px-3.5 py-2.5 text-xs font-bold transition-colors flex items-center justify-between border-b border-slate-50 last:border-0 ${
                      isOriginMatch
                        ? 'bg-slate-50 text-slate-400 cursor-not-allowed opacity-60'
                        : isSelected
                        ? 'bg-[#E6FAF5] text-[#064E3B]'
                        : 'hover:bg-slate-50 text-slate-800 cursor-pointer'
                    }`}
                  >
                    <div>
                      <div className="font-bold">{loc}</div>
                      <div className="text-[10px] font-normal text-slate-500">
                        {LOCATION_DETAILS[loc]}
                      </div>
                    </div>
                    {isOriginMatch ? (
                      <span className="text-[10px] font-semibold text-slate-400">
                        (Selected as Origin)
                      </span>
                    ) : isSelected ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : null}
                  </button>
                );
              })
            ) : (
              <div className="p-3 text-xs text-amber-700 bg-amber-50">
                No matching hotspot found.
              </div>
            )}
          </div>
        )}

        {/* Destination Validation Warning */}
        {!destValid && destText.trim() !== '' && !showDestDropdown && (
          <div className="mt-1 text-[11px] font-semibold text-amber-700 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>
              Try one of: Chennai Central, Egmore, T. Nagar, Koyambedu, Guindy, Tambaram
            </span>
          </div>
        )}
      </div>

      {/* SAME LOCATION VALIDATION ERROR */}
      {isSameLocation && (
        <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>Origin and Destination cannot be the same location.</span>
        </div>
      )}
    </form>
  );
}
