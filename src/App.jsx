import React, { useContext } from 'react';
import { AppProvider, AppContext } from './context/AppContext';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { RouteOptions } from './components/RouteOptions';
import { RouteDetails } from './components/RouteDetails';
import { JourneySteps } from './components/JourneySteps';
import { AssistedTravel } from './components/AssistedTravel';
import { Profile } from './components/Profile';
import { TravelPreferences } from './components/TravelPreferences';
import { ReportIssue } from './components/ReportIssue';
import { MapView } from './components/Map';

function AppContent() {
  const { currentView } = useContext(AppContext);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row w-full font-sans antialiased text-slate-900">
      {/* Desktop Sidebar & Mobile Bottom Navigation */}
      <Navigation />

      {/* Main Container Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Mobile Top Header */}
        <Header />

        {/* Unified Responsive Content Body */}
        <main className="flex-1 p-3 sm:p-4 md:p-6 w-full max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:h-[calc(100vh-5rem)]">
            {/* Left/Middle Column (Route Details / Control Panel) */}
            <div className="route-panel order-2 md:order-1 md:col-span-5 lg:col-span-5 md:h-full md:overflow-y-auto pr-1 space-y-4">
              {currentView === 'profile' && <Profile />}
              {currentView === 'preferences' && <TravelPreferences />}
              {currentView === 'assisted' && <AssistedTravel />}
              {currentView === 'journey-steps' && <JourneySteps />}
              {currentView === 'route-details' && <RouteDetails />}
              {(currentView === 'route-options' || currentView === 'map') && <RouteOptions />}
            </div>

            {/* Right Column (Map Container) */}
            <div
              id="map-container"
              className={`order-1 md:order-2 md:col-span-7 lg:col-span-7 md:h-full ${
                currentView === 'route-options' || currentView === 'map'
                  ? 'h-48 md:h-full w-full rounded-2xl overflow-hidden shadow-xs'
                  : 'hidden md:block'
              }`}
            >
              <MapView />
            </div>
          </div>
        </main>
      </div>

      {/* Accessibility Issue Report Modal */}
      <ReportIssue />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
