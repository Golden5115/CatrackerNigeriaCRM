import { PrismaClient } from "@prisma/client";
import Link from "next/link";
import { Plus, Shield, Wrench, Headset, User, Trash2 } from "lucide-react";

const prisma = new PrismaClient();

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  });

  // Helper to get icon based on role
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN': return <Shield size={16} className="text-red-600" />;
      case 'INSTALLER': return <Wrench size={16} className="text-orange-600" />;
      case 'TECH_SUPPORT': return <ServerIcon />;
      case 'CSR': return <Headset size={16} className="text-blue-600" />;
      default: return <User size={16} />;
    }
  };

  // Helper to get badge color
  const getRoleBadge = (role: string) => {
    const styles = {
      ADMIN: "bg-red-100 text-red-800 border-red-200",
      INSTALLER: "bg-orange-100 text-orange-800 border-orange-200",
      TECH_SUPPORT: "bg-purple-100 text-purple-800 border-purple-200",
      CSR: "bg-blue-100 text-blue-800 border-blue-200"
    };
    return styles[role as keyof typeof styles] || "bg-gray-100 text-gray-800";
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Team Management</h2>
          <p className="text-gray-500">Manage system access and employee roles.</p>
        </div>
        <Link href="/dashboard/users/create" className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition shadow-md">
          <Plus size={20} />
          Add Employee
        </Link>
      </div>

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Employee Name</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Email / Login</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Date Added</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-900">{user.fullName}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {user.email}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${getRoleBadge(user.role)}`}>
                    {getRoleIcon(user.role)}
                    {user.role.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-400">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Simple Icon component for Tech Support
function ServerIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600"><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></svg>
    )
}