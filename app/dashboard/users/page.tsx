import { prisma } from "@/lib/prisma"
import { UserPlus } from "lucide-react"
import CreateUserForm from "@/components/CreateUserForm"
import EmployeeCard from "@/components/EmployeeCard"

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  })

  // Group users into Active vs Inactive for better UI
  const activeUsers = users.filter(u => u.status === 'ACTIVE')
  const inactiveUsers = users.filter(u => u.status !== 'ACTIVE')

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      
      {/* HEADER */}
      <div>
        <h2 className="text-3xl font-bold text-gray-800">HR & Employee Directory</h2>
        <p className="text-gray-500 mt-1">Manage personnel files, update roles, and handle account access.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: ONBOARDING FORM */}
        <div className="xl:col-span-1">
          <div className="bg-white p-6 rounded-2xl border shadow-sm sticky top-6">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-6 border-b pb-4">
              <UserPlus size={20} className="text-[#84c47c]" /> Onboard New Staff
            </h3>
            <CreateUserForm />
          </div>
        </div>

        {/* RIGHT COLUMN: PERSONNEL DIRECTORY */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* Active Employees */}
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
               <h3 className="font-bold text-gray-800 text-lg">Active Personnel</h3>
               <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full">{activeUsers.length} Active</span>
            </div>
            
            <div className="flex flex-col gap-4">
              {activeUsers.map(user => (
                <EmployeeCard key={user.id} user={user} />
              ))}
              {activeUsers.length === 0 && <p className="text-gray-500 italic">No active employees found.</p>}
            </div>
          </div>

          {/* Suspended/Inactive Employees */}
          {inactiveUsers.length > 0 && (
            <div className="space-y-4 pt-6">
              <div className="flex justify-between items-center border-b pb-2">
                 <h3 className="font-bold text-gray-400 text-lg">Suspended / Inactive</h3>
                 <span className="bg-red-50 text-red-600 border border-red-100 text-xs font-bold px-3 py-1 rounded-full">{inactiveUsers.length} Inactive</span>
              </div>
              
              <div className="flex flex-col gap-4 opacity-80 hover:opacity-100 transition">
                {inactiveUsers.map(user => (
                  <EmployeeCard key={user.id} user={user} />
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}