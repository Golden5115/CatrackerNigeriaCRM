import { verifySession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import Link from "next/link";
import { Suspense } from "react";
import { 
  Phone, Car, Clock, Calendar, Hash, Wrench, 
  AlertCircle, CheckCircle, Loader2, CreditCard, Plus
} from "lucide-react";
import LeadActionMenu from "@/components/LeadActionMenu";
import SortControl from "@/components/SortControl"; 
import LocalSearchInput from "@/components/LocalSearchInput";
import Pagination from "@/components/Pagination";

export const dynamic = 'force-dynamic';

// ==========================================
// 1. THE DATA COMPONENT
// ==========================================
async function SupportTable({ 
  sort, query, page, userId, userRole 
}: { 
  sort: string, query: string, page: number, userId: string, userRole?: string 
}) {
  const pageSize = 40;

  let orderBy = {};
  switch (sort) {
    case 'date_asc': orderBy = { createdAt: 'asc' }; break;
    case 'date_desc': default: orderBy = { createdAt: 'desc' }; break;
  }

  // 👈 Fetch directly from JOBS instead of Clients, ignoring NEW_INSTALL
  const whereClause: any = {
    jobType: { not: 'NEW_INSTALL' },
    ...(query ? {
      OR: [
        { vehicle: { client: { fullName: { contains: query, mode: 'insensitive' } } } },
        { vehicle: { client: { phoneNumber: { contains: query } } } },
        { vehicle: { plateNumber: { contains: query, mode: 'insensitive' } } }
      ]
    } : {})
  };

  const [totalRecords, jobs] = await Promise.all([
    prisma.job.count({ where: whereClause }),
    prisma.job.findMany({
      where: whereClause,
      include: { 
        vehicle: { include: { client: true } }, 
        installer: true 
      },
      orderBy: orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    })
  ]);

  const totalPages = Math.ceil(totalRecords / pageSize);

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
      <div className="overflow-x-auto flex-1">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Client & Vehicle</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Support Issue</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Payment & Status</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {jobs.map((job) => {
              const lastUpdate = new Date(job.updatedAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' });
              
              const isResolved = ['ACTIVE', 'CONFIGURED'].includes(job.status);
              const paidAmount = job.amountPaid ? Number(job.amountPaid) : 0;

              return (
                <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                  
                  {/* CLIENT & VEHICLE */}
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900 mb-1">{job.vehicle.client.fullName}</div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-3"><Phone size={12} /> {job.vehicle.client.phoneNumber}</div>
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Car size={14} className="text-gray-400" /> {job.vehicle.name}
                    </div>
                    <div className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 text-[10px] px-2 py-1 rounded border border-gray-200 font-mono mt-1">
                      <Hash size={10} /> {job.vehicle.plateNumber || "NO PLATE"}
                    </div>
                  </td>

                  {/* ISSUE & NOTES */}
                  <td className="px-6 py-4">
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
                    {job.supportNotes && (
                      <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800 shadow-sm max-w-sm">
                        <span className="font-bold block mb-1 flex items-center gap-1"><AlertCircle size={12} /> Issue Details:</span>
                        {job.supportNotes}
                      </div>
                    )}
                  </td>

                  {/* PAYMENT & STATUS */}
                  <td className="px-6 py-4">
                    <div className="space-y-3">
                       {/* Operations Status */}
                       <div>
                         {isResolved ? (
                           <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded w-fit"><CheckCircle size={12}/> Issue Resolved</span>
                         ) : (
                           <span className="flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded w-fit"><Clock size={12}/> {job.status.replace('_', ' ')}</span>
                         )}
                       </div>
                       
                       {/* Financial Status */}
                       <div className="flex items-center gap-2 border-t pt-2 mt-2">
                         <CreditCard size={14} className={job.paymentStatus === 'PAID' ? 'text-green-500' : 'text-gray-400'} />
                         {job.paymentStatus === 'PAID' ? (
                           <div className="text-xs font-bold text-green-700">₦{paidAmount.toLocaleString()} Paid</div>
                         ) : (
                           <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Unpaid / Free</div>
                         )}
                       </div>
                    </div>
                  </td>

                  {/* ACTIONS */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end items-center">
                      <LeadActionMenu 
                        jobId={job.id} 
                        currentStatus={job.status} 
                        jobType={job.jobType} 
                        vehicleId={job.vehicleId} 
                        installerId={job.installerId} 
                        currentUserId={userId} 
                        vehicleName={job.vehicle.name} 
                        installerName={job.installerName} 
                        currentUserRole={userRole} 
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {jobs.length === 0 && <div className="p-12 text-center text-gray-500">No support tickets found.</div>}
      </div>
      <Pagination totalPages={totalPages} currentPage={page} />
    </div>
  );
}

// ==========================================
// 2. THE PAGE SHELL
// ==========================================
export default async function SupportPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Wrench className="text-orange-500" size={32} /> Support Tickets
          </h2>
          <p className="text-gray-500 mt-1">Manage maintenance, device replacements, and hardware issues.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {canEdit && (
            <Link href="/dashboard/leads/support" className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-orange-600 transition shadow-sm">
              <Plus size={16} /> Log New Support Ticket
            </Link>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-end items-end md:items-center gap-3">
        <LocalSearchInput placeholder="Search client or plate..." />
        {/* We reuse SortControl, but Support only sorts by Date, not Name, since it lists Jobs directly */}
        <SortControl currentSort={sort} />
      </div>

      <Suspense key={query + sort + page} fallback={
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-24 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="animate-spin text-orange-500" size={40} />
          <p className="text-gray-400 font-medium animate-pulse">Loading support tickets...</p>
        </div>
      }>
        <SupportTable sort={sort} query={query} page={page} userId={userId} userRole={userRole} />
      </Suspense>
    </div>
  );
}