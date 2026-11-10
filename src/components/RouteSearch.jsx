import React, { useContext, useState, useEffect, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { Navigation, MapPin, Mic, AlertCircle, Check, ArrowUpDown, X, Loader2, Clock, Footprints, Bike, Car, Compass } from 'lucide-react';
import { startVoiceRecognition, stopVoiceRecognition } from '../utils/voiceInput';
import { ALL_TRANSIT_STATIONS } from '../utils/transitExplorerData';
import { isUnsupportedLocation, CHENNAI_COVERAGE_MESSAGE } from '../utils/coverage';

// Seeded quick-pick locations
const BASE_LOCATIONS = [
  'Chennai Central',
  'Egmore',
  'T. Nagar',
  'Koyambedu',
  'Guindy',
  'Tambaram',
  'Alandur',
  'Chennai Airport',
  'Saidapet',
  'Thiruvanmiyur',
  'Ambattur OT',
  'Avadi'
];

// Combine base locations with all 140 catalogue stations
export const ALLOWED_LOCATIONS = Array.from(
  new Set([
    ...BASE_LOCATIONS,
    ...ALL_TRANSIT_STATIONS.map((s) => s.name)
  ])
);

export const LOCATION_DETAILS = {
  'Chennai Central': { desc: 'Main railway terminus & Metro interchange (Blue/Green)', mode: 'Metro & Rail' },
  'Egmore': { desc: 'Railway station & Green Line Metro hub', mode: 'Metro & Rail' },
  'T. Nagar': { desc: 'Major MTC bus transit & commercial hub', mode: 'Bus Hub' },
  'Koyambedu': { desc: 'CMBT bus terminus & Green Line Metro', mode: 'Metro & Bus' },
  'Guindy': { desc: 'Metro Blue Line & Suburban rail interchange', mode: 'Interchange' },
  'Tambaram': { desc: 'Major Southern Railway suburban terminus & bus depot', mode: 'Suburban & Bus' },
  'Alandur': { desc: 'Bi-level Metro interchange (Blue & Green Lines)', mode: 'Metro Interchange' },
  'Chennai Airport': { desc: 'International Airport Metro terminal', mode: 'Metro' },
  'Saidapet': { desc: 'Metro Blue Line & MTC transit hub', mode: 'Metro & Bus' },
  'Thiruvanmiyur': { desc: 'MTC Bus depot & MRTS terminal', mode: 'MRTS & Bus' },
  'Ambattur OT': { desc: 'Suburban rail & western bus stand', mode: 'Suburban & Bus' },
  'Avadi': { desc: 'North-west suburban railway & bus terminal', mode: 'Suburban & Bus' }
};

const LOCATION_ALIASES = {
  'chennai central': 'Chennai Central',
  'central': 'Chennai Central',
  'central station': 'Chennai Central',
  'mgr central': 'Chennai Central',
  'puratchi thalaivar': 'Chennai Central',
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
  'tambaram bus stand': 'Tambaram',
  'alandur': 'Alandur',
  'alandur metro': 'Alandur',
  'airport': 'Chennai Airport',
  'chennai airport': 'Chennai Airport',
  'saidapet': 'Saidapet',
  'saidapet metro': 'Saidapet',
  'thiruvanmiyur': 'Thiruvanmiyur',
  'ambattur': 'Ambattur OT',
  'ambattur ot': 'Ambattur OT',
  'avadi': 'Avadi'
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
    departureTime,
    setDepartureTime,
    routingMode,
    setRoutingMode,
    geoProfile,
    setGeoProfile,
    searchGeographicalRoute,
    useSyntheticFixtures,
    setUseSyntheticFixtures,
    preferences,
    transportModes,
    searchTimetableJourneys,
    loadIllustrativePreview,
    refreshRoutes,
    setCurrentView,
    isSearching
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
    if (origin) {
      setOriginText(origin);
    }
  }, [origin]);

  useEffect(() => {
    if (destination) {
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

  const isOriginUnsupported = isUnsupportedLocation(originText);
  const isDestUnsupported = isUnsupportedLocation(destText);
  const hasUnsupportedLocation = isOriginUnsupported || isDestUnsupported;

  const originValid = !isOriginUnsupported && (
    ALLOWED_LOCATIONS.some(
      (l) => l.toLowerCase() === originText.trim().toLowerCase()
    ) || originText.trim().length > 1
  );

  const destValid = !isDestUnsupported && (
    ALLOWED_LOCATIONS.some(
      (l) => l.toLowerCase() === destText.trim().toLowerCase()
    ) || destText.trim().length > 1
  );

  const isSameLocation = originText.trim().toLowerCase() === destText.trim().toLowerCase() && originText.trim() !== '';
  const isFormValid = originValid && destValid && !isSameLocation && !hasUnsupportedLocation;

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

  // Swap Source and Destination control
  const handleSwap = () => {
    const prevOrigin = originText;
    const prevDest = destText;
    setOriginText(prevDest);
    setDestText(prevOrigin);
    setOrigin(prevDest);
    setDestination(prevOrigin);
    if (routingMode === 'geographical') {
      searchGeographicalRoute(prevDest, prevOrigin, geoProfile, preferences);
    } else if (routingMode === 'timetable') {
      searchTimetableJourneys(prevDest, prevOrigin, departureTime, preferences, transportModes, useSyntheticFixtures);
    } else {
      loadIllustrativePreview(prevDest, prevOrigin, preferences);
    }
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

    if (routingMode === 'geographical') {
      searchGeographicalRoute(originText, destText, geoProfile, preferences);
    } else if (routingMode === 'timetable') {
      searchTimetableJourneys(originText, destText, departureTime, preferences, transportModes, useSyntheticFixtures);
    } else {
      loadIllustrativePreview(originText, destText, preferences);
    }

    if (onSearchComplete) {
      onSearchComplete();
    } else if (setCurrentView) {
      setCurrentView('route-options');
    }
  };

  return (
    <form onSubmit={handleSearchSubmit} className="space-y-3 relative" aria-label="Journey Search Form">
      {/* Route Type Selector: Transit Preview vs Geographical (Walk / Bike / Drive) */}
      <div className="flex items-center gap-1 p-1 bg-[#F5F3ED] rounded-xl border border-[#DCE3EB] text-[11px] font-bold">
        <button
          type="button"
          onClick={() => {
            setRoutingMode('illustrative');
            loadIllustrativePreview(originText, destText, preferences);
          }}
          className={`flex-1 py-1 px-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
            routingMode !== 'geographical'
              ? 'bg-[#263B68] text-white shadow-xs'
              : 'text-[#5B6E88] hover:text-[#263B68]'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Transit</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setRoutingMode('geographical');
            setGeoProfile('walking');
            searchGeographicalRoute(originText, destText, 'walking', preferences);
          }}
          className={`flex-1 py-1 px-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
            routingMode === 'geographical' && geoProfile === 'walking'
              ? 'bg-[#263B68] text-white shadow-xs'
              : 'text-[#5B6E88] hover:text-[#263B68]'
          }`}
        >
          <Footprints className="w-3.5 h-3.5" />
          <span>Walk</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setRoutingMode('geographical');
            setGeoProfile('cycling');
            searchGeographicalRoute(originText, destText, 'cycling', preferences);
          }}
          className={`flex-1 py-1 px-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
            routingMode === 'geographical' && geoProfile === 'cycling'
              ? 'bg-[#263B68] text-white shadow-xs'
              : 'text-[#5B6E88] hover:text-[#263B68]'
          }`}
        >
          <Bike className="w-3.5 h-3.5" />
          <span>Cycle</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setRoutingMode('geographical');
            setGeoProfile('driving');
            searchGeographicalRoute(originText, destText, 'driving', preferences);
          }}
          className={`flex-1 py-1 px-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
            routingMode === 'geographical' && geoProfile === 'driving'
              ? 'bg-[#263B68] text-white shadow-xs'
              : 'text-[#5B6E88] hover:text-[#263B68]'
          }`}
        >
          <Car className="w-3.5 h-3.5" />
          <span>Drive</span>
        </button>
      </div>

      {/* Chennai-Only Coverage Alert */}
      {hasUnsupportedLocation && (
        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold flex items-start gap-2 shadow-xs">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-amber-950">Outside Supported Geographic Scope</div>
            <div className="text-[11px] text-amber-800 leading-snug">{CHENNAI_COVERAGE_MESSAGE}</div>
          </div>
        </div>
      )}
      {/* ORIGIN FIELD */}
      <div ref={originContainerRef} className="relative">
        <label htmlFor="planner-origin-input" className="block text-[11px] font-bold text-[#5B6E88] uppercase tracking-wider mb-1">
          Starting Point (Origin)
        </label>
        <div
          className={`flex items-center gap-2 p-2.5 rounded-xl bg-[#FFFFFF] border text-xs font-semibold text-slate-800 transition-all ${
            !originValid && originText.trim() !== ''
              ? 'border-amber-400 bg-amber-50/40'
              : showOriginDropdown
              ? 'border-[#263B68] ring-2 ring-[#60C4D4]/30'
              : 'border-[#DCE3EB] hover:border-[#8CA0BA]'
          }`}
        >
          <Navigation className="w-4 h-4 text-[#263B68] shrink-0" aria-hidden="true" />
          <input
            id="planner-origin-input"
            type="text"
            value={originText}
            onChange={(e) => {
              setOriginText(e.target.value);
              setShowOriginDropdown(true);
            }}
            onFocus={() => setShowOriginDropdown(true)}
            placeholder="Starting point (e.g. Chennai Central)"
            className="bg-transparent w-full focus:outline-hidden text-slate-900 font-bold text-xs"
            aria-autocomplete="list"
            aria-expanded={showOriginDropdown}
          />
          {originText && (
            <button
              type="button"
              onClick={() => {
                setOriginText('');
                setShowOriginDropdown(true);
              }}
              className="p-1 text-[#8CA0BA] hover:text-[#5B6E88] rounded-md cursor-pointer shrink-0"
              aria-label="Clear origin"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          {originValid && (
            <Check className="w-4 h-4 text-emerald-600 shrink-0" aria-label="Origin valid" />
          )}
          <button
            type="button"
            onClick={handleVoiceOrigin}
            title="Voice input for origin"
            aria-label="Voice input for starting point"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
              isListeningOrigin
                ? 'bg-red-100 text-red-600 animate-pulse'
                : 'text-[#8CA0BA] hover:text-[#263B68] hover:bg-[#F5F3ED]'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Origin Dropdown */}
        {showOriginDropdown && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-[#FFFFFF] border border-[#DCE3EB] rounded-xl shadow-lg z-50 overflow-hidden max-h-56 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="px-3 py-1.5 bg-[#F5F3ED] border-b border-[#DCE3EB] text-[10px] font-extrabold uppercase text-[#5B6E88] tracking-wider flex justify-between items-center">
              <span>Select Starting Point</span>
              <span className="text-[9px] text-[#8CA0BA]">Chennai Transit Hubs</span>
            </div>
            {originFiltered.length > 0 ? (
              originFiltered.map((loc) => {
                const isSelected = loc === originText;
                const isDestMatch = loc === destText;
                const detail = LOCATION_DETAILS[loc] || { desc: 'Chennai Transit Hub', mode: 'Transit' };
                return (
                  <button
                    key={loc}
                    type="button"
                    disabled={isDestMatch}
                    onClick={() => handleSelectOrigin(loc)}
                    className={`w-full text-left px-3.5 py-2 text-xs font-bold transition-colors flex items-center justify-between border-b border-[#F5F3ED] last:border-0 ${
                      isDestMatch
                        ? 'bg-slate-50 text-[#8CA0BA] cursor-not-allowed opacity-60'
                        : isSelected
                        ? 'bg-[#EEF7F9] text-[#263B68] border-l-3 border-[#60C4D4]'
                        : 'hover:bg-[#F5F3ED] text-slate-800 cursor-pointer'
                    }`}
                  >
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        <span className={isSelected ? 'text-[#263B68]' : 'text-slate-900'}>{loc}</span>
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-sm bg-[#EEF3FA] text-[#263B68]">
                          {detail.mode}
                        </span>
                      </div>
                      <div className="text-[10px] font-normal text-[#5B6E88]">
                        {detail.desc}
                      </div>
                    </div>
                    {isDestMatch ? (
                      <span className="text-[10px] font-semibold text-[#8CA0BA]">
                        (Selected as Destination)
                      </span>
                    ) : isSelected ? (
                      <Check className="w-4 h-4 text-[#263B68]" />
                    ) : null}
                  </button>
                );
              })
            ) : (
              <div className="p-3 text-xs text-amber-800 bg-amber-50">
                No matching hotspot found. Try: Central, Guindy, Egmore, CMBT, Tambaram
              </div>
            )}
          </div>
        )}
      </div>

      {/* SWAP SOURCE AND DESTINATION CONTROL */}
      <div className="flex justify-center -my-1 z-10 relative">
        <button
          type="button"
          onClick={handleSwap}
          aria-label="Swap starting point and destination"
          title="Swap starting point and destination"
          className="px-3 py-1 rounded-full bg-[#FFFFFF] hover:bg-[#F5F3ED] text-[#263B68] border border-[#DCE3EB] shadow-2xs hover:border-[#60C4D4] transition-all active:scale-95 duration-150 cursor-pointer flex items-center gap-1.5 group select-none"
        >
          <ArrowUpDown className="w-3.5 h-3.5 text-[#263B68] group-hover:text-[#60C4D4] transition-colors" />
          <span className="text-[10px] font-bold text-[#5B6E88] group-hover:text-[#263B68]">Swap</span>
        </button>
      </div>

      {/* DESTINATION FIELD & FIND ROUTES BUTTON */}
      <div ref={destContainerRef} className="relative">
        <label htmlFor="planner-dest-input" className="block text-[11px] font-bold text-[#5B6E88] uppercase tracking-wider mb-1">
          Destination (Where to?)
        </label>
        <div
          className={`flex items-center gap-2 p-2.5 rounded-xl bg-[#FFFFFF] border text-xs font-semibold text-slate-800 transition-all ${
            !destValid && destText.trim() !== ''
              ? 'border-amber-400 bg-amber-50/40'
              : showDestDropdown
              ? 'border-[#263B68] ring-2 ring-[#60C4D4]/30'
              : 'border-[#DCE3EB] hover:border-[#8CA0BA]'
          }`}
        >
          <MapPin className="w-4 h-4 text-[#DC2626] shrink-0" aria-hidden="true" />
          <input
            id="planner-dest-input"
            type="text"
            value={destText}
            onChange={(e) => {
              setDestText(e.target.value);
              setShowDestDropdown(true);
            }}
            onFocus={() => setShowDestDropdown(true)}
            placeholder="Where to? (e.g. Guindy)"
            className="bg-transparent w-full focus:outline-hidden text-slate-900 font-bold text-xs"
            aria-autocomplete="list"
            aria-expanded={showDestDropdown}
          />
          {destText && (
            <button
              type="button"
              onClick={() => {
                setDestText('');
                setShowDestDropdown(true);
              }}
              className="p-1 text-[#8CA0BA] hover:text-[#5B6E88] rounded-md cursor-pointer shrink-0"
              aria-label="Clear destination"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          {destValid && (
            <Check className="w-4 h-4 text-emerald-600 shrink-0" aria-label="Destination valid" />
          )}
          <button
            type="button"
            onClick={handleVoiceDest}
            title="Voice input for destination"
            aria-label="Voice input for destination"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
              isListeningDest
                ? 'bg-red-100 text-red-600 animate-pulse'
                : 'text-[#8CA0BA] hover:text-[#263B68] hover:bg-[#F5F3ED]'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
          </button>
          <button
            type="submit"
            disabled={!isFormValid || isSearching}
            aria-label="Find accessible routes"
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 shadow-xs ${
              isFormValid && !isSearching
                ? 'bg-[#263B68] hover:bg-[#1B2B4C] text-[#FFFFFF] cursor-pointer'
                : 'bg-[#DCE3EB] text-[#8CA0BA] cursor-not-allowed opacity-75'
            }`}
          >
            {isSearching ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <span>Find Routes</span>
            )}
          </button>
        </div>

        {/* Destination Dropdown */}
        {showDestDropdown && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-[#FFFFFF] border border-[#DCE3EB] rounded-xl shadow-lg z-50 overflow-hidden max-h-56 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="px-3 py-1.5 bg-[#F5F3ED] border-b border-[#DCE3EB] text-[10px] font-extrabold uppercase text-[#5B6E88] tracking-wider flex justify-between items-center">
              <span>Select Destination</span>
              <span className="text-[9px] text-[#8CA0BA]">Chennai Transit Hubs</span>
            </div>
            {destFiltered.length > 0 ? (
              destFiltered.map((loc) => {
                const isSelected = loc === destText;
                const isOriginMatch = loc === originText;
                const detail = LOCATION_DETAILS[loc] || { desc: 'Chennai Transit Hub', mode: 'Transit' };
                return (
                  <button
                    key={loc}
                    type="button"
                    disabled={isOriginMatch}
                    onClick={() => handleSelectDest(loc)}
                    className={`w-full text-left px-3.5 py-2 text-xs font-bold transition-colors flex items-center justify-between border-b border-[#F5F3ED] last:border-0 ${
                      isOriginMatch
                        ? 'bg-slate-50 text-[#8CA0BA] cursor-not-allowed opacity-60'
                        : isSelected
                        ? 'bg-[#EEF7F9] text-[#263B68] border-l-3 border-[#60C4D4]'
                        : 'hover:bg-[#F5F3ED] text-slate-800 cursor-pointer'
                    }`}
                  >
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        <span className={isSelected ? 'text-[#263B68]' : 'text-slate-900'}>{loc}</span>
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-sm bg-[#EEF3FA] text-[#263B68]">
                          {detail.mode}
                        </span>
                      </div>
                      <div className="text-[10px] font-normal text-[#5B6E88]">
                        {detail.desc}
                      </div>
                    </div>
                    {isOriginMatch ? (
                      <span className="text-[10px] font-semibold text-[#8CA0BA]">
                        (Selected as Origin)
                      </span>
                    ) : isSelected ? (
                      <Check className="w-4 h-4 text-[#263B68]" />
                    ) : null}
                  </button>
                );
              })
            ) : (
              <div className="p-3 text-xs text-amber-800 bg-amber-50">
                No matching hotspot found. Try: Guindy, Central, Egmore, CMBT, Tambaram
              </div>
            )}
          </div>
        )}
      </div>

      {/* TIMETABLE ROUTING CONTROLS: DEPARTURE TIME & ENGINE MODE */}
      <div className="pt-1 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Departure Time Input */}
          <div className="flex items-center gap-2 bg-[#FFFFFF] border border-[#DCE3EB] rounded-xl px-2.5 py-1.5 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-[#263B68] shrink-0" />
            <label htmlFor="planner-departure-time" className="text-[11px] font-bold text-[#5B6E88] uppercase tracking-wider">
              Departure:
            </label>
            <input
              type="time"
              id="planner-departure-time"
              value={departureTime || '08:30'}
              onChange={(e) => setDepartureTime(e.target.value)}
              className="text-xs font-bold text-[#263B68] bg-transparent focus:outline-hidden"
            />
          </div>

          {/* Engine Routing Mode Toggle */}
          <div className="flex items-center p-0.5 rounded-lg bg-[#F5F3ED] border border-[#DCE3EB] text-xs font-bold">
            <button
              type="button"
              onClick={() => setRoutingMode('timetable')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                routingMode === 'timetable'
                  ? 'bg-[#263B68] text-[#FFFFFF] shadow-2xs'
                  : 'text-[#5B6E88] hover:text-[#263B68]'
              }`}
            >
              Timetable Search
            </button>
            <button
              type="button"
              onClick={() => setRoutingMode('illustrative')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                routingMode === 'illustrative'
                  ? 'bg-[#263B68] text-[#FFFFFF] shadow-2xs'
                  : 'text-[#5B6E88] hover:text-[#263B68]'
              }`}
            >
              Illustrative Preview
            </button>
          </div>
        </div>

        {/* Synthetic Fixtures Evaluator Toggle */}
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#F5F3ED]/70 border border-[#DCE3EB] text-[10px]">
          <label htmlFor="planner-synthetic-fixtures" className="flex items-center gap-1.5 cursor-pointer text-[#5B6E88] font-medium">
            <input
              type="checkbox"
              id="planner-synthetic-fixtures"
              checked={Boolean(useSyntheticFixtures)}
              onChange={(e) => setUseSyntheticFixtures(e.target.checked)}
              className="w-3.5 h-3.5 accent-[#263B68] cursor-pointer rounded"
            />
            <span>Use Synthetic Test Fixtures (Evaluate real CSA multimodal calculation)</span>
          </label>
          <span className="text-[9px] text-[#8CA0BA] font-mono">
            {useSyntheticFixtures ? 'Fixtures Active' : 'Production Feeds (Quarantined)'}
          </span>
        </div>
      </div>

      {/* SAME LOCATION VALIDATION ERROR */}
      {isSameLocation && (
        <div role="alert" className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
          <span>Origin and Destination cannot be the same location. Please choose two different transit hubs.</span>
        </div>
      )}
    </form>
  );
}

