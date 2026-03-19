'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, Wrench, ArrowLeft } from "lucide-react"
import Link from "next/link"
import SubmitButton from "@/components/SubmitButton"
import { createSupportTicket } from "@/app/actions/support"

export default function LogSupportTicket() {
  const router = useRouter()
  const [error, setError] = useState("")

  async function handleSubmit(formData: FormData) {
    setError("")
    const res = await createSupportTicket(formData)
    
    if (res?.error) {
      setError(res.error)
    } else {
      router.push('/dashboard/leads')
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12 mt-8">
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Wrench className="text-orange-500" /> Log Support Ticket
          </h2>
          <p className="text-gray-500 mt-1">Record a client issue and dispatch an installer.</p>
        </div>
        <Link href="/dashboard/leads" className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-800 transition">
          <ArrowLeft size={16} /> Back to Pipeline
        </Link>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
        <form action={handleSubmit} className="space-y-6">
          
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-2 text-sm font-bold border border-red-100">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Client Full Name</label>
              <input name="fullName" required placeholder="e.g. John Doe" className="w-full p-3 border rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Phone Number</label>
              <input name="phoneNumber" required placeholder="e.g. 08012345678" className="w-full p-3 border rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition" />
              <p className="text-[10px] text-gray-400 mt-1">*If this number is already in the database, the ticket will be attached to their existing profile.</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Vehicle Plate Number</label>
            <input name="plateNumber" required placeholder="e.g. KJA-123-XY" className="w-full p-3 border rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition" />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Type of Support Needed</label>
            <select name="jobType" required className="w-full p-3 border rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition font-medium">
              <option value="MAINTENANCE">🟠 General Maintenance / Physical Checkup</option>
              <option value="DEVICE_REPLACEMENT">🔴 Device Replacement (Swap Tracker)</option>
              <option value="SIM_REPLACEMENT">🟣 SIM Replacement (Network Issue)</option>
              <option value="TRANSFER">🔵 Transfer (Move tracker to new car)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Support Notes / Symptoms</label>
            <textarea name="supportNotes" rows={3} required placeholder="e.g. Client says tracker has been offline for 3 days. Installer should check power wires first." className="w-full p-3 border rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition"></textarea>
          </div>

          <div className="pt-4">
            <SubmitButton className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold hover:bg-orange-600 transition shadow-md shadow-orange-500/20 text-lg">
              Create & Dispatch Ticket
            </SubmitButton>
          </div>
        </form>
      </div>

    </div>
  )
}