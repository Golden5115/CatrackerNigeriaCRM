import { prisma } from "@/lib/prisma"
import { verifySession } from "@/lib/session"
import { PhoneCall, Calendar, Search } from "lucide-react"
import Link from "next/link"
import PsfCallClient from "./PsfCallClient"
import LocalSearchInput from "@/components/LocalSearchInput"
import Pagination from "@/components/Pagination"

export const dynamic = 'force-dynamic';

export default async function PsfPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  await verifySession();
  
  const params = await searchParams;
  const q = typeof params.q === 'string' ? params.q.toLowerCase() : '';
  const pageNumber = Number(params.page) || 1;
  const pageSize = 50;
  
  // Default to current YYYY-MM
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const selectedMonth = typeof params.month === 'string' ? params.month : defaultMonth;

  const whereCondition: any = {
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

  const totalClients = await prisma.client.count({ where: whereCondition });
  const totalPages = Math.ceil(totalClients / pageSize);

  // Find clients that have at least one PAID active job
  const clients = await prisma.client.findMany({
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
             <PhoneCall className="text-brand-600" /> Post Service Follow-up (PSF)
           </h2>
           <p className="text-sm text-gray-500">Monthly check-in calls for clients with active installations.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="w-full sm:w-1/2">
          <LocalSearchInput placeholder="Search client name or phone..." />
        </div>
        
        <form className="flex items-center gap-3 w-full sm:w-auto">
          {q && <input type="hidden" name="q" value={q} />}
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border rounded-lg">
            <Calendar size={18} className="text-gray-500" />
            <input 
              type="month" 
              name="month" 
              defaultValue={selectedMonth} 
              className="bg-transparent outline-none text-sm font-medium text-gray-700"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-black text-white text-sm font-bold rounded-lg hover:bg-gray-800 transition">
            Go
          </button>
        </form>
      </div>

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

                const activeJobsCount = client.vehicles.reduce((acc, v) => acc + v.jobs.length, 0);

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
                          psfCalls: client.psfCalls 
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
                    No eligible clients found for PSF calls.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <Pagination currentPage={pageNumber} totalPages={totalPages} />
      )}
    </div>
  );
}
