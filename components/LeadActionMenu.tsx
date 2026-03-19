'use client'

import { useState } from "react"
import { claimJob, submitInstallation, unclaimJob, markJobAsLost } from "@/app/actions/installer"
import { processHardwareSwap, resolveMaintenanceJob } from "@/app/actions/support"
import { MoreVertical, CheckCircle, Lock, Wrench, X, Loader2, RotateCcw, AlertTriangle, XCircle } from "lucide-react"
import SubmitButton from "@/components/SubmitButton"
import InventorySearch from "./InventorySearch"


interface LeadActionMenuProps {
  jobId: string
  currentStatus: string
  jobType: string        // 👈 Added to detect support vs install
  vehicleId: string      // 👈 Added to find old hardware during swap
  installerId?: string | null
  currentUserId: string 
  vehicleName?: string
  installerName?: string | null
  currentUserRole?: string 
}

export default function LeadActionMenu({ 
  jobId, currentStatus, jobType, vehicleId, installerId, currentUserId, vehicleName, installerName, currentUserRole 
}: LeadActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showInstallModal, setShowInstallModal] = useState(false)
  const [showSupportModal, setShowSupportModal] = useState(false)
  const [showLostModal, setShowLostModal] = useState(false)
  const [resolutionType, setResolutionType] = useState<'WIRING' | 'DEVICE' | 'SIM'>('WIRING')
  const [isClaiming, setIsClaiming] = useState(false)
  const [isUnclaiming, setIsUnclaiming] = useState(false)

  // 1. HANDLE CLAIMING
  const handleClaim = async () => {
    setIsClaiming(true)
    try {
      const res = await claimJob(jobId)
      if (res?.error) alert("Error: " + res.error)
    } catch (err) {
      alert("A critical system error occurred.")
    }
    setIsClaiming(false)
    setIsOpen(false)
  }

  // 2. HANDLE UNCLAIMING
  const handleUnclaim = async () => {
    if (!confirm("Are you sure you want to return this job to the pool?")) return;
    
    setIsUnclaiming(true)
    try {
      const res = await unclaimJob(jobId)
      if (res?.error) alert("Error: " + res.error)
    } catch (err) {
      alert("A critical system error occurred.")
    }
    setIsUnclaiming(false)
    setIsOpen(false)
  }

  // 3. LOCK LOGIC
  const isAdmin = currentUserRole === 'ADMIN'
  const isMyJob = installerId === currentUserId
  const isLocked = currentStatus === 'IN_PROGRESS' && !isMyJob && !isAdmin

  if (currentStatus === 'LEAD_LOST') {
    return null; // Don't show the 3 dots at all if it's already dead
  }

  if (isLocked) {
    return (
      <div className="flex flex-col items-end text-gray-400 text-xs italic">
        <div className="flex items-center gap-1">
           <Lock size={12} />
           <span>Taken</span>
        </div>
        {installerName && <span className="text-[10px]">by {installerName}</span>}
      </div>
    )
  }

  return (
    <div className={`relative ${isOpen ? 'z-50' : 'z-10'}`}>
      
      {/* TRIGGER BUTTON */}
      <button onClick={() => setIsOpen(!isOpen)} className="p-2 hover:bg-gray-100 rounded-full transition">
        <MoreVertical size={16} className="text-gray-500" />
      </button>

      {/* DROPDOWN MENU */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
          
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border z-20 overflow-hidden">
            
           {(currentStatus === 'NEW_LEAD' || currentStatus === 'SCHEDULED') && (
               <>
                 <button onClick={handleClaim} disabled={isClaiming} className="w-full text-left px-4 py-3 text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2 font-bold border-b border-gray-50">
                   {isClaiming ? <Loader2 className="animate-spin" size={16}/> : <CheckCircle size={16} />}
                   Claim & Start Job
                 </button>
                 
                 {/* 👇 NEW BUTTON: Mark as Lost */}
                 <button onClick={() => { setShowLostModal(true); setIsOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-gray-500 hover:bg-gray-50 flex items-center gap-2 font-bold">
                   <XCircle size={16} /> Mark as Lost
                 </button>
               </>
            )}

            {currentStatus === 'IN_PROGRESS' && isMyJob && (
               <>
                 {/* SMART SWITCH: Show Install or Support Button */}
                 {jobType === 'NEW_INSTALL' ? (
                   <button onClick={() => { setShowInstallModal(true); setIsOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-green-600 hover:bg-green-50 flex items-center gap-2 font-bold border-b border-gray-50">
                     <Wrench size={16} /> Finish Installation
                   </button>
                 ) : (
                   <button onClick={() => { setShowSupportModal(true); setIsOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-orange-600 hover:bg-orange-50 flex items-center gap-2 font-bold border-b border-gray-50">
                     <AlertTriangle size={16} /> Resolve Support Ticket
                   </button>
                 )}

                 <button onClick={handleUnclaim} disabled={isUnclaiming} className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-bold">
                   {isUnclaiming ? <Loader2 className="animate-spin" size={16}/> : <RotateCcw size={16} />}
                   Return Job to Pool
                 </button>
               </>
            )}

            {currentStatus === 'IN_PROGRESS' && isAdmin && !isMyJob && (
               <button onClick={handleUnclaim} disabled={isUnclaiming} className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-bold bg-red-50/50">
                 {isUnclaiming ? <Loader2 className="animate-spin" size={16}/> : <RotateCcw size={16} />}
                 Admin: Return to Pool
               </button>
            )}

          </div>
        </>
      )}

      {/* --- 1. NEW INSTALLATION MODAL --- */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-xl font-bold text-gray-800">Complete Installation</h3>
               <button onClick={() => setShowInstallModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
            </div>

            <form action={async (formData) => {
                await submitInstallation(formData);
                setShowInstallModal(false);
            }} className="space-y-4">
               <input type="hidden" name="jobId" value={jobId} />
               <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Vehicle Name</label>
                 <input name="vehicleName" defaultValue={vehicleName} required className="w-full p-3 border rounded-xl bg-gray-50" />
               </div>
               <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Plate / Chassis Number</label>
                 <input name="plateNumber" placeholder="ABC-123-XY" required className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" />
               </div>
               <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                 <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Select Tracker Hardware</label>
                 <InventorySearch type="DEVICE" name="deviceId" />
               </div>
               <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                 <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Select Tracker Sim</label>
                 <InventorySearch type="SIM" name="simCardId" />
               </div>
               <div className="pt-2">
                 <SubmitButton className="w-full bg-[#84c47c] text-white py-3 rounded-xl font-bold hover:bg-[#6aa663] transition">
                   Submit & Mark Done
                 </SubmitButton>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* --- 2. SUPPORT & SWAP MODAL --- */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border-t-4 border-orange-500">
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                 <AlertTriangle className="text-orange-500" /> Diagnose & Resolve
               </h3>
               <button onClick={() => setShowSupportModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
            </div>

            <form action={async (formData) => {
                if (resolutionType === 'WIRING') {
                  await resolveMaintenanceJob(jobId);
                } else {
                  // If they swapped hardware, add the extra data and trigger the smart swap
                  formData.append('swapType', resolutionType);
                  formData.append('vehicleId', vehicleId);
                  formData.append('jobId', jobId);
                  await processHardwareSwap(formData);
                }
                setShowSupportModal(false);
            }} className="space-y-4">
               
               <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-2">What action did you take?</label>
                 <select 
                   value={resolutionType} 
                   onChange={(e) => setResolutionType(e.target.value as any)}
                   className="w-full p-3 border rounded-xl bg-gray-50 outline-none font-bold text-gray-700"
                 >
                   <option value="WIRING">✅ Fixed Wiring / Power Issue (No Hardware Swapped)</option>
                   <option value="DEVICE">🔴 Replaced Faulty Tracker Device</option>
                   <option value="SIM">🟣 Replaced Barred SIM Card</option>
                 </select>
               </div>

               {/* Show Inventory Search ONLY if they decided to swap something */}
               {resolutionType === 'DEVICE' && (
                 <div className="bg-red-50 p-4 rounded-xl border border-red-100 animate-in fade-in slide-in-from-top-2">
                   <label className="block text-xs font-bold text-red-800 uppercase mb-2">Scan New Tracker</label>
                   <p className="text-[10px] text-red-600 mb-2 font-medium">The old tracker will automatically be marked as FAULTY in inventory.</p>
                   <InventorySearch type="DEVICE" name="newHardwareId" />
                 </div>
               )}

               {resolutionType === 'SIM' && (
                 <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 animate-in fade-in slide-in-from-top-2">
                   <label className="block text-xs font-bold text-purple-800 uppercase mb-2">Scan New SIM Card</label>
                   <p className="text-[10px] text-purple-600 mb-2 font-medium">The old SIM will automatically be marked as FAULTY in inventory.</p>
                   <InventorySearch type="SIM" name="newHardwareId" />
                 </div>
               )}

               <div className="pt-4">
                 <SubmitButton className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold hover:bg-orange-600 transition shadow-lg shadow-orange-500/20">
                   Resolve Ticket
                 </SubmitButton>
               </div>

            </form>
          </div>
        </div>
      )}

      {/* --- 3. MARK AS LOST MODAL --- */}
      {showLostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                 <XCircle className="text-gray-500" /> Mark Lead as Lost
               </h3>
               <button onClick={() => setShowLostModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
            </div>

            <form action={async (formData) => {
                await markJobAsLost(formData);
                setShowLostModal(false);
            }} className="space-y-4">
               <input type="hidden" name="jobId" value={jobId} />
               
               <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Reason for losing lead</label>
                 <select name="lostReason" required className="w-full p-3 border rounded-xl bg-gray-50 outline-none font-medium text-gray-700">
                   <option value="">Select a reason...</option>
                   <option value="Too Expensive">Too Expensive</option>
                   <option value="Went with Competitor">Went with Competitor</option>
                   <option value="Client Stopped Responding">Client Stopped Responding (Ghosted)</option>
                   <option value="Not Interested Anymore">Not Interested Anymore</option>
                   <option value="Other">Other</option>
                 </select>
               </div>

               <div className="pt-4">
                 <SubmitButton className="w-full bg-gray-800 text-white py-3 rounded-xl font-bold hover:bg-gray-900 transition">
                   Confirm Lost Lead
                 </SubmitButton>
               </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}