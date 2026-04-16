'use client'

import { useState } from "react"
import { Eye, EyeOff, CheckSquare, AlertCircle } from "lucide-react"
import SubmitButton from "./SubmitButton"
import { createUser } from "@/app/actions/users"

const AVAILABLE_MODULES = [
  { id: "Dashboard", label: "Dashboard" },
  { id: "Sales Pipeline", label: "Sales Pipeline" },
  { id: "Support Tickets", label: "Support Tickets" }, // 👈 ADDED HERE
  { id: "Client Database", label: "Client Database" },
  { id: "Fleet & Vehicles", label: "Fleet & Vehicles" },
  { id: "Payments", label: "Payments" },
  { id: "Invoices", label: "Invoices" },
  { id: "Inventory", label: "Inventory" },
  { id: "Tech Support", label: "Tech Support" },
  { id: "Activation", label: "Activation" },
  { id: "Revenue Analytics", label: "Revenue Analytics" },
  { id: "Team", label: "Team" }
];

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
          <option value="OPERATIONS">Operations Manager</option> {/* 👈 ADD THIS */}
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

      

     {/* 👇 NEW: Split Permissions Block */}
      <div className="pt-4 mt-6 border-t border-gray-100 space-y-3">
        <label className="flex items-start gap-3 p-4 border rounded-xl bg-blue-50/30 cursor-pointer hover:bg-blue-50 transition border-blue-100">
          <input 
            type="checkbox" 
            name="canEdit" 
            className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" 
          />
          <div>
            <p className="font-bold text-blue-900 text-sm">Grant Create & Edit Permissions</p>
            <p className="text-xs text-blue-700 mt-1">Allows this user to add new leads, log support tickets, and edit client profiles.</p>
          </div>
        </label>

        <label className="flex items-start gap-3 p-4 border rounded-xl bg-red-50/30 cursor-pointer hover:bg-red-50 transition border-red-100">
          <input 
            type="checkbox" 
            name="canDelete" 
            className="mt-1 w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500" 
          />
          <div>
            <p className="font-bold text-red-900 text-sm">Grant Delete Permissions</p>
            <p className="text-xs text-red-700 mt-1">Warning: Allows this user to permanently delete clients and wipe their history.</p>
          </div>
        </label>
      </div>

      <SubmitButton className="w-full bg-[#84c47c] text-white py-3 rounded-xl font-bold hover:bg-[#6aa663] transition mt-4">
        Create Account
      </SubmitButton>
    </form>
  )
}