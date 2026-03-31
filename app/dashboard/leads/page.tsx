import { verifySession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import Link from "next/link";
import { Suspense } from "react";
import { 
  Phone, Car, Plus, Clock, Calendar, Pencil, Hash, Wrench, 
  AlertCircle, XCircle, Loader2
} from "lucide-react";
import LeadActionMenu from "@/components/LeadActionMenu";
import SortControl from "@/components/SortControl"; 
import DeleteClientButton from "@/components/DeleteClientButton";
import LocalSearchInput from "@/components/LocalSearchInput";

export const dynamic = 'force-dynamic';

// ==========================================
// 1. THE DATA COMPONENT (Loads in background)
// ==========================================
async function LeadsTable({ 
  sort, query, userId, userRole, canEdit, canDelete 
}: { 
  sort: string, query: string, userId: string, userRole?: string, canEdit: boolean, canDelete: boolean 
}) {
  
  // Sort Logic
  let orderBy = {};
  switch (sort) {
    case 'name_asc': orderBy = { fullName: 'asc' }; break;
    case 'name_desc': orderBy = { fullName: 'desc' }; break;
    case 'date_asc': orderBy = { createdAt: 'asc' }; break;
    case 'date_desc': default: orderBy = { createdAt: 'desc' }; break;
  }

  // Fetch Logic (Now includes Search Query)
  const clients = await prisma.client.findMany({
    where: {
      ...(query ? {
        OR: [
          { fullName: { contains: query, mode: 'insensitive' } },
          { phoneNumber: { contains: query } },
          { vehicles: { some: { plateNumber: { contains: query, mode: 'insensitive' } } } }
        ]
      } : {}),
      vehicles: {
        some: {
          jobs: { some: { status: { in: ['NEW_LEAD', 'SCHEDULED', 'IN_PROGRESS', 'LEAD_LOST'] } } }
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
              
              const activeVehicles = client.vehicles.filter(v => 
                ['NEW_LEAD', 'SCHEDULED', 'IN_PROGRESS', 'LEAD_LOST'].includes(v.jobs[0]?.status)
              );

              return activeVehicles.map((vehicle, index) => {
                const job = vehicle.jobs[0];
                const dateAdded = new Date(client.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                const lastUpdate = new Date(job.updatedAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' });
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

                    {/* COLUMN 2: VEHICLE & JOB TYPE */}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {job.jobType !== 'NEW_INSTALL' && (
                          <div className="mb-2">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded tracking-wider uppercase ${
                              job.jobType === 'MAINTENANCE' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                              job.jobType === 'DEVICE_REPLACEMENT' ? 'bg-red-100 text-red-700 border border-red-200' :
                              job.jobType === 'SIM_REPLACEMENT' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                              'bg-blue-100 text-blue-700 border border-blue-200'
                            }`}>
                              {job.jobType.replace('_', ' ')}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                          <Car size={16} className={isMultiVehicle ? "text-blue-500" : "text-gray-400"} /> 
                          <span>{vehicle.name} <span className="text-gray-400 font-normal">({vehicle.year})</span></span>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <div className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 text-[10px] px-2 py-1 rounded border border-gray-200 font-mono">
                            <Hash size={10} /> {vehicle.plateNumber || "NO PLATE"}
                          </div>
                          
                          {job.status === 'NEW_LEAD' && <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-1 rounded-full font-bold tracking-wider">NEW LEAD</span>}
                          {job.status === 'LEAD_LOST' && <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-1 rounded-full font-bold tracking-wider flex items-center gap-1"><XCircle size={10} /> LOST LEAD</span>}
                          {job.status === 'IN_PROGRESS' && (
                            <span className="flex items-center gap-1 bg-orange-100 text-orange-800 text-[10px] px-2 py-1 rounded-full font-bold tracking-wider">
                              IN PROGRESS 
                              {(job.installerName || job.installer) && (
                                <span className="font-normal opacity-80 border-l border-orange-300 pl-1 ml-1">
                                  by {job.installerName || job.installer?.fullName?.split(' ')[0] || "User"}
                                </span>
                              )}
                            </span>
                          )}
                          {job.status === 'SCHEDULED' && <span className="bg-purple-100 text-purple-800 text-[10px] px-2 py-1 rounded-full font-bold tracking-wider">SCHEDULED</span>}
                        </div>

                        {job.supportNotes && (
                          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800 shadow-sm max-w-sm">
                            <span className="font-bold block mb-1 flex items-center gap-1"><AlertCircle size={12} /> Reported Issue:</span>
                            {job.supportNotes}
                          </div>
                        )}

                        {job.status === 'LEAD_LOST' && job.lostReason && (
                          <div className="mt-3 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 shadow-sm max-w-sm">
                            <span className="font-bold block mb-1">Reason Lost:</span>
                            {job.lostReason}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* COLUMN 3: TIMESTAMPS */}
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                         <div className="flex items-center gap-2 text-xs text-gray-600"><Calendar size={14} className="text-gray-400" /><span>{dateAdded}</span></div>
                         <div className="flex items-center gap-2 text-xs text-orange-700 bg-orange-50 px-2 py-1 rounded w-fit"><Clock size={14} /><span>{lastUpdate}</span></div>
                      </div>
                    </td>

                    {/* COLUMN 4: ACTIONS */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-1">
                        {index === 0 ? (
                          <>
                            {canEdit && <Link href={`/dashboard/clients/${client.id}/edit`} className="text-gray-400 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-lg transition" title="Edit Client"><Pencil size={18} /></Link>}
                            {canDelete && <DeleteClientButton clientId={client.id} />}
                          </>
                        ) : (<div className="w-[72px]"></div>)}
                        
                        <div className="ml-2 border-l pl-2">
                          <LeadActionMenu 
                            jobId={job.id} 
                            currentStatus={job.status} 
                            jobType={job.jobType}
                            vehicleId={vehicle.id}
                            installerId={job.installerId}
                            currentUserId={userId}
                            vehicleName={vehicle.name}
                            installerName={job.installerName}
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
        
        {clients.length === 0 && <div className="p-12 text-center text-gray-500">No leads found matching your search.</div>}
      </div>
    </div>
  );
}

// ==========================================
// 2. THE PAGE SHELL (Loads Instantly)
// ==========================================
export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;
  const sort = (params.sort as string) || 'date_desc';
  const query = (params.query as string) || '';

  const session = await verifySession() 
  const userId = typeof session?.userId === 'string' ? session.userId : "";
  const userRole = typeof session?.role === 'string' ? session.role : undefined;

  const currentUser = await prisma.user.findUnique({ where: { id: userId } });
  const isAdmin = currentUser?.role === 'ADMIN';
  const canEdit = isAdmin || currentUser?.canEdit === true;
  const canDelete = isAdmin || currentUser?.canDelete === true;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Sales & Support Pipeline</h2>
          <p className="text-gray-500">Manage leads, schedule installations, and log support tickets.</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {canEdit && (
            <>
              <Link href="/dashboard/leads/support" className="bg-orange-50 text-orange-600 border border-orange-200 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-orange-100 transition shadow-sm">
                <Wrench size={16} /> Log Support Ticket
              </Link>
              <Link href="/dashboard/leads/create" className="bg-[#84c47c] text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-[#6aa663] transition shadow-sm">
                <Plus size={16} /> Add New Lead
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-end items-end md:items-center gap-3">
        <LocalSearchInput placeholder="Search name, phone, plate..." />
        <SortControl currentSort={sort} />
      </div>

      <Suspense fallback={
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-24 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="animate-spin text-[#84c47c]" size={40} />
          <p className="text-gray-400 font-medium animate-pulse">Loading sales pipeline...</p>
        </div>
      }>
        <LeadsTable sort={sort} query={query} userId={userId} userRole={userRole} canEdit={canEdit} canDelete={canDelete} />
      </Suspense>

    </div>
  );
}