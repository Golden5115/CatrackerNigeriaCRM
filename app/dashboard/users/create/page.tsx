import { createUser } from "@/app/actions/createUser";
import Link from "next/link";
import SubmitButton from "@/components/SubmitButton";

export default function CreateUserPage() {
  return (
    <div className="max-w-xl mx-auto mt-10">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Add New Employee</h2>
        <p className="text-gray-500">Create a new account and assign system permissions.</p>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <form action={createUser} className="space-y-5">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input name="fullName" type="text" required placeholder="e.g. John Installer" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address (Login)</label>
            <input name="email" type="email" required placeholder="john@company.com" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input name="password" type="password" required className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign Role</label>
            <select name="role" required className="w-full p-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500">
              <option value="CSR">Customer Service (CSR)</option>
              <option value="INSTALLER">Field Installer</option>
              <option value="TECH_SUPPORT">Technical Support</option>
              <option value="ADMIN">Administrator</option>
            </select>
            <p className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded">
              <strong>Note:</strong> 
              <br/>• Installers only see mobile job lists.
              <br/>• Tech Support sees server config queue.
              <br/>• CSRs see leads and payments.
            </p>
          </div>

          <div className="pt-4 flex gap-3">
             <Link href="/dashboard/users" className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-gray-600">
               Cancel
             </Link>
             <SubmitButton 
    className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 shadow-lg"
    loadingText="Creating Account..."
  >
    Create Staff Account
  </SubmitButton>
          </div>
        </form>
      </div>
    </div>
  );
}