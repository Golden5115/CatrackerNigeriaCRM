import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Search as SearchIcon, User, Car, Cpu, Smartphone, ArrowRight } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;
  const q = typeof params.q === 'string' ? params.q : '';

  if (!q) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <SearchIcon size={48} className="mb-4 opacity-20" />
        <p className="text-xl font-medium text-gray-500">Enter a search term to begin.</p>
        <p className="text-sm mt-2">Search by client name, phone, plate number, or IMEI.</p>
      </div>
    );
  }

  // 👇 FIX: We now search 4 separate tables instead of 3
  const [clients, vehicles, devices, simCards] = await Promise.all([
    // 1. Search Clients
    prisma.client.findMany({
      where: {
        OR: [
          { fullName: { contains: q, mode: 'insensitive' } },
          { phoneNumber: { contains: q } },
          { email: { contains: q, mode: 'insensitive' } }
        ]
      },
      include: { vehicles: true }
    }),
    
    // 2. Search Vehicles
    prisma.vehicle.findMany({
      where: {
        OR: [
          { plateNumber: { contains: q, mode: 'insensitive' } },
          { name: { contains: q, mode: 'insensitive' } }
        ]
      },
      include: { client: true }
    }),
    
    // 3. Search Devices (IMEI ONLY)
    prisma.device.findMany({
      where: { imei: { contains: q } },
      include: { job: { include: { vehicle: { include: { client: true } } } } }
    }),

    // 4. Search SIM Cards (SIM ONLY)
    prisma.simCard.findMany({
      where: { simNumber: { contains: q } },
      include: { job: { include: { vehicle: { include: { client: true } } } } }
    })
  ]);

  const totalResults = clients.length + vehicles.length + devices.length + simCards.length;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      
      <div className="border-b pb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
          <SearchIcon className="text-blue-500" size={28} />
          Search Results for "{q}"
        </h2>
        <p className="text-gray-500 mt-1">Found {totalResults} matching records in your database.</p>
      </div>

      {totalResults === 0 && (
        <div className="bg-gray-50 rounded-xl p-12 text-center border border-dashed">
          <p className="text-gray-500 font-medium">No results found.</p>
          <p className="text-sm text-gray-400 mt-1">Double-check your spelling or try a different keyword.</p>
        </div>
      )}

      {/* --- CLIENT RESULTS --- */}
      {clients.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 border-b pb-2">
             <User size={18} className="text-[#84c47c]" /> Matching Clients
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clients.map(client => (
              <Link href={`/dashboard/clients/${client.id}`} key={client.id} className="block bg-white p-4 rounded-xl border hover:border-[#84c47c] hover:shadow-md transition group">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-gray-900 text-lg group-hover:text-[#2d4a2a] transition">{client.fullName}</p>
                    <p className="text-sm text-gray-500 mt-1">{client.phoneNumber}</p>
                    <p className="text-xs text-gray-400 mt-2 bg-gray-100 w-fit px-2 py-1 rounded">{client.vehicles.length} Vehicle(s)</p>
                  </div>
                  <ArrowRight size={18} className="text-gray-300 group-hover:text-[#84c47c] transition" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* --- VEHICLE RESULTS --- */}
      {vehicles.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 border-b pb-2">
             <Car size={18} className="text-blue-500" /> Matching Vehicles
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vehicles.map(vehicle => (
              <Link href={`/dashboard/clients/${vehicle.clientId}`} key={vehicle.id} className="block bg-white p-4 rounded-xl border hover:border-blue-400 hover:shadow-md transition group">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-gray-900">{vehicle.name} <span className="font-normal text-gray-500 text-sm">({vehicle.year || 'N/A'})</span></p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="font-mono text-xs bg-gray-100 border px-2 py-1 rounded font-bold">{vehicle.plateNumber || 'NO PLATE'}</span>
                      <span className="text-xs text-gray-500">Owned by: {vehicle.client.fullName}</span>
                    </div>
                  </div>
                  <ArrowRight size={18} className="text-gray-300 group-hover:text-blue-500 transition" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* --- HARDWARE (DEVICE & SIM) RESULTS --- */}
      {(devices.length > 0 || simCards.length > 0) && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 border-b pb-2">
             <Cpu size={18} className="text-purple-500" /> Matching Hardware
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Render Devices */}
            {devices.map(device => (
              <div key={device.id} className="bg-white p-4 rounded-xl border">
                <div className="flex items-start gap-3">
                  <Cpu size={20} className="text-purple-500 shrink-0 mt-1" />
                  <div className="w-full">
                    <p className="font-mono font-bold text-gray-900 break-all">{device.imei}</p>
                    <p className="text-xs text-gray-500 font-bold uppercase mt-1">Status: {device.status}</p>
                    
                    {device.job?.vehicle && (
                      <div className="mt-3 pt-3 border-t text-sm">
                        <p className="text-gray-500">Installed in:</p>
                        <Link href={`/dashboard/clients/${device.job.vehicle.clientId}`} className="text-blue-600 hover:underline font-medium block truncate">
                          {device.job.vehicle.name} ({device.job.vehicle.plateNumber})
                        </Link>
                        <p className="text-xs text-gray-400 mt-0.5">Client: {device.job.vehicle.client.fullName}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Render SIM Cards */}
            {simCards.map(sim => (
              <div key={sim.id} className="bg-white p-4 rounded-xl border">
                <div className="flex items-start gap-3">
                  <Smartphone size={20} className="text-purple-500 shrink-0 mt-1" />
                  <div className="w-full">
                    <p className="font-mono font-bold text-gray-900">{sim.simNumber}</p>
                    <p className="text-xs text-gray-500 font-bold uppercase mt-1">
                      Network: {sim.network || 'Unknown'} | Status: {sim.status}
                    </p>
                    
                    {sim.job?.vehicle && (
                      <div className="mt-3 pt-3 border-t text-sm">
                        <p className="text-gray-500">Installed in:</p>
                        <Link href={`/dashboard/clients/${sim.job.vehicle.clientId}`} className="text-blue-600 hover:underline font-medium block truncate">
                          {sim.job.vehicle.name} ({sim.job.vehicle.plateNumber})
                        </Link>
                        <p className="text-xs text-gray-400 mt-0.5">Client: {sim.job.vehicle.client.fullName}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

          </div>
        </div>
      )}

    </div>
  )
}