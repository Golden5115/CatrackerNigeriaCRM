'use client'

import { useState } from "react"
import { updateLeadStatus } from "@/app/actions/updateLead"
import { Calendar, CheckCircle, XCircle, AlertTriangle, Wrench } from "lucide-react"
import SubmitButton from "@/components/SubmitButton"

interface LeadActionMenuProps {
  jobId: string;
  currentStatus: string;
  scheduleDate?: Date | null;
}

export default function LeadActionMenu({ jobId, currentStatus, scheduleDate }: LeadActionMenuProps) {
  const [mode, setMode] = useState<'VIEW' | 'LOST' | 'SCHEDULE'>('VIEW')

  // 1. DEFAULT VIEW (The Buttons)
  if (mode === 'VIEW') {
    return (
      <div className="flex flex-col gap-2 items-end">
        
        {/* SCHEDULE BUTTON (Toggle) */}
        <button 
          onClick={() => setMode('SCHEDULE')}
          className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-lg border border-blue-100 hover:bg-blue-100 flex items-center gap-2 w-fit"
        >
          <Calendar size={14} /> 
          {currentStatus === 'SCHEDULED' && scheduleDate 
            ? new Date(scheduleDate).toLocaleDateString() 
            : 'Schedule Date'}
        </button>

        <div className="flex gap-2">
           {/* REJECT BUTTON (Toggle) */}
           <button 
            onClick={() => setMode('LOST')}
            className="text-gray-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition"
            title="Mark as Lost"
          >
            <XCircle size={20} />
          </button>

          {/* INSTALL DONE BUTTON (Action) */}
          <form action={updateLeadStatus}>
            <input type="hidden" name="jobId" value={jobId} />
            <input type="hidden" name="actionType" value="INSTALLED" />
            <SubmitButton 
              className="bg-green-600 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-green-700 flex items-center gap-1.5 shadow-sm"
              loadingText="Done"
            >
              <CheckCircle size={14} />
              Done
            </SubmitButton>
          </form>
        </div>
      </div>
    )
  }

  // 2. LEAD LOST FORM
  if (mode === 'LOST') {
    return (
      <form action={updateLeadStatus} className="flex flex-col gap-2 bg-red-50 p-3 rounded-lg border border-red-100 min-w-[200px]">
        <input type="hidden" name="jobId" value={jobId} />
        <input type="hidden" name="actionType" value="LEAD_LOST" />
        
        <label className="text-xs font-bold text-red-800 flex items-center gap-1">
          <AlertTriangle size={12} /> Reason for loss:
        </label>
        <select name="lostReason" required className="text-xs p-1 rounded border-red-200">
           <option value="Price too high">Price too high</option>
           <option value="Client unresponsive">Client unresponsive</option>
           <option value="Competitor">Went with Competitor</option>
           <option value="Cancelled">Client Cancelled</option>
        </select>
        
        <div className="flex gap-2 items-center mt-1">
          <button type="button" onClick={() => setMode('VIEW')} className="text-xs text-gray-500 underline">Cancel</button>
          <SubmitButton 
            className="bg-red-600 text-white text-xs px-2 py-1 rounded font-bold ml-auto"
            loadingText="..."
          >
            Confirm Lost
          </SubmitButton>
        </div>
      </form>
    )
  }

  // 3. SCHEDULE FORM
  if (mode === 'SCHEDULE') {
    return (
      <form action={updateLeadStatus} className="flex flex-col gap-2 bg-blue-50 p-3 rounded-lg border border-blue-100 min-w-[200px]">
        <input type="hidden" name="jobId" value={jobId} />
        <input type="hidden" name="actionType" value="SCHEDULED" />
        
        <label className="text-xs font-bold text-blue-800">Set Install Date:</label>
        <input type="date" name="scheduleDate" required className="text-xs p-1 rounded border-blue-200" />
        
        <div className="flex gap-2 items-center mt-1">
          <button type="button" onClick={() => setMode('VIEW')} className="text-xs text-gray-500 underline">Cancel</button>
          <SubmitButton 
            className="bg-blue-600 text-white text-xs px-2 py-1 rounded font-bold ml-auto"
            loadingText="..."
          >
            Save Date
          </SubmitButton>
        </div>
      </form>
    )
  }
}