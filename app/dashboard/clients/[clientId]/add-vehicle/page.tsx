import { addVehicleToClient } from "@/app/actions/addVehicleToClient";
import { prisma } from "@/lib/prisma"
import Link from "next/link";
import { ArrowLeft, Car, Hash, Calendar } from "lucide-react";
import SubmitButton from "@/components/SubmitButton";

export default async function AddVehiclePage({ 
  params 
}: { 
  params: Promise<{ clientId: string }> 
}) {
  const { clientId } = await params;
  
  // Fetch client
  const client = await prisma.client.findUnique({ where: { id: clientId }});
  if (!client) return <div>Client not found.</div>;

  const inputClass = "w-full border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 py-3 pr-4 pl-10 text-sm text-gray-700 bg-white placeholder-gray-400";

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      
      {/* HEADER */}
      <div>
        <Link href={`/dashboard/clients/${clientId}`} className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-800 font-medium mb-4 text-sm transition">
          <ArrowLeft size={16} /> Back to Client Profile
        </Link>
        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Car className="text-[#84c47c]" size={32} /> Add New Vehicle
        </h2>
        <p className="text-gray-500 mt-1">Creating a new installation ticket for returning client: <span className="font-bold text-[#2d4a2a]">{client.fullName}</span></p>
      </div>

      {/* FORM */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <form action={addVehicleToClient} className="space-y-6">
          <input type="hidden" name="clientId" value={clientId} />

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b pb-2">Vehicle Details</h3>
            
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Vehicle Name / Model *</label>
              <div className="relative">
                <Car className="absolute left-3 top-3 text-gray-400" size={18} />
                <input name="vehicleName" required placeholder="e.g. Toyota Camry" className={inputClass} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Year</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input name="year" placeholder="e.g. 2018" className={inputClass} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Plate Number <span className="text-gray-400 font-normal">(Optional)</span></label>
                <div className="relative">
                  <Hash className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input name="plate" placeholder="ABC-123-XY" className={`${inputClass} font-mono uppercase`} />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 flex gap-4">
             <Link 
               href={`/dashboard/clients/${clientId}`}
               className="px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 font-bold transition flex items-center justify-center w-1/3"
             >
               Cancel
             </Link>
             
             <SubmitButton 
               className="flex-1 bg-[#84c47c] text-white py-3 rounded-xl font-bold hover:bg-[#6aa663] shadow-lg transition text-lg"
               loadingText="Creating Ticket..."
             >
               Create Job Ticket
             </SubmitButton>
          </div>
        </form>
      </div>
    </div>
  );
}