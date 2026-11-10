import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { ArrowLeft, Sparkles, SlidersHorizontal, MapPin } from 'lucide-react';

export function Header() {
  const { currentView, setCurrentView } = useContext(AppContext);

  const isDetailView = ['assisted', 'route-details', 'journey-steps', 'preferences'].includes(currentView);

  const handleBack = () => {
    setCurrentView('route-options');
  };

  return (
    <header className="sticky top-0 z-30 bg-[#FFFFFF] border-b border-[#DCE3EB] px-4 py-2.5 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-3">
        {isDetailView && (
          <button
            onClick={handleBack}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-[#263B68] cursor-pointer"
            aria-label="Go back to routes"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-2.5">
          <div
            onClick={() => setCurrentView('route-options')}
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            <div className="w-8 h-8 rounded-lg bg-[#263B68] text-[#FFFFFF] flex items-center justify-center font-bold shadow-xs">
              <span className="text-sm font-black tracking-tighter">AR</span>
            </div>
            <div>
              <h1 className="text-base font-extrabold text-[#263B68] tracking-tight leading-none">
                AccessRoute
              </h1>
              <p className="text-[10px] font-semibold text-[#5B6E88] leading-tight mt-0.5">
                Chennai Public Transport
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase bg-[#EEF3FA] text-[#263B68] rounded-md border border-[#DCE3EB]">
            <MapPin className="w-2.5 h-2.5 text-[#60C4D4]" />
            Greater Chennai
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setCurrentView('assisted')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            currentView === 'assisted'
              ? 'bg-[#263B68] text-[#FFFFFF] shadow-xs'
              : 'bg-[#EEF3FA] text-[#263B68] hover:bg-[#DCE3EB] border border-[#DCE3EB]'
          }`}
          title="Assisted Travel with Gemini AI"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#60C4D4]" />
          <span>Assisted Travel</span>
        </button>

        <button
          onClick={() => setCurrentView('preferences')}
          className="p-2 text-[#5B6E88] hover:text-[#263B68] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          aria-label="Settings and Preferences"
          title="Settings and Preferences"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}

