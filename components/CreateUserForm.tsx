'use client'

import { useState } from "react"
import { Eye, EyeOff, CheckSquare, AlertCircle } from "lucide-react"
import SubmitButton from "./SubmitButton"
import { createUser } from "@/app/actions/users"

const AVAILABLE_MODULES = [
  { id: '/dashboard/leads', label: 'Sales Pipeline (Leads)' },
  { id: '/dashboard/tech', label: 'Tech Support (QC)' },
  { id: '/dashboard/activation', label: 'Client Onboarding' },
  { id: '/dashboard/inventory', label: 'Inventory Management' },
  { id: '/dashboard/payments', label: 'Payments & Financials' },
  { id: '/dashboard/clients', label: 'Client Database' }
]

export default function CreateUserForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(formData: FormData) {
    setError("") // clear old errors
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    // 1. Client-side Validation: Do they match?
    if (password !== confirmPassword) {
      setError("Passwords do not match!")
      return
    }

    // 2. Send to Server Action
    const res = await createUser(formData)
    
    if (res?.error) {
      setError(res.error)
    } else {
      // Optional: Reset form or show success message if needed
      // window.location.reload() or reset form state
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-xl flex items-center gap-2 text-sm font-bold border border-red-100">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
        <input name="fullName" required className="w-full p-3 border rounded-xl bg-gray-50 focus:bg-white focus:ring-2 outline-none transition" />
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email (Login ID)</label>
        <input name="email" type="email" required className="w-full p-3 border rounded-xl bg-gray-50 focus:bg-white focus:ring-2 outline-none transition" />
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Password</label>
        <div className="relative">
          <input 
            name="password" 
            type={showPassword ? "text" : "password"} 
            required 
            className="w-full p-3 pr-12 border rounded-xl bg-gray-50 focus:bg-white focus:ring-2 outline-none transition" 
          />
          <button 
            type="button" 
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Confirm Password</label>
        <div className="relative">
          <input 
            name="confirmPassword" 
            type={showPassword ? "text" : "password"} 
            required 
            className="w-full p-3 pr-12 border rounded-xl bg-gray-50 focus:bg-white focus:ring-2 outline-none transition" 
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Role / Title</label>
        <select name="role" className="w-full p-3 border rounded-xl bg-gray-50 outline-none">
          <option value="INSTALLER">Field Installer</option>
          <option value="CSR">Customer Service (CSR)</option>
          <option value="TECH_SUPPORT">Tech Support</option>
          <option value="ADMIN">Administrator</option>
        </select>
      </div>

      <div className="pt-2">
        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1">
          <CheckSquare size={14} /> Module Access
        </label>
        <div className="space-y-2 bg-gray-50 p-4 rounded-xl border">
          {AVAILABLE_MODULES.map(module => (
            <label key={module.id} className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                name="modules" 
                value={module.id} 
                className="w-4 h-4 rounded border-gray-300 text-[#84c47c] focus:ring-[#84c47c]"
              />
              <span className="text-sm font-medium text-gray-700 group-hover:text-black transition">{module.label}</span>
            </label>
          ))}
          <p className="text-[10px] text-gray-400 italic mt-2">
            *Admins automatically have access to all modules, regardless of checkboxes.
          </p>
        </div>
      </div>

      <SubmitButton className="w-full bg-[#84c47c] text-white py-3 rounded-xl font-bold hover:bg-[#6aa663] transition mt-4">
        Create Account
      </SubmitButton>
    </form>
  )
}