import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Plus, Minus, Navigation, MapPin, Bus, Train, ArrowDownUp, Accessibility } from 'lucide-react';

export function MapView() {
  const { origin, destination, selectedRoute, currentView, setCurrentView } = useContext(AppContext);

  return (
    <div className="relative w-full h-full min-h-[380px] bg-[#E5EAEF] rounded-2xl overflow-hidden shadow-inner border border-slate-200 flex flex-col justify-between p-4">
      {/* Map Background Canvas Simulation with Chennai Landmarks & Metro Lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#D1D5DB" strokeWidth="0.5" opacity="0.4" />
          </pattern>
          <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1F3A5F" />
            <stop offset="50%" stopColor="#1AC8A0" />
            <stop offset="100%" stopColor="#1F3A5F" />
          </linearGradient>
        </defs>

        {/* Base Grid */}
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Coastal Waters (Bay of Bengal / Marina Beach on Right) */}
        <path d="M 420 0 Q 380 200 480 500 L 600 500 L 600 0 Z" fill="#BAE6FD" opacity="0.5" />

        {/* Main Transport Line (Chennai Central -> Guindy Metro/Bus Line) */}
        <path
          d="M 140 70 C 180 120, 220 220, 160 380"
          fill="none"
          stroke="#1F3A5F"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray="0"
        />

        {/* Parallel Bus Route Corridor */}
        <path
          d="M 140 70 C 210 140, 240 260, 160 380"
          fill="none"
          stroke="#1AC8A0"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="6 4"
        />

        {/* Major Area Labels */}
        <text x="270" y="240" fill="#64748B" fontSize="20" fontWeight="bold" opacity="0.3">
          சென்னையை / Chennai
        </text>
        <text x="310" y="440" fill="#0284C7" fontSize="13" fontWeight="bold" opacity="0.7">
          Marina Beach
        </text>
        <text x="180" y="160" fill="#475569" fontSize="11" fontWeight="bold">
          EGMORE
        </text>
        <text x="110" y="270" fill="#475569" fontSize="11" fontWeight="bold">
          SAIDAPET
        </text>
      </svg>

      {/* Top Map Header Overlay */}
      <div className="z-10 flex items-center justify-between pointer-events-auto">
        <div className="bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-sm border border-slate-200 flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#1AC8A0] animate-ping" />
          <span className="text-xs font-extrabold text-[#1F3A5F]">Live Route: {origin} → {destination}</span>
        </div>

        <button
          onClick={() => setCurrentView('assisted')}
          className="bg-[#1F3A5F] text-[#1AC8A0] text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs hover:bg-[#132A4A] transition-colors flex items-center gap-1.5"
        >
          <Accessibility className="w-4 h-4 text-[#1AC8A0]" />
          <span>Voice Guidance</span>
        </button>
      </div>

      {/* Interactive Map Station Markers Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {/* Origin Marker: Chennai Central (Top) */}
        <div className="absolute top-[50px] left-[120px] pointer-events-auto flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl shadow-md border border-slate-200">
          <div className="w-7 h-7 rounded-full bg-[#1F3A5F] text-white flex items-center justify-center font-bold shadow-xs">
            <Bus className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-extrabold text-slate-900">Chennai Central</div>
            <div className="text-[10px] text-emerald-600 font-bold">Step-free ramp</div>
          </div>
        </div>

        {/* Transfer Station Marker: Egmore Elevator (Middle) */}
        <div className="absolute top-[180px] left-[200px] pointer-events-auto">
          <div className="w-8 h-8 rounded-xl bg-[#064E3B] text-white flex items-center justify-center shadow-md border-2 border-white ring-2 ring-[#1AC8A0]/50" title="Elevator B Available">
            <ArrowDownUp className="w-4 h-4" />
          </div>
        </div>

        {/* Accessible Station Node: Saidapet (Lower-middle) */}
        <div className="absolute top-[290px] left-[220px] pointer-events-auto">
          <div className="w-7 h-7 rounded-xl bg-[#1AC8A0] text-slate-900 flex items-center justify-center shadow-md border-2 border-white" title="Wheelchair Boarding Zone">
            <Accessibility className="w-4 h-4" />
          </div>
        </div>

        {/* Destination Marker: Guindy (Bottom) */}
        <div className="absolute top-[340px] left-[140px] pointer-events-auto flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl shadow-md border border-slate-200">
          <div className="w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center font-bold shadow-xs">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-extrabold text-slate-900">Guindy</div>
            <div className="text-[10px] text-slate-500 font-medium">Verified Elevator</div>
          </div>
        </div>
      </div>

      {/* Map Control Buttons (Bottom Right) */}
      <div className="z-10 ml-auto space-y-2 pointer-events-auto">
        <div className="flex flex-col rounded-xl bg-white shadow-md border border-slate-200 overflow-hidden">
          <button className="p-2.5 hover:bg-slate-100 text-slate-700 transition-colors border-b border-slate-100" title="Zoom in">
            <Plus className="w-4 h-4" />
          </button>
          <button className="p-2.5 hover:bg-slate-100 text-slate-700 transition-colors" title="Zoom out">
            <Minus className="w-4 h-4" />
          </button>
        </div>

        <button className="p-2.5 rounded-xl bg-white shadow-md border border-slate-200 text-slate-700 hover:text-[#1F3A5F] hover:bg-slate-100 transition-colors flex items-center justify-center" title="Center map">
          <Navigation className="w-4 h-4 text-[#1F3A5F]" />
        </button>
      </div>
    </div>
  );
}
