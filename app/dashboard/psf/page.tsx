import { prisma } from "@/lib/prisma"
import { verifySession } from "@/lib/session"
import { PhoneCall, Calendar, Search, AlertTriangle, Car, ShieldAlert, WifiOff } from "lucide-react"
import Link from "next/link"
import PsfCallClient from "./PsfCallClient"
import LocalSearchInput from "@/components/LocalSearchInput"
import Pagination from "@/components/Pagination"
import OfflineTabClient from "./components/OfflineTabClient"

export const dynamic = 'force-dynamic';

export default async function PsfPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  await verifySession();
  
  const params = await searchParams;
  const q = typeof params.q === 'string' ? params.q.toLowerCase() : '';
  const pageNumber = Number(params.page) || 1;
  const pageSize = 50;
  const activeTab = (params.tab as string) || 'monthly';
  const statusFilter = (params.status as string) || 'ALL';
  
  // Default to current YYYY-MM
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const selectedMonth = typeof params.month === 'string' ? params.month : defaultMonth;

  // Render variables
  let totalClients = 0;
  let clients: any[] = [];
  let totalPages = 1;
  let expiringJobs: any[] = [];
  let expiredJobs: any[] = [];
  
  const metrics = {
    total: 0,
    pending: 0,
    called: 0,
    noAnswer: 0,
    unreachable: 0
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to start of today

  if (activeTab === 'monthly') {
    const baseWhereCondition: any = {
      isArchived: false,
      vehicles: {
        some: {
          isArchived: false,
          jobs: {
            some: {
              isArchived: false,
              status: { in: ['ACTIVE', 'CONFIGURED'] },
              paymentStatus: 'PAID'
            }
          }
        }
      },
      OR: q ? [
        { fullName: { contains: q, mode: 'insensitive' } },
        { phoneNumber: { contains: q } },
      ] : undefined
    };

    // --- Calculate Metrics ---
    metrics.total = await prisma.client.count({ where: baseWhereCondition });
    
    const callMetrics = await prisma.psfCall.groupBy({
      by: ['status'],
      where: {
        month: selectedMonth,
        client: baseWhereCondition
      },
      _count: true
    });
    
    callMetrics.forEach(m => {
      if (m.status === 'CALLED') metrics.called = m._count;
      if (m.status === 'NO_ANSWER') metrics.noAnswer = m._count;
      if (m.status === 'UNREACHABLE') metrics.unreachable = m._count;
    });
    metrics.pending = metrics.total - (metrics.called + metrics.noAnswer + metrics.unreachable);

    // --- Apply Status Filter ---
    const whereCondition = { ...baseWhereCondition };
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'PENDING') {
        whereCondition.psfCalls = { none: { month: selectedMonth } };
      } else {
        whereCondition.psfCalls = { some: { month: selectedMonth, status: statusFilter } };
      }
    }

    totalClients = await prisma.client.count({ where: whereCondition });
    totalPages = Math.ceil(totalClients / pageSize);

    // Find clients that have at least one PAID active job
    clients = await prisma.client.findMany({
      where: whereCondition,
      skip: (pageNumber - 1) * pageSize,
      take: pageSize,
      include: {
        vehicles: {
          where: { isArchived: false },
          include: {
            jobs: {
              where: { isArchived: false, status: { in: ['ACTIVE', 'CONFIGURED'] } }
            }
          }
        },
        psfCalls: {
          where: { month: selectedMonth }
        }
      },
      orderBy: { fullName: 'asc' }
    });

  } else if (activeTab === 'expiring' || activeTab === 'expired') {
    let dateCondition = {};
    if (activeTab === 'expiring') {
      const twoWeeksFromNow = new Date(today);
      twoWeeksFromNow.setDate(today.getDate() + 14);
      dateCondition = { gte: today, lte: twoWeeksFromNow };
    } else {
      dateCondition = { lt: today };
    }

    const baseWhereCondition: any = {
      isArchived: false,
      status: 'ACTIVE',
      expirationDate: dateCondition
    };

    // --- Calculate Metrics ---
    metrics.total = await prisma.job.count({ where: baseWhereCondition });
    
    // To calculate call status for jobs, we fetch the jobs with their client's psf calls
    // Note: since this is just for metrics, we only select what's necessary
    const jobsWithCalls = await prisma.job.findMany({
      where: baseWhereCondition,
      select: {
        vehicle: {
          select: {
            client: {
              select: {
                psfCalls: {
                  where: { month: selectedMonth }
                }
              }
            }
          }
        }
      }
    });

    jobsWithCalls.forEach(j => {
      const callStatus = j.vehicle.client.psfCalls[0]?.status;
      if (callStatus === 'CALLED') metrics.called++;
      else if (callStatus === 'NO_ANSWER') metrics.noAnswer++;
      else if (callStatus === 'UNREACHABLE') metrics.unreachable++;
      else metrics.pending++;
    });

    // --- Apply Status Filter ---
    const whereCondition = { ...baseWhereCondition };
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'PENDING') {
        whereCondition.vehicle = { client: { psfCalls: { none: { month: selectedMonth } } } };
      } else {
        whereCondition.vehicle = { client: { psfCalls: { some: { month: selectedMonth, status: statusFilter } } } };
      }
    }

    const totalJobs = await prisma.job.count({ where: whereCondition });
    totalPages = Math.ceil(totalJobs / pageSize);

    const data = await prisma.job.findMany({
      where: whereCondition,
      skip: (pageNumber - 1) * pageSize,
      take: pageSize,
      include: {
        vehicle: {
          include: { 
            client: {
              include: {
                psfCalls: {
                  where: { month: selectedMonth }
                }
              }
            } 
          }
        },
        device: true
      },
      orderBy: { expirationDate: activeTab === 'expired' ? 'desc' : 'asc' }
    });

    if (activeTab === 'expiring') expiringJobs = data;
    else expiredJobs = data;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
             <PhoneCall className="text-brand-600" /> Post Service Follow-up (PSF)
           </h2>
           <p className="text-sm text-gray-500">Monthly check-in calls and expiration warnings.</p>
        </div>
      </div>

      <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl w-full max-w-3xl overflow-x-auto">
        <Link 
          href={`/dashboard/psf?tab=monthly&month=${selectedMonth}&status=ALL`}
          className={`flex-1 min-w-[140px] py-2 text-center text-sm font-bold rounded-lg transition ${activeTab === 'monthly' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Monthly Check-ups
        </Link>
        <Link 
          href={`/dashboard/psf?tab=expiring&month=${selectedMonth}&status=ALL`}
          className={`flex-1 min-w-[140px] flex items-center justify-center gap-1.5 py-2 text-center text-sm font-bold rounded-lg transition ${activeTab === 'expiring' ? 'bg-white shadow-sm text-orange-600' : 'text-gray-500 hover:text-orange-500'}`}
        >
          <AlertTriangle size={16} /> Expiring Soon
        </Link>
        <Link 
          href={`/dashboard/psf?tab=expired&month=${selectedMonth}&status=ALL`}
          className={`flex-1 min-w-[140px] flex items-center justify-center gap-1.5 py-2 text-center text-sm font-bold rounded-lg transition ${activeTab === 'expired' ? 'bg-white shadow-sm text-red-600' : 'text-gray-500 hover:text-red-500'}`}
        >
          <ShieldAlert size={16} /> Expired
        </Link>
        <Link 
          href={`/dashboard/psf?tab=offline&month=${selectedMonth}&status=ALL`}
          className={`flex-1 min-w-[140px] flex items-center justify-center gap-1.5 py-2 text-center text-sm font-bold rounded-lg transition ${activeTab === 'offline' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <WifiOff size={16} /> Offline (14-20d)
        </Link>
      </div>

      {activeTab !== 'offline' && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-white border rounded-lg p-3 text-center shadow-sm">
             <div className="text-xs text-gray-500 font-bold uppercase mb-1">Total</div>
             <div className="text-xl font-black text-gray-800">{metrics.total}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-3 text-center shadow-sm">
             <div className="text-xs text-gray-500 font-bold uppercase mb-1">Pending</div>
             <div className="text-xl font-black text-gray-600">{metrics.pending}</div>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-center shadow-sm">
             <div className="text-xs text-green-600 font-bold uppercase mb-1">Called</div>
             <div className="text-xl font-black text-green-700">{metrics.called}</div>
          </div>
          <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 text-center shadow-sm">
             <div className="text-xs text-orange-600 font-bold uppercase mb-1">No Answer</div>
             <div className="text-xl font-black text-orange-700">{metrics.noAnswer}</div>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-center shadow-sm">
             <div className="text-xs text-red-600 font-bold uppercase mb-1">Unreachable</div>
             <div className="text-xl font-black text-red-700">{metrics.unreachable}</div>
          </div>
        </div>
      )}

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="w-full md:w-1/3">
          {activeTab === 'monthly' && <LocalSearchInput placeholder="Search client name or phone..." />}
        </div>
        
        <form className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {q && <input type="hidden" name="q" value={q} />}
          <input type="hidden" name="tab" value={activeTab} />
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-sm font-bold text-gray-500">Status:</span>
            <select 
              name="status" 
              defaultValue={statusFilter}
              className="px-3 py-2 bg-gray-50 border rounded-lg outline-none text-sm font-medium text-gray-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending (Not Called)</option>
              <option value="CALLED">Called (Answered)</option>
              <option value="NO_ANSWER">No Answer</option>
              <option value="UNREACHABLE">Unreachable</option>
            </select>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border rounded-lg w-full sm:w-auto">
            <Calendar size={18} className="text-gray-500" />
            <input 
              type="month" 
              name="month" 
              defaultValue={selectedMonth} 
              className="bg-transparent outline-none text-sm font-medium text-gray-700 w-full"
            />
          </div>
          <button type="submit" className="w-full sm:w-auto px-4 py-2 bg-black text-white text-sm font-bold rounded-lg hover:bg-gray-800 transition">
            Apply Filters
          </button>
        </form>
      </div>

      {activeTab === 'offline' && (
        <OfflineTabClient selectedMonth={selectedMonth} statusFilter={statusFilter} />
      )}

      {activeTab === 'monthly' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Active Vehicles</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Call Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Feedback</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {clients.map(client => {
                  const callRecord = client.psfCalls[0];
                  const status = callRecord?.status || 'PENDING';
                  
                  let statusBadge = "bg-gray-100 text-gray-600";
                  if (status === 'CALLED') statusBadge = "bg-green-100 text-green-700 border-green-200";
                  if (status === 'NO_ANSWER') statusBadge = "bg-orange-100 text-orange-700 border-orange-200";
                  if (status === 'UNREACHABLE') statusBadge = "bg-red-100 text-red-700 border-red-200";

                  const activeJobsCount = client.vehicles.reduce((acc: number, v: any) => acc + v.jobs.length, 0);

                  return (
                    <tr key={client.id} className="hover:bg-gray-50/50 transition">
                      <td className="px-6 py-4">
                        <Link href={`/dashboard/clients/${client.id}`} className="font-semibold text-gray-800 hover:text-brand-600 hover:underline">
                          {client.fullName}
                        </Link>
                        <div className="text-sm text-gray-500">{client.phoneNumber}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center justify-center bg-brand-50 text-brand-700 font-bold px-2 py-0.5 rounded text-xs">
                          {activeJobsCount}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${statusBadge}`}>
                          {status.replace('_', ' ')}
                        </span>
                        {callRecord?.calledAt && (
                          <div className="text-[10px] text-gray-400 mt-1">
                            {new Date(callRecord.calledAt).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 max-w-xs truncate">
                          {callRecord?.feedback || <span className="text-gray-400 italic">No feedback</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <PsfCallClient 
                          client={{ 
                            id: client.id, 
                            fullName: client.fullName, 
                            psfCalls: client.psfCalls || [] 
                          }} 
                          currentMonth={selectedMonth} 
                        />
                      </td>
                    </tr>
                  );
                })}
                {clients.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-gray-500">
                      No matching clients found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(activeTab === 'expiring' || activeTab === 'expired') && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Vehicle</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Expiration Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Call Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Feedback</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(activeTab === 'expiring' ? expiringJobs : expiredJobs).map(job => {
                  const client = job.vehicle.client;
                  const expDate = job.expirationDate ? new Date(job.expirationDate) : null;
                  
                  const daysDiff = expDate ? Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 3600 * 24)) : 0;
                  
                  const callRecord = client.psfCalls[0];
                  const status = callRecord?.status || 'PENDING';
                  
                  let statusBadge = "bg-gray-100 text-gray-600";
                  if (status === 'CALLED') statusBadge = "bg-green-100 text-green-700 border-green-200";
                  if (status === 'NO_ANSWER') statusBadge = "bg-orange-100 text-orange-700 border-orange-200";
                  if (status === 'UNREACHABLE') statusBadge = "bg-red-100 text-red-700 border-red-200";

                  return (
                    <tr key={job.id} className="hover:bg-gray-50/50 transition">
                      <td className="px-6 py-4">
                        <Link href={`/dashboard/clients/${client.id}`} className="font-semibold text-gray-800 hover:text-brand-600 hover:underline">
                          {client.fullName}
                        </Link>
                        <div className="text-sm text-gray-500">{client.phone1 || client.phoneNumber}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-sm text-gray-800 flex items-center gap-1.5"><Car size={14} className="text-gray-400"/> {job.vehicle.name}</div>
                        <div className="text-xs text-gray-500 font-mono mt-1">{job.vehicle.plateNumber} | IMEI: {job.device?.imei}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-gray-900">
                          {expDate ? expDate.toLocaleDateString() : 'Unknown'}
                        </div>
                        <div className={`text-xs font-bold mt-1 ${activeTab === 'expired' ? 'text-red-600' : 'text-orange-500'}`}>
                          {activeTab === 'expired' ? `${Math.abs(daysDiff)} days ago` : `${daysDiff} days left`}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${statusBadge}`}>
                          {status.replace('_', ' ')}
                        </span>
                        {callRecord?.calledAt && (
                          <div className="text-[10px] text-gray-400 mt-1">
                            {new Date(callRecord.calledAt).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 max-w-xs truncate">
                          {callRecord?.feedback || <span className="text-gray-400 italic">No feedback</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <PsfCallClient 
                           client={{ 
                             id: client.id, 
                             fullName: client.fullName, 
                             psfCalls: client.psfCalls || [] 
                           }} 
                           currentMonth={selectedMonth} 
                         />
                      </td>
                    </tr>
                  );
                })}
                {(activeTab === 'expiring' ? expiringJobs : expiredJobs).length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center flex flex-col items-center justify-center text-gray-500">
                      <div className="bg-gray-50 p-4 rounded-full mb-3">
                         <AlertTriangle size={32} className="text-gray-300"/>
                      </div>
                      <span className="font-medium text-gray-600">
                        {activeTab === 'expiring' ? 'No vehicles expiring in the next 14 days match the filter.' : 'No expired vehicles found.'}
                      </span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && activeTab !== 'offline' && (
        <Pagination currentPage={pageNumber} totalPages={totalPages} />
      )}
    </div>
  );
}
