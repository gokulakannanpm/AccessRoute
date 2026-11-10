import React, { createContext, useState, useCallback, useEffect } from 'react';
import {
  DEMO_ROUTES,
  USER_IMPACT_STATS,
  searchRoutes,
  searchTimetableRoutes,
  fetchTimetableStatus,
  calculateGeoRoute,
  fetchPedestrianFeatures
} from '../utils/api';
import { speakDirections, stopSpeaking, startVoiceRecognition, stopVoiceRecognition } from '../utils/voiceInput';
import { extractPreferences, explainRoute } from '../utils/geminiClient';

export const AppContext = createContext();

export function AppProvider({ children }) {
  const [currentView, setCurrentView] = useState('route-options'); // 'map' | 'route-options' | 'route-details' | 'journey-steps' | 'assisted' | 'profile' | 'preferences'
  const [origin, setOrigin] = useState('Chennai Central');
  const [destination, setDestination] = useState('Guindy');
  const [departureTime, setDepartureTime] = useState('08:30');
  const [routingMode, setRoutingMode] = useState('illustrative'); // 'geographical' | 'timetable' | 'illustrative'
  const [geoProfile, setGeoProfile] = useState('walking'); // 'walking' | 'cycling' | 'driving'
  const [geoRoute, setGeoRoute] = useState(null);
  const [pedestrianFeatures, setPedestrianFeatures] = useState([]);
  const [searchError, setSearchError] = useState(null); // { code, message, details, status }
  const [timetableStatus, setTimetableStatus] = useState(null);
  const [useSyntheticFixtures, setUseSyntheticFixtures] = useState(false);
  const [activeRoutingResult, setActiveRoutingResult] = useState(null);
  const [preferences, setPreferences] = useState({
    wheelchair: true,
    avoidStairs: true,
    voiceGuidance: false,
    minimizeWalking: false,
    limitedMobility: false,
    audioNavigation: false
  });
  const [selectedRouteKey, setSelectedRouteKey] = useState('recommended');
  const [routes, setRoutes] = useState(DEMO_ROUTES);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [preferencesUnderstood, setPreferencesUnderstood] = useState(true);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [aiRouteExplanation, setAiRouteExplanation] = useState(
    'Take Bus 21, then Chennai Metro. Elevator access is available at the transfer and no stairs are required.'
  );
  const [userStats, setUserStats] = useState(USER_IMPACT_STATS);
  const [journeySubTab, setJourneySubTab] = useState('steps'); // 'map' | 'steps'
  const [mobileTab, setMobileTab] = useState('planner'); // 'planner' | 'map'
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [transportModes, setTransportModes] = useState({
    bus: true,        // MTC Bus
    metro: true,      // Chennai Metro
    suburban: true,   // Chennai Suburban Railway
    express: false    // Express / Long Distance Rail
  });

  // Transit Network Explorer State (Phase 12)
  const [mainTab, setMainTab] = useState('planner'); // 'planner' | 'explorer'
  const [explorerActiveModes, setExplorerActiveModes] = useState([
    'chennai_metro',
    'suburban_rail',
    'mtc_bus',
    'express_rail'
  ]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [explorerSearchQuery, setExplorerSearchQuery] = useState('');
  const [selectedCorridorId, setSelectedCorridorId] = useState('blue_line');
  const [explorerViewMode, setExplorerViewMode] = useState('list'); // 'list' | 'corridors' | 'transparency'

  const toggleExplorerMode = (modeId) => {
    setExplorerActiveModes((prev) => {
      if (prev.includes(modeId)) {
        // Prevent unselecting all modes: keep at least 1
        if (prev.length <= 1) return prev;
        return prev.filter((m) => m !== modeId);
      } else {
        return [...prev, modeId];
      }
    });
  };

  const setStationAsOrigin = (station) => {
    if (!station) return;
    setOrigin(station.name);
    setMainTab('planner');
    refreshRoutes(station.name, destination, preferences);
  };

  const setStationAsDestination = (station) => {
    if (!station) return;
    setDestination(station.name);
    setMainTab('planner');
    refreshRoutes(origin, station.name, preferences);
  };

  // Selected route object shortcut
  const selectedRoute = routes ? (routes[selectedRouteKey] || routes.recommended) : null;

  // On mount, fetch feed eligibility status and pedestrian features from backend
  useEffect(() => {
    fetchTimetableStatus().then((status) => {
      if (status) {
        setTimetableStatus(status);
      }
    });
    fetchPedestrianFeatures().then((features) => {
      if (features && features.length > 0) {
        setPedestrianFeatures(features);
      }
    });
  }, []);

  // Toggle transport mode preference (MTC bus, Metro, Suburban, Express)
  const toggleTransportMode = (modeKey) => {
    setTransportModes((prev) => {
      const updated = {
        ...prev,
        [modeKey]: !prev[modeKey]
      };
      if (routingMode === 'timetable') {
        searchTimetableJourneys(origin, destination, departureTime, preferences, updated, useSyntheticFixtures);
      }
      return updated;
    });
  };

  // Swap origin and destination control
  const swapLocations = () => {
    const prevOrigin = origin;
    const prevDest = destination;
    setOrigin(prevDest);
    setDestination(prevOrigin);
    refreshRoutes(prevDest, prevOrigin, preferences);
  };

  // Toggle single preference key
  const togglePreference = (key) => {
    setPreferences((prev) => {
      const updated = {
        ...prev,
        [key]: !prev[key]
      };
      refreshRoutes(origin, destination, updated);
      return updated;
    });
  };

  /**
   * Search real timetable schedules via Connection Scan Algorithm engine
   * Never falls back to illustrative routes when real data is unavailable.
   */
  const searchTimetableJourneys = async (
    start = origin,
    end = destination,
    time = departureTime,
    currentPrefs = preferences,
    modes = transportModes,
    synthetic = useSyntheticFixtures
  ) => {
    setIsSearching(true);
    setSearchError(null);
    setRoutingMode('timetable');
    try {
      const formattedTime = time && time.length === 5 ? `${time}:00` : (time || '08:30:00');
      const res = await searchTimetableRoutes({
        origin: start,
        destination: end,
        departureTime: formattedTime,
        preferences: currentPrefs,
        transportModes: modes,
        useSyntheticFixtures: synthetic
      });

      if (res.success && res.data) {
        setRoutes(res.data);
        setSelectedRouteKey('recommended');
        setSearchError(null);
        setActiveRoutingResult(res.data);
      } else {
        // Honest error handling: NO silent fallback to illustrative routes!
        setRoutes(null);
        setSearchError({
          code: res.code || 'ROUTING_ERROR',
          message: res.error || 'Verified timetable data is not yet available for Chennai transit feeds.',
          status: res.status || 500,
          details: res.details || {}
        });
      }
    } catch (err) {
      setRoutes(null);
      setSearchError({
        code: 'NETWORK_ERROR',
        message: err.message,
        status: 500,
        details: {}
      });
    } finally {
      setIsSearching(false);
    }
  };

  /**
   * Calculate geographical route via free OpenStreetMap / OSRM & local topological engine
   */
  const searchGeographicalRoute = async (
    start = origin,
    end = destination,
    profile = geoProfile,
    currentPrefs = preferences
  ) => {
    setIsSearching(true);
    setSearchError(null);
    setRoutingMode('geographical');
    try {
      const res = await calculateGeoRoute({
        origin: start,
        destination: end,
        profile,
        preferences: currentPrefs
      });

      if (res.success && res.data) {
        setGeoRoute(res.data);
        setSearchError(null);
        setActiveRoutingResult(res.data);
      } else {
        setGeoRoute(null);
        setSearchError({
          code: res.code || 'ROUTING_ERROR',
          message: res.error || 'Geographical route calculation failed.',
          status: res.status || 400,
          details: res.details || {}
        });
      }
    } catch (err) {
      setGeoRoute(null);
      setSearchError({
        code: 'NETWORK_ERROR',
        message: err.message,
        status: 500,
        details: {}
      });
    } finally {
      setIsSearching(false);
    }
  };

  /**
   * Load illustrative corridor preview (clearly labelled separate preview)
   */
  const loadIllustrativePreview = async (start = origin, end = destination, currentPrefs = preferences) => {
    setIsSearching(true);
    setSearchError(null);
    setRoutingMode('illustrative');
    try {
      const fetched = await searchRoutes(start, end, currentPrefs, 'illustrative');
      if (fetched) {
        setRoutes(fetched);
        setSelectedRouteKey('recommended');
        setActiveRoutingResult(fetched);
      }
    } catch (err) {
      console.warn('[AppContext] Failed to load illustrative preview:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Re-fetch / re-filter routes dynamically
  const refreshRoutes = async (start = origin, end = destination, currentPrefs = preferences) => {
    if (routingMode === 'geographical') {
      return await searchGeographicalRoute(start, end, geoProfile, currentPrefs);
    } else if (routingMode === 'timetable') {
      return await searchTimetableJourneys(start, end, departureTime, currentPrefs, transportModes, useSyntheticFixtures);
    } else {
      return await loadIllustrativePreview(start, end, currentPrefs);
    }
  };

  // Process voice transcript with Gemini preference extraction and route explanation
  const handleProcessVoice = useCallback(async (transcript) => {
    if (!transcript || typeof transcript !== 'string') return;
    
    setIsAiProcessing(true);
    setVoiceTranscript(transcript);

    try {
      // 1. Extract structured preferences with Gemini & offline fallback
      const extracted = await extractPreferences(transcript);
      console.log('[AppContext] Extracted preferences from voice/text:', extracted);

      const ALLOWED_LOCATIONS = [
        'Chennai Central',
        'Egmore',
        'T. Nagar',
        'Koyambedu',
        'Guindy',
        'Tambaram'
      ];

      let newOrigin = origin;
      let newDest = destination;
      const originExtracted = extracted.origin && ALLOWED_LOCATIONS.includes(extracted.origin);
      const destExtracted = extracted.destination && ALLOWED_LOCATIONS.includes(extracted.destination);

      if (originExtracted) {
        newOrigin = extracted.origin;
        setOrigin(extracted.origin);
      }

      if (destExtracted) {
        newDest = extracted.destination;
        setDestination(extracted.destination);
      }

      // 2. Update preferences state
      const updatedPrefs = {
        wheelchair: Boolean(extracted.wheelchair),
        avoidStairs: Boolean(extracted.avoidStairs),
        minimizeWalking: Boolean(extracted.minimizeWalking),
        voiceGuidance: Boolean(extracted.voiceGuidance),
        limitedMobility: Boolean(extracted.minimizeWalking),
        audioNavigation: Boolean(extracted.voiceGuidance)
      };
      setPreferences(updatedPrefs);
      setPreferencesUnderstood(true);

      // 3. Check location extraction completeness & route search
      if (!originExtracted && !destExtracted) {
        setAiRouteExplanation('Please specify your origin and destination from our 6 supported hotspots: Chennai Central, Egmore, T. Nagar, Koyambedu, Guindy, Tambaram.');
      } else if (!originExtracted && destExtracted) {
        setAiRouteExplanation(`I detected ${newDest} as your destination. Where are you traveling from? (Supported: Chennai Central, Egmore, T. Nagar, Koyambedu, Guindy, Tambaram)`);
      } else if (originExtracted && !destExtracted) {
        setAiRouteExplanation(`I detected ${newOrigin} as your starting point. Where would you like to go? (Supported: Chennai Central, Egmore, T. Nagar, Koyambedu, Guindy, Tambaram)`);
      } else if (newOrigin === newDest) {
        setAiRouteExplanation('Origin and destination cannot be the same location. Please select two different hotspots.');
      } else {
        // Both origin and destination resolved cleanly!
        const fetchedRoutes = await searchRoutes(newOrigin, newDest, updatedPrefs);
        if (fetchedRoutes) {
          setRoutes(fetchedRoutes);
        }
        const activeRoute = fetchedRoutes?.recommended || DEMO_ROUTES.recommended;
        const explanation = await explainRoute(activeRoute);
        setAiRouteExplanation(explanation);
      }

      setCurrentView('assisted');
    } catch (err) {
      console.error('[AppContext] Error in handleProcessVoice:', err);
      setPreferencesUnderstood(true);
      setCurrentView('assisted');
    } finally {
      setIsAiProcessing(false);
    }
  }, [destination, origin, setOrigin, setDestination, setRoutes, setPreferences, setPreferencesUnderstood, setAiRouteExplanation, setCurrentView]);

  // Voice Search initiation helper
  const triggerVoiceSearch = () => {
    if (isListeningVoice) {
      stopVoiceRecognition();
      setIsListeningVoice(false);
      return;
    }

    setIsListeningVoice(true);
    startVoiceRecognition({
      onStart: () => {
        setIsListeningVoice(true);
      },
      onResult: (transcript) => {
        setIsListeningVoice(false);
        if (transcript) {
          handleProcessVoice(transcript);
        }
      },
      onError: (err) => {
        console.warn('[AppContext] Voice recognition error:', err);
        setIsListeningVoice(false);
        // Fallback simulation if browser blocks mic
        handleProcessVoice("I'm in a wheelchair and want to go to Guindy without stairs.");
      },
      onEnd: () => {
        setIsListeningVoice(false);
      }
    });
  };

  // Play audio directions
  const handlePlayDirections = () => {
    if (isPlayingAudio) {
      stopSpeaking();
      setIsPlayingAudio(false);
    } else {
      const textToSpeak =
        aiRouteExplanation ||
        'Take Bus 21, then Chennai Metro. Elevator access is available at the transfer and no stairs are required.';
      
      setIsPlayingAudio(true);
      speakDirections(textToSpeak, () => {
        setIsPlayingAudio(false);
      });
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentView,
        setCurrentView,
        origin,
        setOrigin,
        destination,
        setDestination,
        preferences,
        setPreferences,
        togglePreference,
        selectedRouteKey,
        setSelectedRouteKey,
        selectedRoute,
        routes,
        setRoutes,
        isReportModalOpen,
        setIsReportModalOpen,
        isPlayingAudio,
        handlePlayDirections,
        isAiProcessing,
        isListeningVoice,
        preferencesUnderstood,
        setPreferencesUnderstood,
        voiceTranscript,
        aiRouteExplanation,
        handleProcessVoice,
        triggerVoiceSearch,
        refreshRoutes,
        userStats,
        journeySubTab,
        setJourneySubTab,
        transportModes,
        toggleTransportMode,
        selectedPlace,
        setSelectedPlace,
        isSearching,
        mobileTab,
        setMobileTab,
        swapLocations,
        departureTime,
        setDepartureTime,
        routingMode,
        setRoutingMode,
        geoProfile,
        setGeoProfile,
        geoRoute,
        setGeoRoute,
        searchGeographicalRoute,
        pedestrianFeatures,
        setPedestrianFeatures,
        searchError,
        setSearchError,
        timetableStatus,
        setTimetableStatus,
        useSyntheticFixtures,
        setUseSyntheticFixtures,
        activeRoutingResult,
        setActiveRoutingResult,
        searchTimetableJourneys,
        loadIllustrativePreview,
        mainTab,
        setMainTab,
        explorerActiveModes,
        setExplorerActiveModes,
        toggleExplorerMode,
        selectedStation,
        setSelectedStation,
        explorerSearchQuery,
        setExplorerSearchQuery,
        selectedCorridorId,
        setSelectedCorridorId,
        explorerViewMode,
        setExplorerViewMode,
        setStationAsOrigin,
        setStationAsDestination
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
