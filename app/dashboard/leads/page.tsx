import { verifySession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import Link from "next/link";
import React, { Suspense } from "react";
import { 
  Phone, Car, Plus, Clock, Calendar, Pencil, Hash, Wrench, 
  AlertCircle, XCircle, Loader2, User
} from "lucide-react";
import LeadActionMenu from "@/components/LeadActionMenu";
import SortControl from "@/components/SortControl"; 
import DeleteClientButton from "@/components/DeleteClientButton";
import LocalSearchInput from "@/components/LocalSearchInput";
import Pagination from "@/components/Pagination";

export const dynamic = 'force-dynamic';

async function LeadsTable({ 
  sort, query, page, userId, userRole, canEdit, canDelete 
}: { 
  sort: string, query: string, page: number, userId: string, userRole?: string, canEdit: boolean, canDelete: boolean 
}) {
  const pageSize = 40;
  let orderBy = {};
  switch (sort) {
    case 'name_asc': orderBy = { fullName: 'asc' }; break;
    case 'name_desc': orderBy = { fullName: 'desc' }; break;
    case 'date_asc': orderBy = { createdAt: 'asc' }; break;
    case 'date_desc': default: orderBy = { createdAt: 'desc' }; break;
  }

  const whereClause: any = {
    ...(query ? {
      OR: [
        { fullName: { contains: query, mode: 'insensitive' } },
        { phoneNumber: { contains: query } },
        { vehicles: { some: { plateNumber: { contains: query, mode: 'insensitive' } } } }
      ]
    } : {}),
    vehicles: {
      some: {
        jobs: { 
          some: { 
            status: { in: ['NEW_LEAD', 'SCHEDULED', 'IN_PROGRESS', 'LEAD_LOST'] },
            jobType: 'NEW_INSTALL' 
          } 
        }
      }
    }
  };

  const [totalRecords, clients] = await Promise.all([
    prisma.client.count({ where: whereClause }),
    prisma.client.findMany({
      where: whereClause,
      include: { vehicles: { include: { jobs: { include: { installer: true } } } }, createdBy: true },
      orderBy: orderBy,
      skip: (page - 1) * pageSize, take: pageSize,
    })
  ]);

  const totalPages = Math.ceil(totalRecords / pageSize);

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
      <div className="flex-1"> 
        <table className="min-w-full divide-y divide-gray-200">
          
          <thead className="bg-gray-50 hidden md:table-header-group">
            <tr>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Client Details</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Job Ticket (Vehicle)</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Timestamps</th>
              <th className="px-4 py-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          
          <tbody className="divide-y divide-gray-100 bg-white block md:table-row-group">
            {clients.map((client) => {
              const activeVehicles = client.vehicles.filter(v => 
                ['NEW_LEAD', 'SCHEDULED', 'IN_PROGRESS', 'LEAD_LOST'].includes(v.jobs[0]?.status) &&
                v.jobs[0]?.jobType === 'NEW_INSTALL'
              );

              return activeVehicles.map((vehicle, index) => {
                const job = vehicle.jobs[0];
                const dateAdded = new Date(client.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                const lastUpdate = new Date(job.updatedAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' });

                return (
                  <React.Fragment key={vehicle.id}>
                    
                    {/* ========================================== */}
                    {/* 📱 MOBILE CARD VIEW */}
                    {/* ========================================== */}
                    <tr className="md:hidden block p-3 border-b border-gray-50">
                      <td className="block">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-[#e0f2de] flex items-center justify-center text-[#2d4a2a] text-xs font-bold shrink-0">{client.fullName.charAt(0)}</div>
                            <div>
                              <div className="font-bold text-sm text-gray-900">{client.fullName}</div>
                              <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-0.5"><Phone size={10} /> {client.phoneNumber}</div>
                              {index === 0 && (
                                <div className="text-[9px] text-gray-400 mt-0.5 flex items-center gap-1">
                                  <User size={8} /> Added by: <span className="font-medium text-gray-600">{client.createdBy?.fullName || "System"}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
                            {index === 0 && canEdit && <Link href={`/dashboard/clients/${client.id}/edit`} className="text-gray-400 hover:text-blue-600 p-1.5"><Pencil size={14} /></Link>}
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
  clientEmail={client.email} // 👈 Add this line to both!
/>
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100 space-y-1.5 mb-2">
                           <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
                             <Car size={14} className="text-gray-400" /> {vehicle.name} <span className="text-gray-400 font-normal">({vehicle.year})</span>
                           </div>
                           
                           {/* Badges Container */}
                           <div className="flex flex-wrap gap-1.5 items-center">
                             <span className="inline-flex items-center gap-1 bg-white text-gray-600 text-[10px] px-1.5 py-0.5 rounded border border-gray-200 font-mono"><Hash size={10} /> {vehicle.plateNumber || "NO PLATE"}</span>
                             {job.status === 'NEW_LEAD' && <span className="bg-blue-100 text-blue-800 text-[9px] px-1.5 py-0.5 rounded-full font-bold">NEW LEAD</span>}
                             {job.status === 'LEAD_LOST' && <span className="bg-gray-100 text-gray-600 text-[9px] px-1.5 py-0.5 rounded-full font-bold">LOST</span>}
                             
                             {job.status === 'IN_PROGRESS' && (
                               <span className="flex items-center gap-1 bg-orange-100 text-orange-800 text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                                 IN PROGRESS
                                 {(job.installerName || job.installer) && (
                                   <span className="font-normal opacity-80 border-l border-orange-300 pl-1 ml-1">
                                     by {job.installerName || job.installer?.fullName?.split(' ')[0]}
                                   </span>
                                 )}
                               </span>
                             )}
                             
                             {job.status === 'SCHEDULED' && (
                               <span className="bg-purple-100 text-purple-800 text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                                 SCHEDULED {job.scheduledDate ? `(${new Date(job.scheduledDate).toLocaleDateString('en-GB')})` : ''}
                               </span>
                             )}
                           </div>

                           {/* 🟡 RESTORED: Client Pending Reason (Yellow) */}
                           {job.pendingReason && (
                             <div className="mt-2 p-1.5 bg-amber-50 border border-amber-200 rounded-lg text-[10px] text-amber-800 shadow-sm w-full">
                               <span className="font-bold flex items-center gap-1"><AlertCircle size={10} /> Pending Reason:</span>
                               <span className="mt-0.5 block">{job.pendingReason}</span>
                             </div>
                           )}

                           {/* 🔴 RESTORED: Tech Support Rejections (Red) */}
                           {job.supportNotes && (
                             <div className="mt-2 p-1.5 bg-red-50 border border-red-200 rounded-lg text-[10px] text-red-800 shadow-sm w-full">
                               <span className="font-bold flex items-center gap-1"><AlertCircle size={10} /> Note / Issue:</span>
                               <span className="mt-0.5 block font-medium">{job.supportNotes}</span>
                             </div>
                           )}

                        </div>

                        <div className="flex justify-between items-center text-[10px] text-gray-400">
                           <div className="flex items-center gap-1"><Calendar size={10} /> Added: {dateAdded}</div>
                           <div className="flex items-center gap-1 text-orange-600"><Clock size={10} /> Updated: {lastUpdate}</div>
                        </div>
                      </td>
                    </tr>

                    {/* ========================================== */}
                    {/* 💻 DESKTOP TABLE VIEW */}
                    {/* ========================================== */}
                    <tr className="hidden md:table-row hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-[#e0f2de] flex items-center justify-center text-[#2d4a2a] text-xs font-bold shrink-0">{client.fullName.charAt(0)}</div>
                          <div>
                            <div className="font-bold text-sm text-gray-900">{client.fullName}</div>
                            <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-0.5"><Phone size={10} /> {client.phoneNumber}</div>
                            {index === 0 && (
                              <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                                <User size={10} /> Added by: <span className="font-medium text-gray-600">{client.createdBy?.fullName || "System"}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
                            <Car size={14} className="text-gray-400" /> <span>{vehicle.name} <span className="text-gray-400 font-normal">({vehicle.year})</span></span>
                          </div>
                          
                          {/* Badges Container */}
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <div className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 text-[9px] px-1.5 py-0.5 rounded border border-gray-200 font-mono"><Hash size={8} /> {vehicle.plateNumber || "NO PLATE"}</div>
                            {job.status === 'NEW_LEAD' && <span className="bg-blue-100 text-blue-800 text-[9px] px-1.5 py-0.5 rounded-full font-bold tracking-wider">NEW LEAD</span>}
                            {job.status === 'LEAD_LOST' && <span className="bg-gray-100 text-gray-600 text-[9px] px-1.5 py-0.5 rounded-full font-bold tracking-wider flex items-center gap-1"><XCircle size={8} /> LOST LEAD</span>}
                            
                            {job.status === 'IN_PROGRESS' && (
                              <span className="flex items-center gap-1 bg-orange-100 text-orange-800 text-[9px] px-1.5 py-0.5 rounded-full font-bold tracking-wider">
                                IN PROGRESS 
                                {(job.installerName || job.installer) && (
                                  <span className="font-normal opacity-80 border-l border-orange-300 pl-1 ml-1">
                                    by {job.installerName || job.installer?.fullName?.split(' ')[0]}
                                  </span>
                                )}
                              </span>
                            )}
                            
                            {job.status === 'SCHEDULED' && (
                              <span className="bg-purple-100 text-purple-800 text-[9px] px-1.5 py-0.5 rounded-full font-bold tracking-wider">
                                SCHEDULED {job.scheduledDate ? `(${new Date(job.scheduledDate).toLocaleDateString('en-GB')})` : ''}
                              </span>
                            )}
                          </div>

                          {/* 🟡 RESTORED: Client Pending Reason (Yellow) */}
                          {job.pendingReason && (
                            <div className="mt-2 p-1.5 bg-amber-50 border border-amber-200 rounded-lg text-[10px] text-amber-800 shadow-sm w-fit">
                              <span className="font-bold flex items-center gap-1"><AlertCircle size={10} /> Pending Reason:</span>
                              <span className="mt-0.5 block">{job.pendingReason}</span>
                            </div>
                          )}

                          {/* 🔴 RESTORED: Tech Support Rejections (Red) */}
                          {job.supportNotes && (
                            <div className="mt-2 p-1.5 bg-red-50 border border-red-200 rounded-lg text-[10px] text-red-800 shadow-sm w-fit">
                              <span className="font-bold flex items-center gap-1"><AlertCircle size={10} /> Note / Issue:</span>
                              <span className="mt-0.5 block font-medium">{job.supportNotes}</span>
                            </div>
                          )}

                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1.5">
                           <div className="flex items-center gap-1.5 text-[11px] text-gray-600"><Calendar size={12} className="text-gray-400" /><span>{dateAdded}</span></div>
                           <div className="flex items-center gap-1.5 text-[11px] text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded w-fit"><Clock size={12} /><span>{lastUpdate}</span></div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end items-center gap-1">
                          {index === 0 && canEdit && <Link href={`/dashboard/clients/${client.id}/edit`} className="text-gray-400 hover:text-blue-600 p-1.5 hover:bg-blue-50 rounded-lg transition"><Pencil size={14} /></Link>}
                          {index === 0 && canDelete && <DeleteClientButton clientId={client.id} />}
                          <div className="ml-1 border-l pl-1">
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
  clientEmail={client.email} // 👈 Add this line to both!
/>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                );
              });
            })}
          </tbody>
        </table>
        {clients.length === 0 && <div className="p-12 text-center text-sm text-gray-500">No new sales leads found.</div>}
      </div>
      <Pagination totalPages={totalPages} currentPage={page} />
    </div>
  );
}

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = await searchParams;
  const sort = (params.sort as string) || 'date_desc';
  const query = (params.query as string) || '';
  const page = Number(params.page) || 1;

  const session = await verifySession();
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
          <h2 className="text-2xl font-bold text-gray-800">Sales Pipeline</h2>
          <p className="text-sm text-gray-500">Manage new installations and dispatch field techs.</p>
        </div>
        <div className="flex flex-col w-full sm:w-auto sm:flex-row gap-3">
          {canEdit && (
            <Link href="/dashboard/leads/create" className="w-full sm:w-auto justify-center bg-[#84c47c] text-white px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-[#6aa663] transition shadow-sm">
              <Plus size={14} /> Add New Lead
            </Link>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-gray-100">
        <div className="flex-1">
          <LocalSearchInput placeholder="Search new leads..." />
        </div>
        <div className="w-full sm:w-48 border-t sm:border-t-0 sm:border-l border-gray-100 pt-2 sm:pt-0 sm:pl-2">
          <SortControl currentSort={sort} />
        </div>
      </div>

      <Suspense key={query + sort + page} fallback={
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-24 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="animate-spin text-[#84c47c]" size={32} />
          <p className="text-sm text-gray-400 font-medium animate-pulse">Loading sales pipeline...</p>
        </div>
      }>
        <LeadsTable sort={sort} query={query} page={page} userId={userId} userRole={userRole} canEdit={canEdit} canDelete={canDelete} />
      </Suspense>
    </div>
  );
}