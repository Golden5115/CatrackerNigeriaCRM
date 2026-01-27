import CreateLeadForm from "@/components/CreateLeadForm"; // <--- Import your new component
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function CreateLeadPage() {
  return (
    <div className="max-w-4xl mx-auto py-8">
      
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/leads" className="p-2 hover:bg-gray-100 rounded-full transition">
           <ArrowLeft className="text-gray-500" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Add New Lead</h2>
          <p className="text-gray-500">Add a client and their vehicles to the pipeline.</p>
        </div>
      </div>

      {/* RENDER THE NEW DYNAMIC FORM */}
      <CreateLeadForm />
      
    </div>
  );
}