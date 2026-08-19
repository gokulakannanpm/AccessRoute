import React, { createContext, useState, useCallback } from 'react';
import { DEMO_ROUTES, USER_IMPACT_STATS, searchRoutes } from '../utils/api';
import { speakDirections, stopSpeaking, startVoiceRecognition, stopVoiceRecognition } from '../utils/voiceInput';
import { extractPreferences, explainRoute } from '../utils/geminiClient';

export const AppContext = createContext();

export function AppProvider({ children }) {
  const [currentView, setCurrentView] = useState('route-options'); // 'map' | 'route-options' | 'route-details' | 'journey-steps' | 'assisted' | 'profile' | 'preferences'
  const [origin, setOrigin] = useState('Chennai Central');
  const [destination, setDestination] = useState('Guindy');
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

  // Selected route object shortcut
  const selectedRoute = routes[selectedRouteKey] || routes.recommended;

  // Toggle single preference key
  const togglePreference = (key) => {
    setPreferences((prev) => {
      const updated = {
        ...prev,
        [key]: !prev[key]
      };
      // When user updates preferences, recalculate routes
      refreshRoutes(origin, destination, updated);
      return updated;
    });
  };

  // Re-fetch / re-filter routes dynamically
  const refreshRoutes = async (start = origin, end = destination, currentPrefs = preferences) => {
    try {
      const fetched = await searchRoutes(start, end, currentPrefs);
      if (fetched && (fetched.recommended || fetched.fastest)) {
        setRoutes(fetched);
      }
    } catch (err) {
      console.warn('[AppContext] Failed to refresh routes:', err);
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
        setJourneySubTab
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
