import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Plus, Mail, ShieldAlert } from "lucide-react"
import EditAccessButton from "@/components/EditUserButton"

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Team Management</h2>
          <p className="text-sm text-gray-500">Manage staff profiles, permissions, and roles.</p>
        </div>
        <Link href="/dashboard/users/create" className="bg-[#84c47c] text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-[#6aa663] transition shadow-sm">
          <Plus size={16} /> Add New User
        </Link>
      </div>

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Staff Member</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Role & Permissions</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Modules Access</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4">
                  <div className="font-bold text-sm text-gray-900">{user.fullName}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Mail size={10}/> {user.email}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col items-start gap-1">
                    <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded text-xs font-bold border">{user.role.replace('_', ' ')}</span>
                    
                    {/* 🟢 NEW: Instantly see who has Edit/Delete powers from the table */}
                    {(user.canEdit || user.canDelete) && (
                      <div className="flex gap-1 mt-1">
                        {user.canEdit && <span className="bg-orange-100 text-orange-700 text-[9px] font-bold px-1.5 py-0.5 rounded border border-orange-200 uppercase flex items-center gap-1"><ShieldAlert size={8}/> Can Edit</span>}
                        {user.canDelete && <span className="bg-red-100 text-red-700 text-[9px] font-bold px-1.5 py-0.5 rounded border border-red-200 uppercase flex items-center gap-1"><ShieldAlert size={8}/> Can Delete</span>}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1 max-w-[300px]">
                    {user.accessibleModules?.slice(0, 3).map((mod: string) => (
                      <span key={mod} className="bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase">{mod}</span>
                    ))}
                    {user.accessibleModules?.length > 3 && (
                      <span className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded text-[9px] font-bold">+{user.accessibleModules.length - 3} MORE</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <EditAccessButton user={user} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}