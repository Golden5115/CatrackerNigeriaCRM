import { addVehicleToClient } from "@/app/actions/addVehicleToClient";
import { PrismaClient } from "@prisma/client";
import Link from "next/link";

const prisma = new PrismaClient();

export default async function AddVehiclePage({ 
  params 
}: { 
  params: Promise<{ clientId: string }> 
}) {
  const { clientId } = await params;
  
  // Fetch client name just for display purposes
  const client = await prisma.client.findUnique({ where: { id: clientId }});

  return (
    <div className="max-w-xl mx-auto mt-10">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Add Vehicle</h2>
        <p className="text-gray-500">Adding a new job for <span className="font-bold text-blue-600">{client?.fullName}</span></p>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border">
        <form action={addVehicleToClient} className="space-y-4">
          <input type="hidden" name="clientId" value={clientId} />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Make</label>
            <input name="make" required placeholder="e.g. Toyota" className="w-full p-2 border rounded-lg" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Model</label>
            <input name="model" required placeholder="e.g. Corolla" className="w-full p-2 border rounded-lg" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plate Number</label>
            <input name="plate" required placeholder="e.g. ABC-123-XY" className="w-full p-2 border rounded-lg" />
          </div>

          <div className="pt-4 flex gap-3">
             <Link 
               href={`/dashboard/clients/${clientId}`}
               className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-gray-600"
             >
               Cancel
             </Link>
             <button type="submit" className="flex-1 bg-black text-white py-2 rounded-lg font-bold hover:bg-gray-800">
               Create Job Ticket
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}