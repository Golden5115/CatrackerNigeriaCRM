'use client';

import { useState } from "react";
import { logPsfCall } from "@/app/actions/psf";

interface PsfCallClientProps {
  client: any;
  currentMonth: string;
}

export default function PsfCallClient({ client, currentMonth }: PsfCallClientProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(client.psfCalls[0]?.status || "PENDING");
  const [feedback, setFeedback] = useState(client.psfCalls[0]?.feedback || "");

  const handleSave = async () => {
    setLoading(true);
    try {
      await logPsfCall(client.id, currentMonth, status, feedback);
      setIsOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to save call log.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="px-3 py-1.5 bg-black text-white text-xs font-semibold rounded-lg hover:bg-gray-800 transition"
      >
        Log Call
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <h3 className="text-xl font-bold text-gray-800 mb-1">Follow-up Call</h3>
            <p className="text-sm text-gray-500 mb-6">{client.fullName} - {currentMonth}</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Call Status</label>
                <select 
                  value={status} 
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                >
                  <option value="PENDING">Pending</option>
                  <option value="CALLED">Called (Spoke to Client)</option>
                  <option value="NO_ANSWER">No Answer</option>
                  <option value="UNREACHABLE">Unreachable / Number off</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Feedback / Notes</label>
                <textarea 
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                  placeholder="How is the service working? Any issues?"
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button 
                  onClick={() => setIsOpen(false)}
                  disabled={loading}
                  className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 text-gray-700 font-medium"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  disabled={loading}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-medium flex items-center gap-2"
                >
                  {loading ? 'Saving...' : 'Save Call Log'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
