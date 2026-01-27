import { prisma } from "@/lib/prisma"
import Link from "next/link";
import { 
  Phone, Car, Plus, Mail, Clock, Calendar, Pencil, Hash 
} from "lucide-react";
import LeadActionMenu from "@/components/LeadActionMenu";
import SortControl from "@/components/SortControl"; 
import DeleteClientButton from "@/components/DeleteClientButton";



export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;
  const sort = (params.sort as string) || 'date_desc';

  let orderBy = {};
  switch (sort) {
    case 'name_asc': orderBy = { fullName: 'asc' }; break;
    case 'name_desc': orderBy = { fullName: 'desc' }; break;
    case 'date_asc': orderBy = { createdAt: 'asc' }; break;
    case 'date_desc': default: orderBy = { createdAt: 'desc' }; break;
  }

  const clients = await prisma.client.findMany({
    where: {
      vehicles: {
        some: {
          jobs: { some: { status: { in: ['NEW_LEAD', 'SCHEDULED'] } } }
        }
      }
    },
    include: { 
      vehicles: { include: { jobs: true } },
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
            className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-lg transition-transform active:scale-95 whitespace-nowrap"
          >
            <Plus size={20} />
            Add Lead
          </Link>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
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
                
                // 1. FILTER: Get ALL active vehicles for this client
                const activeVehicles = client.vehicles.filter(v => 
                  ['NEW_LEAD', 'SCHEDULED'].includes(v.jobs[0]?.status)
                );

                // 2. RENDER: Create a row for EACH vehicle
                return activeVehicles.map((vehicle, index) => {
                  const job = vehicle.jobs[0];
                  
                  // Format Dates
                  const dateAdded = new Date(client.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                  const lastUpdate = new Date(job.updatedAt).toLocaleString('en-GB', { 
                    day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' 
                  });

                  // Visual Trick: If a client has multiple cars, connect them visually?
                  // For now, clean separation is safest.
                  const isMultiVehicle = activeVehicles.length > 1;

                  return (
                    <tr key={vehicle.id} className={`hover:bg-gray-50 transition-colors ${isMultiVehicle ? 'bg-blue-50/10' : ''}`}>
                      
                      {/* COLUMN 1: CLIENT (Repeated for clarity) */}
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold shrink-0">
                            {client.fullName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900">{client.fullName}</div>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                              <Phone size={12} /> {client.phoneNumber}
                            </div>
                            {/* Only show added by on the first vehicle to reduce noise */}
                            {index === 0 && (
                              <div className="text-[10px] text-gray-400 mt-1">
                                Added by: {client.createdBy?.fullName || "System"}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* COLUMN 2: VEHICLE (The Specific Job) */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                            <Car size={16} className={isMultiVehicle ? "text-blue-500" : "text-gray-400"} /> 
                            <span>{vehicle.name} <span className="text-gray-400 font-normal">({vehicle.year})</span></span>
                          </div>
                          <div className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded border border-gray-200 font-mono">
                            <Hash size={10} /> {vehicle.plateNumber}
                          </div>
                          {isMultiVehicle && (
                            <div className="text-[10px] text-blue-600 font-medium">
                              Vehicle {index + 1} of {activeVehicles.length}
                            </div>
                          )}
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

                      {/* COLUMN 4: ACTIONS (Specific to this car) */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-1">
                          
                          {/* Only show Edit/Delete on the first row to prevent accidental double deletes of the CLIENT */}
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
                            // Spacer for alignment on secondary rows
                            <div className="w-[72px]"></div>
                          )}
                          
                          {/* ACTION MENU (The Status Dropdown) */}
                          <div className="ml-2 border-l pl-2">
                            <LeadActionMenu 
                              jobId={job.id} 
                              currentStatus={job.status} 
                              scheduleDate={job.installDate} 
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