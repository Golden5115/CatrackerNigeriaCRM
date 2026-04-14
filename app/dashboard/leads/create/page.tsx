import CreateLeadForm from "@/components/CreateLeadForm"
import { AlertCircle } from "lucide-react"

export default async function CreateLeadPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;
  // 🟢 NEW: Extract the error code from the URL
  const error = params.error as string; 

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Create New Lead</h2>
        <p className="text-sm text-gray-500 mt-1">
          Enter the client's details and their vehicles to generate job tickets and dispatch to installers.
        </p>
      </div>

      {/* 🟢 NEW: Display the error message clearly at the top of the form */}
      {error === 'phone_taken' && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="font-bold text-sm">Phone Number Already Exists</h4>
            <p className="text-xs mt-1">A client with this phone number is already registered in the CRM. Please search the Client Database to add a vehicle to their existing profile.</p>
          </div>
        </div>
      )}

      {error === 'email_taken' && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="font-bold text-sm">Email Address Already Exists</h4>
            <p className="text-xs mt-1">A client with this email address is already registered in the CRM. Please use a different email or add this vehicle to their existing profile.</p>
          </div>
        </div>
      )}

      <CreateLeadForm />
    </div>
  )
}