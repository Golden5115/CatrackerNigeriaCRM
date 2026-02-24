import { verifySession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import Link from "next/link";
import { 
  Phone, Car, Plus, Clock, Calendar, Pencil, Hash 
} from "lucide-react";
import LeadActionMenu from "@/components/LeadActionMenu";
import SortControl from "@/components/SortControl"; 
import DeleteClientButton from "@/components/DeleteClientButton";

export const dynamic = 'force-dynamic';

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const session = await verifySession() 
  const userId = typeof session?.userId === 'string' ? session.userId : "";
  const userRole = typeof session?.role === 'string' ? session.role : undefined;

  const params = await searchParams;
  const sort = (params.sort as string) || 'date_desc';

  // Sort Logic
  let orderBy = {};
  switch (sort) {
    case 'name_asc': orderBy = { fullName: 'asc' }; break;
    case 'name_desc': orderBy = { fullName: 'desc' }; break;
    case 'date_asc': orderBy = { createdAt: 'asc' }; break;
    case 'date_desc': default: orderBy = { createdAt: 'desc' }; break;
  }

  // Fetch Logic
  const clients = await prisma.client.findMany({
    where: {
      vehicles: {
        some: {
          jobs: { some: { status: { in: ['NEW_LEAD', 'SCHEDULED', 'IN_PROGRESS'] } } }
        }
      }
    },
    include: { 
      vehicles: { 
        include: { 
          jobs: { include: { installer: true } } 
        } 
      },
      createdBy: true
    },
    orderBy: orderBy
  });

  return (
    <div className="space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Sales Pipeline</h2>
          <p className="text-gray-500">Manage leads, schedule installations, or mark as done.</p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <div className="w-48"><SortControl /></div>
          <Link 
            href="/dashboard/leads/create" 
            className="bg-[#84c47c] hover:bg-[#6aa663] text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-lg transition-transform active:scale-95 whitespace-nowrap"
          >
            <Plus size={20} />
            Add Lead
          </Link>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto pb-24">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Client Details</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Job Ticket (Vehicle)</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Timestamps</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {clients.map((client) => {
                
                // 1. FILTER: Get active vehicles (Including IN_PROGRESS)
                const activeVehicles = client.vehicles.filter(v => 
                  ['NEW_LEAD', 'SCHEDULED', 'IN_PROGRESS'].includes(v.jobs[0]?.status)
                );

                // 2. RENDER ROWS
                return activeVehicles.map((vehicle, index) => {
                  const job = vehicle.jobs[0];
                  
                  const dateAdded = new Date(client.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                  const lastUpdate = new Date(job.updatedAt).toLocaleString('en-GB', { 
                    day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' 
                  });
                  const isMultiVehicle = activeVehicles.length > 1;

                  return (
                    <tr key={vehicle.id} className={`hover:bg-gray-50 transition-colors ${isMultiVehicle ? 'bg-blue-50/10' : ''}`}>
                      
                      {/* COLUMN 1: CLIENT */}
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-full bg-[#e0f2de] flex items-center justify-center text-[#2d4a2a] font-bold shrink-0">
                            {client.fullName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900">{client.fullName}</div>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                              <Phone size={12} /> {client.phoneNumber}
                            </div>
                            {index === 0 && (
                              <div className="text-[10px] text-gray-400 mt-1">
                                Added by: {client.createdBy?.fullName || "System"}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* COLUMN 2: VEHICLE */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                            <Car size={16} className={isMultiVehicle ? "text-blue-500" : "text-gray-400"} /> 
                            <span>{vehicle.name} <span className="text-gray-400 font-normal">({vehicle.year})</span></span>
                          </div>
                          
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <div className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 text-[10px] px-2 py-1 rounded border border-gray-200 font-mono">
                              <Hash size={10} /> {vehicle.plateNumber || "NO PLATE"}
                            </div>
                            
                            {/* --- STATUS BADGES --- */}
                            {job.status === 'NEW_LEAD' && (
                              <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-1 rounded-full font-bold tracking-wider">NEW LEAD</span>
                            )}
                            
                            {/* 👇 CHANGED: Show Installer Name if In Progress */}
                            {job.status === 'IN_PROGRESS' && (
                              <span className="flex items-center gap-1 bg-orange-100 text-orange-800 text-[10px] px-2 py-1 rounded-full font-bold tracking-wider">
                                IN PROGRESS 
                                {job.installer && (
                                  <span className="font-normal opacity-80 border-l border-orange-300 pl-1 ml-1">
                                    by {job.installer.fullName?.split(' ')[0] || "User"}
                                  </span>
                                )}
                              </span>
                            )}

                            {job.status === 'SCHEDULED' && (
                              <span className="bg-purple-100 text-purple-800 text-[10px] px-2 py-1 rounded-full font-bold tracking-wider">SCHEDULED</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* COLUMN 3: TIMESTAMPS */}
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                           <div className="flex items-center gap-2 text-xs text-gray-600">
                              <Calendar size={14} className="text-gray-400" />
                              <span>{dateAdded}</span>
                           </div>
                           <div className="flex items-center gap-2 text-xs text-orange-700 bg-orange-50 px-2 py-1 rounded w-fit">
                              <Clock size={14} />
                              <span>{lastUpdate}</span>
                           </div>
                        </div>
                      </td>

                      {/* COLUMN 4: ACTIONS */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-1">
                          
                          {index === 0 ? (
                            <>
                              <Link 
                                href={`/dashboard/clients/${client.id}/edit`}
                                className="text-gray-400 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-lg transition"
                                title="Edit Client"
                              >
                                <Pencil size={18} />
                              </Link>
                              <DeleteClientButton clientId={client.id} />
                            </>
                          ) : (
                            <div className="w-[72px]"></div>
                          )}
                          
                          <div className="ml-2 border-l pl-2">
                            <LeadActionMenu 
                                jobId={job.id} 
                                currentStatus={job.status} 
                                installerId={job.installerId}
                                currentUserId={userId}
                                vehicleName={vehicle.name}
                                installerName={job.installer?.fullName}
                                currentUserRole={userRole}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
          
          {clients.length === 0 && (
             <div className="p-12 text-center text-gray-500">No active leads in pipeline.</div>
          )}
        </div>
      </div>
    </div>
  );
}