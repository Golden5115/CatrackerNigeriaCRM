'use client'

import { useState } from "react"
import { claimJob, submitInstallation, unclaimJob } from "@/app/actions/installer"
import { MoreVertical, CheckCircle, Lock, Wrench, X, Loader2, RotateCcw } from "lucide-react"
import SubmitButton from "@/components/SubmitButton"
import InventorySearch from "./InventorySearch"

interface LeadActionMenuProps {
  jobId: string
  currentStatus: string
  installerId?: string | null
  currentUserId: string 
  vehicleName?: string
  installerName?: string | null
  currentUserRole?: string 
}

export default function LeadActionMenu({ 
  jobId, currentStatus, installerId, currentUserId, vehicleName, installerName, currentUserRole 
}: LeadActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showInstallModal, setShowInstallModal] = useState(false)
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

  // 4. RENDER LOCKED STATE
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
            
            {/* OPTION A: CLAIM JOB */}
            {(currentStatus === 'NEW_LEAD' || currentStatus === 'SCHEDULED') && (
               <button 
                 onClick={handleClaim}
                 disabled={isClaiming}
                 className="w-full text-left px-4 py-3 text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2 font-bold"
               >
                 {isClaiming ? <Loader2 className="animate-spin" size={16}/> : <CheckCircle size={16} />}
                 Claim & Start Job
               </button>
            )}

            {/* OPTION B: FINISH JOB & UNCLAIM */}
            {currentStatus === 'IN_PROGRESS' && isMyJob && (
               <>
                 <button 
                   onClick={() => { setShowInstallModal(true); setIsOpen(false); }}
                   className="w-full text-left px-4 py-3 text-sm text-green-600 hover:bg-green-50 flex items-center gap-2 font-bold border-b border-gray-50"
                 >
                   <Wrench size={16} />
                   Finish Installation
                 </button>

                 <button 
                   onClick={handleUnclaim}
                   disabled={isUnclaiming}
                   className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-bold"
                 >
                   {isUnclaiming ? <Loader2 className="animate-spin" size={16}/> : <RotateCcw size={16} />}
                   Return Job to Pool
                 </button>
               </>
            )}

            {/* OPTION C: ADMIN OVERRIDE */}
            {currentStatus === 'IN_PROGRESS' && isAdmin && !isMyJob && (
               <button 
                 onClick={handleUnclaim}
                 disabled={isUnclaiming}
                 className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-bold bg-red-50/50"
               >
                 {isUnclaiming ? <Loader2 className="animate-spin" size={16}/> : <RotateCcw size={16} />}
                 Admin: Return to Pool
               </button>
            )}

          </div>
        </>
      )}

      {/* --- INSTALLATION MODAL --- */}
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

    </div>
  )
}