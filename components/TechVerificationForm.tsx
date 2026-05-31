'use client'

import { useState } from "react"
import { Hash, CheckCircle, Wrench, AlertCircle, ShieldCheck } from "lucide-react"
import SmartHardwareInput from "@/components/SmartHardwareInput"
import { verifyAndSaveJob } from "@/app/actions/tech"

// 🟢 CRITICAL: Make sure "export default" is right here!
export default function TechVerificationForm({ job }: { job: any }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const isMaintenance = job.jobType === 'MAINTENANCE'

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const res = await verifyAndSaveJob(formData)

    if (res?.error) {
      setError(res.error)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
       <div className="bg-green-50 text-green-800 p-4 rounded-xl text-sm flex items-start gap-3 border border-green-100">
          <ShieldCheck size={24} className="shrink-0 mt-0.5 text-green-600" />
          <p>Please confirm the vehicle is actively reporting online on the tracking server before approving this ticket.</p>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <input type="hidden" name="jobId" value={job.id} />
         
         <div>
           <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1">
             <Hash size={14}/> Plate / Chassis
           </label>
           <input 
             name="plateNumber" 
             defaultValue={job.vehicle?.plateNumber || ""} 
             required 
             className="w-full p-4 border border-gray-200 rounded-xl font-mono text-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500 outline-none transition shadow-sm" 
           />
         </div>

         {!isMaintenance && (
           <>
             <div>
               <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tracker IMEI *</label>
               <SmartHardwareInput type="DEVICE" name="imei" defaultValue={job.device?.imei} />
             </div>
             
             <div>
               <label className="block text-xs font-bold text-gray-500 uppercase mb-2">SIM Number *</label>
               <SmartHardwareInput type="SIM" name="simNumber" defaultValue={job.simCard?.simNumber} />
             </div>
           </>
         )}
       </div>

       {error && (
         <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold flex items-center gap-2 border border-red-100 shadow-sm mt-4">
           <AlertCircle size={18} /> {error}
         </div>
       )}

       <div className="pt-4 mt-6 border-b pb-8">
         {isMaintenance ? (
           <button type="submit" disabled={loading} className="w-full bg-[#84c47c] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#6aa663] shadow-lg flex justify-center items-center gap-2 transition disabled:opacity-50">
             <Wrench size={24} /> {loading ? "Verifying..." : "Verify Online & Close Maintenance Ticket"}
           </button>
         ) : (
           <button type="submit" disabled={loading} className="w-full bg-[#84c47c] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#6aa663] shadow-lg flex justify-center items-center gap-2 transition disabled:opacity-50">
             <CheckCircle size={24} /> {loading ? "Verifying Stock..." : "Approve & Send to Onboarding"}
           </button>
         )}
       </div>
    </form>
  )
}