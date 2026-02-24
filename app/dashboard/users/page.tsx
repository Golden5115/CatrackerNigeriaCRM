import { prisma } from "@/lib/prisma"
import { Shield, UserPlus, CheckSquare, Mail, Briefcase } from "lucide-react"
import SubmitButton from "@/components/SubmitButton"
import { createUser } from "@/app/actions/users"

export const dynamic = 'force-dynamic'

const AVAILABLE_MODULES = [
  { id: '/dashboard/leads', label: 'Sales Pipeline (Leads)' },
  { id: '/dashboard/tech', label: 'Tech Support (QC)' },
  { id: '/dashboard/activation', label: 'Client Onboarding' },
  { id: '/dashboard/inventory', label: 'Inventory Management' },
  { id: '/dashboard/payments', label: 'Payments & Financials' },
  { id: '/dashboard/clients', label: 'Client Database' }
]

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      
      {/* HEADER */}
      <div>
        <h2 className="text-3xl font-bold text-gray-800">Team & Roles</h2>
        <p className="text-gray-500 mt-1">Manage staff accounts, assign roles, and restrict module access.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: CREATE USER FORM */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl border shadow-sm sticky top-6">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-6 border-b pb-4">
              <UserPlus size={20} className="text-[#84c47c]" /> Add New Team Member
            </h3>
            
           <form action={async (formData) => {
              'use server';
              await createUser(formData);
            }} className="space-y-4">
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
                <input name="password" type="password" required className="w-full p-3 border rounded-xl bg-gray-50 focus:bg-white focus:ring-2 outline-none transition" />
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
          </div>
        </div>

        {/* RIGHT COLUMN: STAFF LIST */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b flex justify-between items-center">
              <h3 className="font-bold text-gray-800">Active Directory</h3>
              <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">{users.length} Users</span>
            </div>
            
            <div className="divide-y divide-gray-100">
              {users.map(user => (
                <div key={user.id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex justify-between items-start">
                    
                    <div className="flex items-start gap-4">
                      <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${
                        user.role === 'ADMIN' ? 'bg-red-100 text-red-700' :
                        user.role === 'INSTALLER' ? 'bg-blue-100 text-blue-700' :
                        user.role === 'TECH_SUPPORT' ? 'bg-orange-100 text-orange-700' :
                        'bg-[#e0f2de] text-[#2d4a2a]'
                      }`}>
                        {user.fullName?.charAt(0) || 'U'}
                      </div>
                      
                      <div>
                        <h4 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                          {user.fullName}
                          {user.role === 'ADMIN' && <Shield size={14} className="text-red-500" />}
                        </h4>
                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                          <span className="flex items-center gap-1"><Mail size={12}/> {user.email}</span>
                          <span className="flex items-center gap-1 font-bold uppercase"><Briefcase size={12}/> {user.role.replace('_', ' ')}</span>
                        </div>
                        
                        <div className="mt-3 flex flex-wrap gap-1">
                          {user.role === 'ADMIN' ? (
                            <span className="text-[10px] font-bold bg-red-50 border border-red-100 text-red-600 px-2 py-1 rounded">FULL ACCESS</span>
                          ) : user.accessibleModules.length > 0 ? (
                            user.accessibleModules.map(mod => {
                              const label = AVAILABLE_MODULES.find(m => m.id === mod)?.label || mod;
                              return (
                                <span key={mod} className="text-[10px] font-bold bg-gray-100 border text-gray-600 px-2 py-1 rounded">
                                  {label}
                                </span>
                              )
                            })
                          ) : (
                            <span className="text-[10px] font-bold bg-gray-100 text-gray-400 px-2 py-1 rounded border border-dashed">No Modules Assigned</span>
                          )}
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}