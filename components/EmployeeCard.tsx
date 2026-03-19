'use client'

import { useState } from "react"
import { Shield, Mail, Briefcase, Phone, MapPin, Key, UserX, CheckCircle, ChevronDown, ChevronUp, FileText, Save, Loader2 } from "lucide-react"
import { updateEmployeeStatus, resetEmployeePassword, updatePersonnelFile } from "@/app/actions/hr"
import SubmitButton from "./SubmitButton"

export default function EmployeeCard({ user }: { user: any }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditingHR, setIsEditingHR] = useState(false)
  const [showPasswordReset, setShowPasswordReset] = useState(false)
  const [loadingStatus, setLoadingStatus] = useState(false)

  const isActive = user.status === 'ACTIVE'

  // --- HANDLERS ---
  const handleToggleStatus = async () => {
    if (!confirm(`Are you sure you want to ${isActive ? 'SUSPEND' : 'ACTIVATE'} this employee?`)) return;
    setLoadingStatus(true)
    await updateEmployeeStatus(user.id, isActive ? 'SUSPENDED' : 'ACTIVE')
    setLoadingStatus(false)
  }

  const handlePasswordReset = async (formData: FormData) => {
    const res = await resetEmployeePassword(formData)
    if (res.error) alert(res.error)
    else { alert("Password reset successfully!"); setShowPasswordReset(false) }
  }

  const handleHRUpdate = async (formData: FormData) => {
    await updatePersonnelFile(formData)
    setIsEditingHR(false)
  }

  return (
    <div className={`bg-white border rounded-2xl shadow-sm overflow-hidden transition-all ${!isActive ? 'opacity-75 bg-gray-50' : ''}`}>
      
      {/* 1. TOP SUMMARY BAR (Always Visible) */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-6 cursor-pointer hover:bg-gray-50 transition flex justify-between items-center"
      >
        <div className="flex items-center gap-4">
          <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${
             user.role === 'CEO' || user.role === 'MANAGER' ? 'bg-purple-100 text-purple-700' :
             user.role === 'HR' || user.role === 'ADMIN' ? 'bg-red-100 text-red-700' :
             user.role === 'INSTALLER' ? 'bg-blue-100 text-blue-700' :
             'bg-[#e0f2de] text-[#2d4a2a]'
          }`}>
            {user.fullName?.charAt(0) || 'U'}
          </div>
          
          <div>
            <h4 className="font-bold text-gray-900 text-lg flex items-center gap-2">
              {user.fullName}
              {['CEO', 'MANAGER', 'ADMIN', 'HR'].includes(user.role) && <Shield size={14} className="text-red-500" />}
            </h4>
            <div className="flex items-center gap-4 text-xs mt-1">
              <span className="flex items-center gap-1 text-gray-500"><Mail size={12}/> {user.email}</span>
              <span className="flex items-center gap-1 font-bold uppercase text-gray-700"><Briefcase size={12}/> {user.role.replace('_', ' ')}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
            isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {user.status}
          </span>
          {isExpanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
        </div>
      </div>

      {/* 2. EXPANDED PERSONNEL FILE */}
      {isExpanded && (
        <div className="border-t border-gray-100 bg-gray-50/50 p-6 space-y-6">
          
          {/* Action Buttons */}
          <div className="flex gap-3 pb-4 border-b border-gray-200">
            <button 
              onClick={handleToggleStatus} disabled={loadingStatus}
              className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition ${
                isActive ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200' 
                         : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
              }`}
            >
              {loadingStatus ? <Loader2 size={14} className="animate-spin" /> : isActive ? <UserX size={14}/> : <CheckCircle size={14}/>}
              {isActive ? "Deactivate Account" : "Reactivate Account"}
            </button>

            <button 
              onClick={() => setShowPasswordReset(!showPasswordReset)}
              className="px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition"
            >
              <Key size={14}/> Reset Password
            </button>
            
            <button 
              onClick={() => setIsEditingHR(!isEditingHR)}
              className="px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 bg-gray-200 text-gray-700 hover:bg-gray-300 transition ml-auto"
            >
              <FileText size={14}/> {isEditingHR ? "Cancel Edit" : "Edit HR File"}
            </button>
          </div>

          {/* Password Reset Form */}
          {showPasswordReset && (
            <form action={handlePasswordReset} className="bg-blue-600 p-4 rounded-xl flex items-end gap-3 shadow-inner">
              <input type="hidden" name="userId" value={user.id} />
              <div className="flex-1">
                <label className="text-[10px] font-bold text-blue-200 uppercase mb-1 block">New Secure Password</label>
                <input name="newPassword" type="text" required placeholder="Enter new password..." className="w-full p-2 rounded bg-blue-700 text-white border-none placeholder-blue-400 outline-none focus:ring-2 focus:ring-white" />
              </div>
              <SubmitButton className="bg-white text-blue-700 font-bold px-4 py-2 rounded h-10 hover:bg-blue-50">Force Reset</SubmitButton>
            </form>
          )}

          {/* HR Details View/Edit */}
          <form action={handleHRUpdate} className="space-y-4">
            <input type="hidden" name="userId" value={user.id} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Info */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1"><UserX size={12}/> Personal Info</h5>
                
                <div>
                  <label className="text-[10px] font-bold text-gray-500 block mb-1">Phone Number</label>
                  {isEditingHR ? <input name="phoneNumber" defaultValue={user.phoneNumber || ''} className="w-full p-2 border rounded text-sm" /> 
                               : <p className="text-sm font-medium text-gray-800 flex items-center gap-2"><Phone size={14} className="text-gray-400"/> {user.phoneNumber || "Not provided"}</p>}
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 block mb-1">Residential Address</label>
                  {isEditingHR ? <textarea name="address" defaultValue={user.address || ''} className="w-full p-2 border rounded text-sm" /> 
                               : <p className="text-sm font-medium text-gray-800 flex items-start gap-2"><MapPin size={14} className="text-gray-400 mt-1"/> {user.address || "Not provided"}</p>}
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 block mb-1">Role Qualifications / Certifications</label>
                  {isEditingHR ? <input name="qualifications" defaultValue={user.qualifications || ''} placeholder="e.g. Certified Auto-Electrician" className="w-full p-2 border rounded text-sm" /> 
                               : <p className="text-sm font-medium text-gray-800 flex items-start gap-2"><FileText size={14} className="text-gray-400 mt-1"/> {user.qualifications || "None on file"}</p>}
                </div>
              </div>

              {/* Guarantor Info */}
              <div className="space-y-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1"><Shield size={12}/> Guarantor Details</h5>
                
                <div>
                  <label className="text-[10px] font-bold text-gray-500 block mb-1">Guarantor Name</label>
                  {isEditingHR ? <input name="guarantorName" defaultValue={user.guarantorName || ''} className="w-full p-2 border rounded text-sm bg-gray-50" /> 
                               : <p className="text-sm font-bold text-gray-800">{user.guarantorName || "Not provided"}</p>}
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 block mb-1">Guarantor Phone</label>
                  {isEditingHR ? <input name="guarantorPhone" defaultValue={user.guarantorPhone || ''} className="w-full p-2 border rounded text-sm bg-gray-50" /> 
                               : <p className="text-sm text-gray-800">{user.guarantorPhone || "Not provided"}</p>}
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 block mb-1">Guarantor Address</label>
                  {isEditingHR ? <textarea name="guarantorAddress" defaultValue={user.guarantorAddress || ''} className="w-full p-2 border rounded text-sm bg-gray-50" /> 
                               : <p className="text-sm text-gray-800">{user.guarantorAddress || "Not provided"}</p>}
                </div>
              </div>
            </div>

            {isEditingHR && (
              <div className="pt-4 flex justify-end">
                <SubmitButton className="bg-[#84c47c] text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-[#6aa663]">
                  <Save size={16} /> Save HR File
                </SubmitButton>
              </div>
            )}
          </form>

        </div>
      )}
    </div>
  )
}