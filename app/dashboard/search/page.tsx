import { PrismaClient } from "@prisma/client";
import Link from "next/link";
import { User, Car, Smartphone, ArrowRight } from "lucide-react";

const prisma = new PrismaClient();

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q: string }>;
}) {
  const { q } = await searchParams; // Await the search term

  if (!q) return <div className="text-gray-500">Please enter a search term.</div>;

  // Perform parallel searches
  const [clients, vehicles, devices] = await Promise.all([
    // 1. Search Clients by Name or Phone
    prisma.client.findMany({
      where: {
        OR: [
          { fullName: { contains: q, mode: 'insensitive' } },
          { phoneNumber: { contains: q } }
        ]
      },
      include: { vehicles: true }
    }),
    
    // 2. Search Vehicles by Plate, Make, or Model
    prisma.vehicle.findMany({
      where: {
        OR: [
          { plateNumber: { contains: q, mode: 'insensitive' } },
          { model: { contains: q, mode: 'insensitive' } }
        ]
      },
      include: { client: true, jobs: true }
    }),

    // 3. Search Devices by IMEI
    prisma.device.findMany({
      where: {
        imei: { contains: q }
      },
      include: { job: { include: { vehicle: { include: { client: true } } } } }
    })
  ]);

  const hasResults = clients.length > 0 || vehicles.length > 0 || devices.length > 0;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Search Results for <span className="text-blue-600">"{q}"</span>
      </h2>

      {!hasResults && (
         <div className="bg-gray-100 p-8 text-center rounded-xl text-gray-500">
            No matches found. Try a plate number, name, or phone number.
         </div>
      )}

      <div className="space-y-8">
        
        {/* CLIENT MATCHES */}
        {clients.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="flex items-center gap-2 font-bold text-gray-700 mb-4 border-b pb-2">
              <User size={20} className="text-blue-500"/> Clients Found ({clients.length})
            </h3>
            <div className="grid gap-3">
              {clients.map(c => (
                <div key={c.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-bold">{c.fullName}</p>
                    <p className="text-sm text-gray-500">{c.phoneNumber}</p>
                  </div>
                  <div className="text-sm text-gray-400">
                    {c.vehicles.length} Vehicle(s)
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VEHICLE MATCHES */}
        {vehicles.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="flex items-center gap-2 font-bold text-gray-700 mb-4 border-b pb-2">
              <Car size={20} className="text-orange-500"/> Vehicles Found ({vehicles.length})
            </h3>
            <div className="grid gap-3">
              {vehicles.map(v => (
                <div key={v.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-bold">{v.make} {v.model} ({v.plateNumber})</p>
                    <p className="text-sm text-gray-500">Owner: {v.client.fullName}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded font-bold ${
                    v.jobs[0]?.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100'
                  }`}>
                    {v.jobs[0]?.status || "NO JOB"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DEVICE MATCHES */}
        {devices.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="flex items-center gap-2 font-bold text-gray-700 mb-4 border-b pb-2">
              <Smartphone size={20} className="text-purple-500"/> Devices Found ({devices.length})
            </h3>
            <div className="grid gap-3">
              {devices.map(d => (
                <div key={d.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-mono font-bold">{d.imei}</p>
                    <p className="text-sm text-gray-500">SIM: {d.simNumber}</p>
                  </div>
                  {d.job?.vehicle ? (
                     <div className="text-right">
                       <p className="text-sm font-bold">{d.job.vehicle.plateNumber}</p>
                       <p className="text-xs text-gray-400">Installed on {d.job.vehicle.make}</p>
                     </div>
                  ) : (
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded">In Stock</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}