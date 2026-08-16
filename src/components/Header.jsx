import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Search, Settings, ArrowLeft, SlidersHorizontal, Sparkles } from 'lucide-react';

export function Header() {
  const { currentView, setCurrentView } = useContext(AppContext);

  const isDetailView = ['assisted', 'route-details', 'journey-steps', 'preferences'].includes(currentView);

  const handleBack = () => {
    if (currentView === 'assisted' || currentView === 'journey-steps' || currentView === 'route-details') {
      setCurrentView('route-options');
    } else {
      setCurrentView('route-options');
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-3">
        {isDetailView ? (
          <button
            onClick={handleBack}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors text-slate-700"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={() => setCurrentView('preferences')}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors text-slate-700"
            aria-label="Search destination"
          >
            <Search className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-2">
          <h1
            onClick={() => setCurrentView('route-options')}
            className="text-xl font-bold text-[#1F3A5F] tracking-tight cursor-pointer select-none"
          >
            AccessRoute
          </h1>
          <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold uppercase bg-[#1AC8A0]/15 text-[#14A080] rounded-full">
            Chennai
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setCurrentView('assisted')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
            currentView === 'assisted'
              ? 'bg-[#1AC8A0] text-white shadow-xs'
              : 'bg-[#1AC8A0]/10 text-[#14A080] hover:bg-[#1AC8A0]/20'
          }`}
          title="Assisted Travel with Gemini AI"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">Gemini AI</span>
        </button>

        <button
          onClick={() => setCurrentView('preferences')}
          className="p-2 text-slate-700 hover:text-[#1F3A5F] hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Settings"
        >
          <SlidersHorizontal className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
