import React, { createContext, useState, useEffect } from 'react';
import { DEMO_ROUTES, USER_IMPACT_STATS } from '../utils/api';
import { speakDirections, stopSpeaking } from '../utils/voiceInput';

export const AppContext = createContext();

export function AppProvider({ children }) {
  const [currentView, setCurrentView] = useState('route-options'); // 'map' | 'route-options' | 'route-details' | 'journey-steps' | 'assisted' | 'profile' | 'preferences'
  const [origin, setOrigin] = useState('Chennai Central');
  const [destination, setDestination] = useState('Guindy');
  const [preferences, setPreferences] = useState({
    wheelchair: true,
    avoidStairs: true,
    voiceGuidance: false,
    limitedMobility: false,
    audioNavigation: false
  });
  const [selectedRouteKey, setSelectedRouteKey] = useState('recommended');
  const [routes, setRoutes] = useState(DEMO_ROUTES);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [userStats, setUserStats] = useState(USER_IMPACT_STATS);
  const [journeySubTab, setJourneySubTab] = useState('steps'); // 'map' | 'steps'

  // Selected route object shortcut
  const selectedRoute = routes[selectedRouteKey] || routes.recommended;

  const togglePreference = (key) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handlePlayDirections = () => {
    if (isPlayingAudio) {
      stopSpeaking();
      setIsPlayingAudio(false);
    } else {
      const textToSpeak = "Take Bus 21, then Chennai Metro. Elevator access is available at the transfer and no stairs are required.";
      speakDirections(textToSpeak);
      setIsPlayingAudio(true);
      setTimeout(() => {
        setIsPlayingAudio(false);
      }, 7000);
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
        userStats,
        journeySubTab,
        setJourneySubTab
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
