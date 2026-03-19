import { prisma } from "@/lib/prisma"
import { verifySession } from "@/lib/session"
import { Shield, Mail, Phone, MapPin, Briefcase, FileText, CheckCircle, Lock } from "lucide-react"

export const dynamic = 'force-dynamic'

const AVAILABLE_MODULES = [
  { id: '/dashboard/leads', label: 'Sales Pipeline (Leads)' },
  { id: '/dashboard/tech', label: 'Tech Support (QC)' },
  { id: '/dashboard/activation', label: 'Client Onboarding' },
  { id: '/dashboard/inventory', label: 'Inventory Management' },
  { id: '/dashboard/payments', label: 'Payments & Financials' },
  { id: '/dashboard/clients', label: 'Client Database' }
]

export default async function MyProfilePage() {
  // 1. Get the currently logged-in user
  const session = await verifySession()
  const userId = typeof session?.userId === 'string' ? session.userId : null;

  if (!userId) return <div>Please log in.</div>;

  // 2. Fetch their full HR file
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })

  if (!user) return <div>User not found.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800">My Profile</h2>
        <p className="text-gray-500 mt-1">View your official personnel file and system permissions.</p>
      </div>

      {/* 1. TOP HEADER CARD */}
      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center md:items-start gap-6 relative overflow-hidden">
        {/* Decorative background shape */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-50 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2"></div>
        
        <div className={`h-24 w-24 rounded-full flex items-center justify-center font-bold text-4xl shrink-0 shadow-inner ${
             user.role === 'CEO' || user.role === 'MANAGER' ? 'bg-purple-100 text-purple-700' :
             user.role === 'HR' || user.role === 'ADMIN' ? 'bg-red-100 text-red-700' :
             user.role === 'INSTALLER' ? 'bg-blue-100 text-blue-700' :
             'bg-[#e0f2de] text-[#2d4a2a]'
        }`}>
          {user.fullName?.charAt(0) || 'U'}
        </div>

        <div className="text-center md:text-left flex-1">
          <h3 className="text-2xl font-bold text-gray-900">{user.fullName}</h3>
          <p className="text-gray-500 font-medium uppercase tracking-widest text-sm mt-1 mb-4 flex items-center justify-center md:justify-start gap-2">
            <Briefcase size={16}/> {user.role.replace('_', ' ')}
          </p>
          
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-lg border"><Mail size={14} className="text-gray-400"/> {user.email}</span>
            <span className="flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-lg border"><Phone size={14} className="text-gray-400"/> {user.phoneNumber || "No phone added"}</span>
          </div>
        </div>

        <div className="text-right hidden md:block">
           <span className="text-xs font-bold text-gray-400 uppercase block mb-1">Account Status</span>
           <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2">
             <CheckCircle size={16} /> {user.status}
           </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* 2. HR & PERSONAL DETAILS */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border shadow-sm h-full">
            <h4 className="font-bold text-gray-800 border-b pb-4 mb-4 flex items-center gap-2">
              <FileText size={18} className="text-gray-400"/> Personnel Record
            </h4>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Home Address</label>
                <p className="text-gray-800 text-sm flex items-start gap-2">
                  <MapPin size={16} className="text-gray-400 shrink-0 mt-0.5" />
                  {user.address || "Please contact HR to update your address."}
                </p>
              </div>
              
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Role Qualifications</label>
                <p className="text-gray-800 text-sm bg-gray-50 p-3 rounded-lg border">
                  {user.qualifications || "No special certifications on file."}
                </p>
              </div>

              <div className="pt-4 border-t mt-4">
                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Emergency Guarantor Details</label>
                 <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl text-sm">
                   <p className="font-bold text-orange-900">{user.guarantorName || "None Provided"}</p>
                   <p className="text-orange-800 mt-1">{user.guarantorPhone}</p>
                   <p className="text-orange-800 text-xs mt-1 opacity-80">{user.guarantorAddress}</p>
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. SECURITY & PERMISSIONS */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border shadow-sm h-full">
            <h4 className="font-bold text-gray-800 border-b pb-4 mb-4 flex items-center gap-2">
              <Shield size={18} className="text-[#84c47c]"/> System Access Levels
            </h4>
            
            <p className="text-sm text-gray-500 mb-6">
              Below are the modules you are authorized to access. If you need additional access to perform your duties, please contact an Administrator.
            </p>

            <div className="space-y-3">
              {user.role === 'ADMIN' ? (
                 <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 flex items-start gap-3">
                   <Shield size={24} className="shrink-0 text-red-500" />
                   <div>
                     <p className="font-bold">Full Administrator Access</p>
                     <p className="text-xs mt-1">You have unrestricted read/write access to all system modules, including HR and Financials.</p>
                   </div>
                 </div>
              ) : (
                AVAILABLE_MODULES.map(module => {
                  const hasAccess = user.accessibleModules.includes(module.id);
                  return (
                    <div key={module.id} className={`p-3 rounded-xl border flex items-center justify-between ${
                      hasAccess ? 'bg-[#e0f2de]/30 border-[#84c47c]/30' : 'bg-gray-50 border-gray-100 opacity-60'
                    }`}>
                      <span className={`text-sm font-medium ${hasAccess ? 'text-gray-900' : 'text-gray-400'}`}>
                        {module.label}
                      </span>
                      {hasAccess ? (
                        <CheckCircle size={16} className="text-[#84c47c]" />
                      ) : (
                        <Lock size={16} className="text-gray-300" />
                      )}
                    </div>
                  )
                })
              )}
            </div>
            
          </div>
        </div>

      </div>
    </div>
  )
}