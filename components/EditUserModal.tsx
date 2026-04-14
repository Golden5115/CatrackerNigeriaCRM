'use client'

import { useState } from "react"
import { updateUser } from "@/app/actions/users"
import { Loader2, UserCog, X, ShieldAlert } from "lucide-react"

const AVAILABLE_MODULES = [
  "Dashboard", "Sales Pipeline", "Client Database", "Payments", "Invoices", 
  "Inventory", "Tech Support", "Activation", "Revenue Analytics", "Team"
];

const ROLES = ["ADMIN", "CSR", "INSTALLER", "TECH_SUPPORT", "CEO", "MANAGER", "HR", "OPERATIONS"];

export default function EditUserModal({ user, onClose }: { user: any, onClose: () => void }) {
  // Profile State
  const [fullName, setFullName] = useState(user.fullName || "")
  const [role, setRole] = useState(user.role || "CSR")
  
  // Permissions State
  const [canEdit, setCanEdit] = useState(user.canEdit || false)
  const [canDelete, setCanDelete] = useState(user.canDelete || false)
  
  // Modules State
  const [selectedModules, setSelectedModules] = useState<string[]>(user.accessibleModules || [])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleToggleModule = (module: string) => {
    if (selectedModules.includes(module)) setSelectedModules(selectedModules.filter(m => m !== module))
    else setSelectedModules([...selectedModules, module])
  }

  const handleSave = async () => {
    setIsSubmitting(true)
    const payload = { fullName, role, canEdit, canDelete, accessibleModules: selectedModules }
    const res = await updateUser(user.id, payload)
    if (res.error) alert(res.error)
    setIsSubmitting(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className="flex justify-between items-center p-6 border-b">
           <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
             <UserCog className="text-[#84c47c]" /> Edit User Profile
           </h3>
           <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-gray-100 p-1.5 rounded-full"><X size={18}/></button>
        </div>
        
        {/* SCROLLABLE BODY */}
        <div className="p-6 overflow-y-auto space-y-8">
            
            {/* SECTION 1: Profile */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
                    <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full p-2.5 border rounded-lg outline-none text-sm font-medium" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">System Role</label>
                    <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full p-2.5 border rounded-lg outline-none text-sm font-medium">
                        {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                    </select>
                </div>
            </div>

            {/* SECTION 2: Data Permissions */}
            <div>
                <h4 className="text-sm font-bold text-gray-800 border-b pb-2 mb-3 flex items-center gap-2">
                    <ShieldAlert size={16} className="text-orange-500" /> Data Permissions
                </h4>
                <div className="flex gap-6 bg-orange-50 p-4 rounded-xl border border-orange-100">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={canEdit} onChange={(e) => setCanEdit(e.target.checked)} className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500" />
                        <span className="text-sm font-bold text-orange-900">Allow Editing Data</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={canDelete} onChange={(e) => setCanDelete(e.target.checked)} className="w-4 h-4 text-red-500 rounded focus:ring-red-500" />
                        <span className="text-sm font-bold text-red-900">Allow Deleting Data</span>
                    </label>
                </div>
            </div>

            {/* SECTION 3: Module Access */}
            <div>
                <h4 className="text-sm font-bold text-gray-800 border-b pb-2 mb-3">Accessible Modules</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {AVAILABLE_MODULES.map(module => (
                    <label key={module} className="flex items-center gap-3 p-3 border rounded-xl hover:bg-gray-50 cursor-pointer transition shadow-sm bg-white">
                    <input 
                        type="checkbox" 
                        checked={selectedModules.includes(module)}
                        onChange={() => handleToggleModule(module)}
                        className="w-4 h-4 text-[#84c47c] rounded focus:ring-[#84c47c]"
                    />
                    <span className="text-sm font-medium text-gray-800">{module}</span>
                    </label>
                ))}
                </div>
            </div>

        </div>

        {/* FOOTER */}
        <div className="p-6 border-t bg-gray-50 rounded-b-2xl">
            <button 
                onClick={handleSave} 
                disabled={isSubmitting}
                className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-black transition flex justify-center items-center"
            >
                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : "Save Changes"}
            </button>
        </div>

      </div>
    </div>
  )
}