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
      <nav aria-label="Mobile Navigation" className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FFFFFF]/98 backdrop-blur-md border-t border-[#DCE3EB] px-4 py-1.5 shadow-sm">
        <div className="max-w-md mx-auto flex items-center justify-around">
          {/* Map Tab */}
          <button
            onClick={() => setCurrentView('route-options')}
            className={`flex flex-col items-center justify-center py-1 px-5 rounded-xl transition-all duration-150 cursor-pointer ${
              isMapTab
                ? 'bg-[#263B68] text-[#FFFFFF] font-bold shadow-xs'
                : 'text-[#5B6E88] hover:text-[#263B68]'
            }`}
          >
            <Map className={`w-4 h-4 mb-0.5 ${isMapTab ? 'text-[#60C4D4]' : ''}`} />
            <span className="text-[11px] tracking-tight">Map</span>
          </button>

          {/* Journeys Tab */}
          <button
            onClick={() => setCurrentView('journey-steps')}
            className={`flex flex-col items-center justify-center py-1 px-5 rounded-xl transition-all duration-150 cursor-pointer ${
              isJourneysTab
                ? 'bg-[#263B68] text-[#FFFFFF] font-bold shadow-xs'
                : 'text-[#5B6E88] hover:text-[#263B68]'
            }`}
          >
            <Navigation2 className={`w-4 h-4 mb-0.5 ${isJourneysTab ? 'text-[#60C4D4]' : ''}`} />
            <span className="text-[11px] tracking-tight">Journeys</span>
          </button>

          {/* Profile Tab */}
          <button
            onClick={() => setCurrentView('profile')}
            className={`flex flex-col items-center justify-center py-1 px-5 rounded-xl transition-all duration-150 cursor-pointer ${
              isProfileTab
                ? 'bg-[#263B68] text-[#FFFFFF] font-bold shadow-xs'
                : 'text-[#5B6E88] hover:text-[#263B68]'
            }`}
          >
            <User className={`w-4 h-4 mb-0.5 ${isProfileTab ? 'text-[#60C4D4]' : ''}`} />
            <span className="text-[11px] tracking-tight">Profile</span>
          </button>
        </div>
      </nav>

      {/* DESKTOP SIDEBAR NAVIGATION (Visible >= 768px) */}
      <aside aria-label="Desktop Navigation" className="hidden md:flex flex-col w-56 bg-[#FFFFFF] border-r border-[#DCE3EB] h-screen sticky top-0 shrink-0 p-4 justify-between">
        <div className="space-y-6">
          {/* Brand Header */}
          <div className="flex items-center gap-2.5 px-2 py-1">
            <div className="w-8 h-8 rounded-lg bg-[#263B68] text-[#FFFFFF] flex items-center justify-center font-bold text-sm shadow-xs">
              <Accessibility className="w-4 h-4 text-[#60C4D4]" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-[#263B68] leading-tight">AccessRoute</h2>
              <p className="text-[10px] text-[#5B6E88] font-semibold">Chennai Transit</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav aria-label="Desktop Sidebar Navigation" className="space-y-1">
            <button
              onClick={() => setCurrentView('route-options')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isMapTab
                  ? 'bg-[#263B68] text-[#FFFFFF] shadow-xs'
                  : 'text-[#5B6E88] hover:bg-[#F5F3ED] hover:text-[#263B68]'
              }`}
            >
              <Map className={`w-4 h-4 ${isMapTab ? 'text-[#60C4D4]' : 'text-[#8CA0BA]'}`} />
              <span>Map & Planner</span>
            </button>

            <button
              onClick={() => setCurrentView('journey-steps')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isJourneysTab
                  ? 'bg-[#263B68] text-[#FFFFFF] shadow-xs'
                  : 'text-[#5B6E88] hover:bg-[#F5F3ED] hover:text-[#263B68]'
              }`}
            >
              <Navigation2 className={`w-4 h-4 ${isJourneysTab ? 'text-[#60C4D4]' : 'text-[#8CA0BA]'}`} />
              <span>Journeys & Steps</span>
            </button>

            <button
              onClick={() => setCurrentView('profile')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isProfileTab
                  ? 'bg-[#263B68] text-[#FFFFFF] shadow-xs'
                  : 'text-[#5B6E88] hover:bg-[#F5F3ED] hover:text-[#263B68]'
              }`}
            >
              <User className={`w-4 h-4 ${isProfileTab ? 'text-[#60C4D4]' : 'text-[#8CA0BA]'}`} />
              <span>Impact & Profile</span>
            </button>
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="space-y-2 pt-3 border-t border-[#DCE3EB]">
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-[#DCE3EB] bg-[#FFFFFF] text-[#263B68] font-bold text-xs hover:bg-[#F5F3ED] transition-colors shadow-2xs cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-[#D97706]" />
            <span>Report Issue</span>
          </button>

          <div className="space-y-0.5 text-[#5B6E88] text-xs px-1">
            <button
              onClick={() => setCurrentView('preferences')}
              className="w-full flex items-center gap-2 py-1.5 hover:text-[#263B68] transition-colors cursor-pointer text-left text-[11px]"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Travel Settings</span>
            </button>
            <button
              onClick={() => setCurrentView('assisted')}
              className="w-full flex items-center gap-2 py-1.5 hover:text-[#263B68] transition-colors cursor-pointer text-left text-[11px]"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Help & AI Guidance</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

