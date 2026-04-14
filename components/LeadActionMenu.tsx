'use client'

import { useState, useRef } from "react" // 👈 NEW: Imported useRef
import { claimJob, submitInstallation, unclaimJob, markJobAsLost } from "@/app/actions/installer"
import { processHardwareSwap, resolveMaintenanceJob } from "@/app/actions/support"
import { scheduleInstallation, logPendingReason } from "@/app/actions/updateLead"
import { MoreVertical, CheckCircle, Lock, Wrench, X, Loader2, RotateCcw, AlertTriangle, XCircle, UserPlus, Calendar, AlertCircle } from "lucide-react"
import SubmitButton from "@/components/SubmitButton"
import InventorySearch from "./InventorySearch"

interface LeadActionMenuProps {
  jobId: string
  currentStatus: string
  jobType: string        
  vehicleId: string      
  installerId?: string | null
  currentUserId: string 
  vehicleName?: string
  installerName?: string | null
  currentUserRole?: string 
  clientEmail?: string | null // 👈 Add this line
}

export default function LeadActionMenu({ 
  jobId, currentStatus, jobType, vehicleId, installerId, currentUserId, vehicleName, installerName, currentUserRole, clientEmail // 👈 Added here!
}: LeadActionMenuProps) {
  
  const [isOpen, setIsOpen] = useState(false)
  const [dropDirection, setDropDirection] = useState<'down' | 'up'>('down') // 👈 NEW: Tracks which way the menu should open
  const buttonRef = useRef<HTMLButtonElement>(null) // 👈 NEW: Used to calculate screen space
  
  // Existing Modals
  const [showInstallModal, setShowInstallModal] = useState(false)
  const [showSupportModal, setShowSupportModal] = useState(false)
  const [showLostModal, setShowLostModal] = useState(false)
  const [showClaimModal, setShowClaimModal] = useState(false) 
  
  // New Modals (Schedule & Pending)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [scheduleDate, setScheduleDate] = useState("")
  const [showPendingModal, setShowPendingModal] = useState(false)
  const [pendingReason, setPendingReason] = useState("")

  const [manualInstallerName, setManualInstallerName] = useState("") 
  const [resolutionType, setResolutionType] = useState<'WIRING' | 'DEVICE' | 'SIM'>('WIRING')
  
  const [isClaiming, setIsClaiming] = useState(false)
  const [isUnclaiming, setIsUnclaiming] = useState(false)

  // 🛑 NEW: Smart Dropdown Positioning Logic
  const toggleDropdown = () => {
    if (!isOpen && buttonRef.current) {
      // Calculate where the button is on the screen
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      
      // If there is less than 320px of space below the button, open upwards!
      if (spaceBelow < 320) {
        setDropDirection('up');
      } else {
        setDropDirection('down');
      }
    }
    setIsOpen(!isOpen);
  }

  // 1. HANDLE CLAIMING / DISPATCHING
  const handleClaim = async () => {
    setIsClaiming(true)
    try {
      const res = await claimJob(jobId, manualInstallerName) 
      if (res?.error) alert("Error: " + res.error)
    } catch (err) {
      alert("A critical system error occurred.")
    }
    setIsClaiming(false)
    setShowClaimModal(false)
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

  // 3. SMART LOCK LOGIC
  const isAdminOrOps = currentUserRole === 'ADMIN' || currentUserRole === 'OPERATIONS'
  const isMyJob = installerId === currentUserId
  const canManageJob = isMyJob || isAdminOrOps 

  const isLocked = currentStatus === 'IN_PROGRESS' && !canManageJob

  if (currentStatus === 'LEAD_LOST') return null;

  if (isLocked) {
    return (
      <div className="flex flex-col items-end text-gray-400 text-xs italic">
        <div className="flex items-center gap-1">
           <Lock size={12} /> <span>Taken</span>
        </div>
        {installerName && <span className="text-[10px]">by {installerName}</span>}
      </div>
    )
  }

  return (
    <div className={`relative ${isOpen ? 'z-50' : 'z-10'}`}>
      
      {/* 👈 FIX: Added ref and custom toggle function to the trigger button */}
      <button ref={buttonRef} onClick={toggleDropdown} className="p-2 hover:bg-gray-100 rounded-full transition">
        <MoreVertical size={16} className="text-gray-500" />
      </button>

      {/* DROPDOWN MENU */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
          
          {/* 👈 FIX: The menu now dynamically switches between 'top-full mt-2' and 'bottom-full mb-2' */}
          <div className={`absolute right-0 w-56 bg-white rounded-lg shadow-2xl border border-gray-100 z-20 overflow-hidden ${
            dropDirection === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}>
            
           {/* UNCLAIMED JOBS */}
           {(currentStatus === 'NEW_LEAD' || currentStatus === 'SCHEDULED') && (
               <>
                 <button onClick={() => { setShowClaimModal(true); setIsOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2 font-bold border-b border-gray-50">
                   <UserPlus size={16} /> Claim & Dispatch
                 </button>

                 {currentStatus === 'NEW_LEAD' && (
                   <button onClick={() => { setShowScheduleModal(true); setIsOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-purple-600 hover:bg-purple-50 flex items-center gap-2 font-bold border-b border-gray-50">
                     <Calendar size={16} /> Schedule Installation
                   </button>
                 )}

                 <button onClick={() => { setShowPendingModal(true); setIsOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-amber-600 hover:bg-amber-50 flex items-center gap-2 font-bold border-b border-gray-50">
                   <AlertCircle size={16} /> Log Delay/Pending
                 </button>
                 
                 {isAdminOrOps && (
                   <button onClick={() => { setShowLostModal(true); setIsOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-gray-500 hover:bg-gray-50 flex items-center gap-2 font-bold">
                     <XCircle size={16} /> Mark as Lost
                   </button>
                 )}
               </>
            )}

            {/* IN PROGRESS JOBS */}
            {currentStatus === 'IN_PROGRESS' && canManageJob && (
               <>
                 {jobType === 'NEW_INSTALL' ? (
                   <button onClick={() => { setShowInstallModal(true); setIsOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-green-600 hover:bg-green-50 flex items-center gap-2 font-bold border-b border-gray-50">
                     <Wrench size={16} /> Finish Installation
                   </button>
                 ) : (
                   <button onClick={() => { setShowSupportModal(true); setIsOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-orange-600 hover:bg-orange-50 flex items-center gap-2 font-bold border-b border-gray-50">
                     <AlertTriangle size={16} /> Resolve Support Ticket
                   </button>
                 )}

                 <button onClick={handleUnclaim} disabled={isUnclaiming} className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-bold border-b border-gray-50">
                   {isUnclaiming ? <Loader2 className="animate-spin" size={16}/> : <RotateCcw size={16} />}
                   Return Job to Pool
                 </button>

                 {isAdminOrOps && (
                   <button onClick={() => { setShowLostModal(true); setIsOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-gray-500 hover:bg-gray-50 flex items-center gap-2 font-bold">
                     <XCircle size={16} /> Mark as Lost
                   </button>
                 )}
               </>
            )}
          </div>
        </>
      )}


      {/* ========================================== */}
      {/* ALL MODALS BELOW */}
      {/* ========================================== */}

      {/* --- 1. CLAIM & DISPATCH MODAL --- */}
      {showClaimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                 <UserPlus className="text-blue-500" /> Dispatch Job
               </h3>
               <button onClick={() => setShowClaimModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
            </div>

            <div className="space-y-4">
               <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Assign Field Installer (Optional)</label>
                 <input 
                   type="text"
                   value={manualInstallerName}
                   onChange={(e) => setManualInstallerName(e.target.value)}
                   placeholder="e.g. John Doe (Leave blank if assigning to yourself)" 
                   className="w-full p-3 border rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500"
                 />
                 <p className="text-[10px] text-gray-400 mt-2">Enter the name of the installer who will physically handle this vehicle, or leave it blank to claim it under your own account.</p>
               </div>

               <div className="pt-4">
                 <button 
                   onClick={handleClaim}
                   disabled={isClaiming} 
                   className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50 flex justify-center items-center"
                 >
                   {isClaiming ? <Loader2 size={20} className="animate-spin" /> : "Confirm Dispatch"}
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* --- 2. SCHEDULE DATE MODAL --- */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                 <Calendar className="text-purple-500" /> Schedule Installation
               </h3>
               <button onClick={() => setShowScheduleModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Select the agreed date for this installation.</p>
            <input 
              type="date" 
              value={scheduleDate} 
              onChange={(e) => setScheduleDate(e.target.value)}
              className="w-full p-3 border rounded-xl mb-4 text-sm outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50"
            />
            <div className="pt-2">
              <button 
                onClick={async () => {
                  if(!scheduleDate) return alert("Please select a date.");
                  await scheduleInstallation(jobId, scheduleDate);
                  setShowScheduleModal(false);
                }} 
                className="w-full py-3 font-bold bg-purple-600 text-white hover:bg-purple-700 rounded-xl transition"
              >
                Save Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- 3. PENDING REASON MODAL --- */}
      {showPendingModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                 <AlertCircle className="text-amber-500" /> Log Delay Reason
               </h3>
               <button onClick={() => setShowPendingModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Why is this lead stuck in the pipeline?</p>
            <textarea 
              value={pendingReason} 
              onChange={(e) => setPendingReason(e.target.value)}
              placeholder="e.g. Client traveling, will call back next week."
              className="w-full p-3 border rounded-xl mb-4 text-sm outline-none focus:ring-2 focus:ring-amber-500 bg-gray-50"
              rows={3}
            />
            <div className="pt-2">
              <button 
                onClick={async () => {
                  if(!pendingReason) return alert("Please enter a reason.");
                  await logPendingReason(jobId, pendingReason);
                  setShowPendingModal(false);
                }} 
                className="w-full py-3 font-bold bg-amber-500 text-white hover:bg-amber-600 rounded-xl transition"
              >
                Save Reason
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- 4. NEW INSTALLATION MODAL --- */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-xl font-bold text-gray-800">Complete Installation</h3>
               <button onClick={() => setShowInstallModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
            </div>

           <form action={async (formData) => {
                const res = await submitInstallation(formData);
                if (res?.error) {
                  alert(res.error);
                } else {
                  setShowInstallModal(false);
                }
            }} className="space-y-4">
               <input type="hidden" name="jobId" value={jobId} />
               
               {/* 🟢 NEW: Compulsory Email Input (ONLY shows if client has no email) */}
               {!clientEmail && (
                 <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                     Client Email <span className="text-red-500">*</span>
                   </label>
                   <input 
                     type="email" 
                     name="clientEmail" 
                     required 
                     placeholder="client@example.com"
                     className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm font-medium" 
                   />
                 </div>
               )}

               {/* 🟢 FIXED: Installation Date (Default is now NIL) */}
               <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                   Installation Date <span className="text-red-500">*</span>
                 </label>
                 <input 
                   type="date" 
                   name="installDate" 
                   required 
                   className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm font-medium" 
                 />
               </div>

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

      {/* --- 5. SUPPORT & SWAP MODAL --- */}
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

      {/* --- 6. MARK AS LOST MODAL --- */}
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