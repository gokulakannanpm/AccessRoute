import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { X, AlertTriangle, Camera, CheckCircle2, Send } from 'lucide-react';
import { reportIssue } from '../utils/api';

export function ReportIssue() {
  const { isReportModalOpen, setIsReportModalOpen } = useContext(AppContext);
  const [station, setStation] = useState('Chennai Central');
  const [issueType, setIssueType] = useState('Elevator Out of Service');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isReportModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    await reportIssue({ station, issueType, description });
    setIsSubmitting(false);
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setIsReportModalOpen(false);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#263B68]/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FFFFFF] rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#DCE3EB] space-y-5 relative animate-in fade-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          onClick={() => setIsReportModalOpen(false)}
          className="absolute top-5 right-5 p-2 text-[#8CA0BA] hover:text-[#263B68] rounded-lg hover:bg-[#F5F3ED] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#263B68]">Report Accessibility Issue</h2>
            <p className="text-xs text-[#5B6E88] font-medium">Help keep Chennai transport accessible for everyone</p>
          </div>
        </div>

        {isSubmitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-[#263B68]">Report Submitted!</h3>
            <p className="text-xs text-[#5B6E88]">Thank you for reporting. MTC & CMRL engineers have been notified.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Location Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#5B6E88]">Station or Bus Stop</label>
              <select
                value={station}
                onChange={(e) => setStation(e.target.value)}
                className="w-full p-2.5 bg-[#FFFFFF] border border-[#DCE3EB] rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-[#263B68] focus:ring-2 focus:ring-[#60C4D4]/30"
              >
                <option value="Chennai Central">Chennai Central Metro & Station</option>
                <option value="Guindy">Guindy Metro / Bus Depot</option>
                <option value="Egmore">Egmore Station</option>
                <option value="Saidapet">Saidapet Metro</option>
                <option value="MTC Bus 21 Route">MTC Bus 21 Route</option>
              </select>
            </div>

            {/* Issue Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#5B6E88]">Issue Category</label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                className="w-full p-2.5 bg-[#FFFFFF] border border-[#DCE3EB] rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-[#263B68] focus:ring-2 focus:ring-[#60C4D4]/30"
              >
                <option value="Elevator Out of Service">Elevator Out of Service</option>
                <option value="Ramp Blocked / Damaged">Ramp Blocked / Damaged</option>
                <option value="Tactile Paving Broken">Tactile Paving Broken</option>
                <option value="Audio Navigation Not Working">Audio Navigation Not Working</option>
                <option value="Low-floor Ramp Bus Issue">Low-floor Ramp Bus Issue</option>
              </select>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#5B6E88]">Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the barrier or broken infrastructure..."
                className="w-full p-2.5 bg-[#FFFFFF] border border-[#DCE3EB] rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:border-[#263B68] focus:ring-2 focus:ring-[#60C4D4]/30"
              />
            </div>

            {/* Upload Photo Button Simulation */}
            <div className="p-3 border-2 border-dashed border-[#DCE3EB] rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-[#5B6E88] hover:bg-[#F5F3ED] cursor-pointer transition-colors">
              <Camera className="w-4 h-4 text-[#8CA0BA]" />
              <span>Attach Photo (Optional)</span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-xl bg-[#263B68] hover:bg-[#1B2B4C] text-[#FFFFFF] font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Send className="w-4 h-4 text-[#60C4D4]" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit Report'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
