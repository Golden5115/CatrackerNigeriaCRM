import { prisma } from "@/lib/prisma"
import Link from "next/link";
import { User, Car, Smartphone, ArrowRight, MapPin, Mail, Hash } from "lucide-react";

// Helper to determine where to send the user based on Job Status
const getJobModuleInfo = (job: any, clientId: string) => {
  if (!job) return { name: "No Active Job", url: `/dashboard/clients/${clientId}`, color: "bg-gray-100 text-gray-600" };

  switch (job.status) {
    case 'NEW_LEAD':
    case 'SCHEDULED':
      return { 
        name: "Sales Pipeline", 
        url: `/dashboard/clients/${clientId}`, // Leads don't have a dedicated page, go to Client
        color: "bg-blue-100 text-blue-700" 
      };
    case 'INSTALLED':
      return { 
        name: "Tech Support Queue", 
        url: `/dashboard/tech/${job.id}`, 
        color: "bg-orange-100 text-orange-700" 
      };
    case 'CONFIGURED':
      return { 
        name: "Activation & Onboarding", 
        url: `/dashboard/activation/${job.id}`, 
        color: "bg-purple-100 text-purple-700" 
      };
    case 'ACTIVE':
      return { 
        name: "Active Client", 
        url: `/dashboard/clients/${clientId}`, 
        color: "bg-green-100 text-green-700" 
      };
    default:
      return { 
        name: "Client Database", 
        url: `/dashboard/clients/${clientId}`, 
        color: "bg-gray-100 text-gray-700" 
      };
  }
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q: string }>;
}) {
  const { q } = await searchParams;

  if (!q) return <div className="text-gray-500 mt-8 text-center">Please enter a search term to begin.</div>;

  const [clients, vehicles, devices] = await Promise.all([
    // 1. Clients (Added: Email, Address)
    prisma.client.findMany({
      where: {
        OR: [
          { fullName: { contains: q, mode: 'insensitive' } },
          { phoneNumber: { contains: q } },
          { email: { contains: q, mode: 'insensitive' } }, // <--- New
          { address: { contains: q, mode: 'insensitive' } } // <--- New
        ]
      },
      include: { vehicles: true }
    }),
    
    // 2. Vehicles (Added: Job Status Check)
    prisma.vehicle.findMany({
      where: {
        OR: [
          { plateNumber: { contains: q, mode: 'insensitive' } },
          { name: { contains: q, mode: 'insensitive' } }
        ]
      },
      include: { 
        client: true, 
        jobs: { orderBy: { createdAt: 'desc' }, take: 1 } // Get latest job
      }
    }),

    // 3. Devices (Added: Sim Number)
    prisma.device.findMany({
      where: { 
        OR: [
          { imei: { contains: q } },
          { simNumber: { contains: q } } // <--- New
        ]
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
         <div className="bg-gray-50 border border-dashed p-12 text-center rounded-xl text-gray-500">
            <User size={48} className="mx-auto text-gray-300 mb-4"/>
            <p>No matches found in Clients, Vehicles, or Devices.</p>
         </div>
      )}

      <div className="space-y-8">
        
        {/* 1. CLIENT RESULTS */}
        {clients.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="flex items-center gap-2 font-bold text-gray-700 mb-4 border-b pb-2">
              <User size={20} className="text-blue-500"/> Clients Found ({clients.length})
            </h3>
            <div className="grid gap-3">
              {clients.map(c => (
                <Link 
                  href={`/dashboard/clients/${c.id}`} 
                  key={c.id} 
                  className="flex flex-col md:flex-row justify-between items-center p-4 hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-lg transition group"
                >
                  <div>
                    <p className="font-bold text-lg text-gray-900 group-hover:text-blue-700">{c.fullName}</p>
                    <div className="flex gap-4 text-sm text-gray-500 mt-1">
                      <span>{c.phoneNumber}</span>
                      {c.email && <span className="flex items-center gap-1"><Mail size={12}/> {c.email}</span>}
                      {c.address && <span className="flex items-center gap-1"><MapPin size={12}/> {c.address}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 md:mt-0">
                    <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded-full text-gray-600">
                      {c.vehicles.length} Vehicle(s)
                    </span>
                    <ArrowRight size={16} className="text-gray-300 group-hover:text-blue-500"/>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 2. VEHICLE RESULTS */}
        {vehicles.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="flex items-center gap-2 font-bold text-gray-700 mb-4 border-b pb-2">
              <Car size={20} className="text-orange-500"/> Vehicles Found ({vehicles.length})
            </h3>
            <div className="grid gap-3">
              {vehicles.map(v => {
                const latestJob = v.jobs[0];
                const moduleInfo = getJobModuleInfo(latestJob, v.clientId);

                return (
                  <Link 
                    href={moduleInfo.url}
                    key={v.id} 
                    className="flex flex-col md:flex-row justify-between items-center p-4 hover:bg-orange-50 border border-transparent hover:border-orange-100 rounded-lg transition group"
                  >
                    <div>
                      <p className="font-bold text-lg text-gray-900">
                        {v.name} {v.year} 
                        <span className="ml-2 font-mono text-sm bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                          {v.plateNumber || "NO PLATE"}
                        </span>
                      </p>
                      <p className="text-sm text-gray-500 mt-1">Owner: <span className="font-medium">{v.client.fullName}</span></p>
                    </div>
                    
                    <div className="flex items-center gap-3 mt-2 md:mt-0">
                      <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 ${moduleInfo.color}`}>
                         <span className="w-2 h-2 rounded-full bg-current opacity-50"></span>
                         {moduleInfo.name}
                      </div>
                      <ArrowRight size={16} className="text-gray-300 group-hover:text-orange-500"/>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* 3. DEVICE RESULTS */}
        {devices.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="flex items-center gap-2 font-bold text-gray-700 mb-4 border-b pb-2">
              <Smartphone size={20} className="text-purple-500"/> Devices Found ({devices.length})
            </h3>
            <div className="grid gap-3">
              {devices.map(d => {
                 const job = d.job;
                 // If device is attached to a job, go to that job's module. If not, just show as stock (no link or link to inventory).
                 const moduleInfo = job ? getJobModuleInfo(job, job.vehicle.clientId) : null;

                 return (
                  <div key={d.id} className="relative">
                    {/* Wrap in Link only if it has a job, otherwise simple div */}
                    {moduleInfo ? (
                      <Link href={moduleInfo.url} className="flex flex-col md:flex-row justify-between items-center p-4 hover:bg-purple-50 border border-transparent hover:border-purple-100 rounded-lg transition group">
                        <DeviceContent d={d} />
                        <div className={`mt-2 md:mt-0 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 ${moduleInfo.color}`}>
                           <span className="w-2 h-2 rounded-full bg-current opacity-50"></span>
                           Go to {moduleInfo.name}
                        </div>
                      </Link>
                    ) : (
                      <div className="flex flex-col md:flex-row justify-between items-center p-4 bg-gray-50 border border-gray-100 rounded-lg">
                        <DeviceContent d={d} />
                        <span className="mt-2 md:mt-0 text-xs bg-gray-200 text-gray-500 px-2 py-1 rounded font-bold">
                          In Stock (Unassigned)
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// Helper Component for consistent Device display
function DeviceContent({ d }: { d: any }) {
  return (
    <div>
      <div className="flex items-center gap-4">
        <p className="font-mono font-bold text-gray-800 flex items-center gap-1">
          <Hash size={14} className="text-gray-400"/> {d.imei}
        </p>
        <span className="text-gray-300">|</span>
        <p className="font-mono text-sm text-gray-600 flex items-center gap-1">
          <Smartphone size={14} className="text-gray-400"/> {d.simNumber}
        </p>
      </div>
      {d.job?.vehicle && (
        <p className="text-xs text-gray-400 mt-1">
          Installed on: <span className="font-bold text-gray-600">{d.job.vehicle.name}</span> ({d.job.vehicle.plateNumber})
        </p>
      )}
    </div>
  )
}