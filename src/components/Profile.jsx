import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Bus, Banknote, Leaf, Accessibility, AlertTriangle, UserCheck } from 'lucide-react';

export function Profile() {
  const { userStats } = useContext(AppContext);
  const { user, stats } = userStats;

  return (
    <div className="bg-[#FFFFFF] rounded-2xl p-4 md:p-6 shadow-xs border border-[#DCE3EB] max-w-xl mx-auto space-y-6 pb-20 md:pb-6">
      {/* Profile Header Avatar */}
      <div className="flex flex-col items-center text-center space-y-2 pt-2">
        <div className="relative">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-md"
          />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#263B68] text-[#60C4D4] flex items-center justify-center border-2 border-white shadow-2xs">
            <UserCheck className="w-3.5 h-3.5" />
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-extrabold text-[#263B68] tracking-tight">{user.name}</h2>
          <p className="text-sm font-semibold text-[#5B6E88]">{user.subtitle}</p>
        </div>
      </div>

      {/* Primary Hero Stat Card: 14 Public transport journeys */}
      <div className="p-5 rounded-xl border border-[#DCE3EB] bg-[#F5F3ED] shadow-2xs flex items-center justify-between">
        <div>
          <div className="text-4xl font-extrabold text-[#263B68] tracking-tight">
            {stats.publicTransportJourneys}
          </div>
          <div className="text-sm font-semibold text-[#5B6E88] mt-1">
            Public transport journeys
          </div>
        </div>

        <div className="w-14 h-14 rounded-xl bg-[#263B68] text-white flex items-center justify-center shrink-0">
          <Bus className="w-7 h-7 text-[#60C4D4]" />
        </div>
      </div>

      {/* Grid 2x2 Impact Stats */}
      <div className="grid grid-cols-2 gap-3.5">
        {/* Stat 1: Estimated Savings */}
        <div className="p-4 rounded-xl border border-[#DCE3EB] bg-[#FFFFFF] shadow-2xs space-y-3">
          <div className="w-10 h-10 rounded-lg bg-[#EEF7F9] text-[#263B68] flex items-center justify-center">
            <Banknote className="w-5 h-5 text-[#263B68]" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-[#263B68]">
              ₹{stats.estimatedSavings.toLocaleString()}
            </div>
            <div className="text-xs font-semibold text-[#5B6E88] mt-0.5">
              Estimated savings
            </div>
          </div>
        </div>

        {/* Stat 2: CO2 Avoided */}
        <div className="p-4 rounded-xl border border-[#DCE3EB] bg-[#FFFFFF] shadow-2xs space-y-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Leaf className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-[#263B68] flex items-baseline gap-0.5">
              <span>{stats.co2AvoidedKg}</span>
              <span className="text-xs font-bold text-[#5B6E88]">kg</span>
            </div>
            <div className="text-xs font-semibold text-[#5B6E88] mt-0.5">
              CO2 avoided
            </div>
          </div>
        </div>

        {/* Stat 3: Accessible Journeys */}
        <div className="p-4 rounded-xl border border-[#DCE3EB] bg-[#FFFFFF] shadow-2xs space-y-3">
          <div className="w-10 h-10 rounded-lg bg-[#EEF3FA] text-[#263B68] flex items-center justify-center">
            <Accessibility className="w-5 h-5 text-[#263B68]" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-[#263B68]">
              {stats.accessibleJourneys}
            </div>
            <div className="text-xs font-semibold text-[#5B6E88] mt-0.5">
              Accessible journeys
            </div>
          </div>
        </div>

        {/* Stat 4: Issues Reported */}
        <div className="p-4 rounded-xl border border-[#DCE3EB] bg-[#FFFFFF] shadow-2xs space-y-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-[#263B68]">
              {stats.issuesReported}
            </div>
            <div className="text-xs font-semibold text-[#5B6E88] mt-0.5">
              Issues reported
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
