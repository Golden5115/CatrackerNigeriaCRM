'use client'

import { useState } from "react"
import { Cpu, Smartphone, User, AlertCircle } from "lucide-react"
import SmartHardwareInput from "@/components/SmartHardwareInput"
import { activateJob } from "@/app/actions/activateJob"

export default function TechActivationForm({ job }: { job: any }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const res = await activateJob(formData)

    if (res?.error) {
      setError(res.error)
    }
    // If successful, the server action calls revalidatePath, which will refresh the UI automatically.
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <input type="hidden" name="jobId" value={job.id} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
           <label className="flex items-center gap-2 text-xs font-bold text-blue-800 uppercase mb-3">
             <Cpu size={16}/> Assign Tracker (IMEI) *
           </label>
           <SmartHardwareInput type="DEVICE" name="imei" defaultValue={job.device?.imei} />
         </div>
         
         <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100">
           <label className="flex items-center gap-2 text-xs font-bold text-purple-800 uppercase mb-3">
             <Smartphone size={16}/> Assign SIM Card *
           </label>
           <SmartHardwareInput type="SIM" name="simNumber" defaultValue={job.simCard?.simNumber} />
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
         <div>
           <label className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase mb-2">
             <User size={14}/> Installer Name *
           </label>
           <input 
             type="text" 
             name="installerName" 
             defaultValue={job.installerName || ""} 
             required 
             className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium transition" 
             placeholder="Who is installing this?" 
           />
         </div>
         <div>
           <label className="block text-xs font-bold text-gray-600 uppercase mb-2">
             Installation Photo URL (Optional)
           </label>
           <input 
             type="url" 
             name="installPhoto" 
             defaultValue={job.installPhoto || ""} 
             className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium transition" 
             placeholder="https://..." 
           />
         </div>
      </div>

      {/* 🟢 NEW: Displays strict inventory errors to the technician */}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold flex items-center gap-2 border border-red-100 shadow-sm">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      <div className="pt-4">
        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition shadow-md disabled:opacity-50">
           {loading ? "Activating & Verifying Stock..." : "Confirm Configuration & Activate Job"}
        </button>
      </div>
    </form>
  )
}