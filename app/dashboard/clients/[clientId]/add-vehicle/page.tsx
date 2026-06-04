import { prisma } from "@/lib/prisma"
import Link from "next/link";
import { ArrowLeft, Car } from "lucide-react";
import AddMultipleVehiclesForm from "@/components/AddMultipleVehiclesForm";

export default async function AddVehiclePage({ 
  params 
}: { 
  params: Promise<{ clientId: string }> 
}) {
  const { clientId } = await params;
  
  // Fetch client
  const client = await prisma.client.findUnique({ where: { id: clientId }});
  if (!client) return <div className="p-12 text-center text-gray-500">Client not found.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      
      {/* HEADER */}
      <div>
        <Link href={`/dashboard/clients/${clientId}`} className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-800 font-medium mb-4 text-sm transition bg-white px-3 py-1.5 rounded-lg border shadow-sm">
          <ArrowLeft size={16} /> Back to Client Profile
        </Link>
        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3 mt-2">
          <Car className="text-[#84c47c]" size={32} /> Add New Vehicles
        </h2>
        <p className="text-gray-500 mt-2">Creating installation tickets for returning client: <span className="font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded">{client.fullName}</span></p>
      </div>

      {/* 🟢 NEW: Interactive Client Component handles multiple rows */}
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
        <AddMultipleVehiclesForm clientId={clientId} />
      </div>
    </div>
  );
}