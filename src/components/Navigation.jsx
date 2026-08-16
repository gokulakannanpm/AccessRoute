import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Map, Navigation2, User, AlertTriangle, Settings, HelpCircle, Accessibility } from 'lucide-react';

export function Navigation() {
  const { currentView, setCurrentView, setIsReportModalOpen } = useContext(AppContext);

  // Determine active tab category
  const isMapTab = ['map', 'route-options', 'route-details'].includes(currentView);
  const isJourneysTab = ['journeys', 'journey-steps', 'assisted'].includes(currentView);
  const isProfileTab = currentView === 'profile';

  return (
    <>
      {/* MOBILE BOTTOM NAVIGATION (Visible < 768px) */}
      <nav aria-label="Mobile Navigation" className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2 shadow-lg">
        <div className="max-w-md mx-auto flex items-center justify-around">
          {/* Map Tab */}
          <button
            onClick={() => setCurrentView('route-options')}
            className={`flex flex-col items-center justify-center py-1.5 px-6 rounded-2xl transition-all duration-200 ${
              isMapTab
                ? 'bg-[#6EE7B7] text-[#064E3B] font-bold shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Map className="w-5 h-5 mb-0.5" />
            <span className="text-xs tracking-tight">Map</span>
          </button>

          {/* Journeys Tab */}
          <button
            onClick={() => setCurrentView('journey-steps')}
            className={`flex flex-col items-center justify-center py-1.5 px-6 rounded-2xl transition-all duration-200 ${
              isJourneysTab
                ? 'bg-[#6EE7B7] text-[#064E3B] font-bold shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Navigation2 className="w-5 h-5 mb-0.5" />
            <span className="text-xs tracking-tight">Journeys</span>
          </button>

          {/* Profile Tab */}
          <button
            onClick={() => setCurrentView('profile')}
            className={`flex flex-col items-center justify-center py-1.5 px-6 rounded-2xl transition-all duration-200 ${
              isProfileTab
                ? 'bg-[#6EE7B7] text-[#064E3B] font-bold shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-5 h-5 mb-0.5" />
            <span className="text-xs tracking-tight">Profile</span>
          </button>
        </div>
      </nav>

      {/* DESKTOP SIDEBAR NAVIGATION (Visible >= 768px) */}
      <aside aria-label="Desktop Navigation" className="hidden md:flex flex-col w-64 bg-[#F8FAFC] border-r border-slate-200 h-screen sticky top-0 shrink-0 p-4 justify-between">
        <div className="space-y-6">
          {/* Brand Header with Wheelchair Accessibility Icon matching Stitch */}
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-9 h-9 rounded-xl bg-[#1F3A5F] text-[#1AC8A0] flex items-center justify-center font-bold text-lg shadow-xs">
              <Accessibility className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1F3A5F] leading-tight">AccessRoute</h2>
              <p className="text-[11px] text-slate-500 font-medium">Mobility Infrastructure</p>
            </div>
          </div>


          {/* Navigation Links */}
          <nav aria-label="Desktop Sidebar Navigation" className="space-y-1.5">
            <button
              onClick={() => setCurrentView('route-options')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                isMapTab
                  ? 'bg-[#1AC8A0] text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
              }`}
            >
              <Map className="w-5 h-5" />
              <span>Map</span>
            </button>

            <button
              onClick={() => setCurrentView('journey-steps')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                isJourneysTab
                  ? 'bg-[#1AC8A0] text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
              }`}
            >
              <Navigation2 className="w-5 h-5" />
              <span>Journeys</span>
            </button>

            <button
              onClick={() => setCurrentView('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                isProfileTab
                  ? 'bg-[#1AC8A0] text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
              }`}
            >
              <User className="w-5 h-5" />
              <span>Profile</span>
            </button>
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Report Issue</span>
          </button>

          <div className="space-y-1 text-slate-500 text-xs px-2">
            <button
              onClick={() => setCurrentView('preferences')}
              className="w-full flex items-center gap-2 py-1.5 hover:text-slate-800 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
            <button
              onClick={() => setCurrentView('assisted')}
              className="w-full flex items-center gap-2 py-1.5 hover:text-slate-800 transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Help & Gemini AI</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
