import { prisma } from "@/lib/prisma"
import Link from "next/link";
import React, { Suspense } from "react";
import { Car, Hash, User, Cpu, Loader2, CheckCircle, Wrench, Smartphone } from "lucide-react";
import { verifySession } from "@/lib/session"
import LocalSearchInput from "@/components/LocalSearchInput";
import SortControl from "@/components/SortControl"; 
import Pagination from "@/components/Pagination";
import DateEditor from "@/components/DateEditor"; // 👈 NEW

export const dynamic = 'force-dynamic';

async function VehiclesTable({ sort, query, page }: { sort: string, query: string, page: number }) {
  const pageSize = 40;

  const whereClause: any = {
    status: { in: ['PENDING_QC', 'CONFIGURED', 'ACTIVE'] }
  };

  if (query) {
    whereClause.OR = [
      { vehicle: { name: { contains: query, mode: 'insensitive' } } },
      { vehicle: { plateNumber: { contains: query, mode: 'insensitive' } } },
      { vehicle: { client: { fullName: { contains: query, mode: 'insensitive' } } } },
      { device: { imei: { contains: query } } }
    ];
  }

  let orderBy: any = [];
  switch (sort) {
    case 'name_asc': orderBy = [{ vehicle: { name: 'asc' } }]; break;
    case 'name_desc': orderBy = [{ vehicle: { name: 'desc' } }]; break;
    case 'date_asc': orderBy = [{ installDate: { sort: 'asc', nulls: 'last' } }]; break;
    case 'date_desc': default: orderBy = [{ installDate: { sort: 'desc', nulls: 'last' } }]; break;
  }

  const [totalRecords, jobs] = await Promise.all([
    prisma.job.count({ where: whereClause }),
    prisma.job.findMany({
      where: whereClause,
      include: { 
        vehicle: { include: { client: true } },
        device: true, 
        simCard: true 
      },
      orderBy: orderBy,
      skip: (page - 1) * pageSize, 
      take: pageSize, 
    })
  ]);

  const totalPages = Math.ceil(totalRecords / pageSize);

  return (
    <div className="bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col">
      <div className="flex-1 overflow-x-auto min-h-[400px]">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase whitespace-nowrap">Vehicle Details</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase whitespace-nowrap">Client Owner</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase whitespace-nowrap">Installed Hardware</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase whitespace-nowrap">Job Status</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase whitespace-nowrap w-[150px]">Install Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {jobs.map((job) => {
              const vehicle = job.vehicle;
              const displayDate = job.installDate ? new Date(job.installDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Pending';

              return (
                <tr key={job.id} className="hover:bg-gray-50 transition group">
                  <td className="px-4 py-3">
                    <div className="font-bold text-sm text-gray-900 flex items-center gap-1.5"><Car size={14} className="text-gray-400" /> {vehicle.name} {vehicle.year && `(${vehicle.year})`}</div>
                    <div className="text-[11px] text-gray-500 font-mono mt-1 flex items-center gap-1"><Hash size={10}/> {vehicle.plateNumber || "NO PLATE"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/clients/${vehicle.clientId}`} className="font-bold text-xs text-blue-600 hover:underline flex items-center gap-1.5">
                      <User size={12}/> {vehicle.client.fullName}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {job.device ? (
                      <div className="space-y-1">
                        <div className="text-[11px] font-mono font-bold text-gray-800 flex items-center gap-1"><Cpu size={10} className="text-gray-400"/> IMEI: {job.device.imei}</div>
                        {job.simCard && <div className="text-[10px] text-gray-500 flex items-center gap-1">SIM: {job.simCard.simNumber}</div>}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">No hardware assigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {job.status === 'ACTIVE' && <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase"><CheckCircle size={10} /> Active Tracker</span>}
                    {job.status === 'PENDING_QC' && <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase"><Wrench size={10} /> Tech Support</span>}
                    {job.status === 'CONFIGURED' && <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase"><Smartphone size={10} /> Needs Login</span>}
                  </td>
                  <td className="px-4 py-3">
                    {/* 🟢 NEW: Integrated the DateEditor Component! */}
                    <DateEditor jobId={job.id} currentDisplayDate={displayDate} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {jobs.length === 0 && <div className="p-12 text-center text-sm text-gray-500">No active vehicles found in the fleet.</div>}
      </div>
      <Pagination totalPages={totalPages} currentPage={page} />
    </div>
  );
}

export default async function VehiclesPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = await searchParams;
  const sort = (params.sort as string) || 'date_desc';
  const query = (params.query as string) || '';
  const page = Number(params.page) || 1; 

  await verifySession();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-gray-800">Fleet & Jobs Database</h2>
           <p className="text-sm text-gray-500">A flat database of every active vehicle, its assigned hardware, and job status.</p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-gray-100">
        <div className="flex-1">
          <LocalSearchInput placeholder="Search vehicle name, plate, IMEI, or client..." />
        </div>
        <div className="w-full sm:w-48 border-t sm:border-t-0 sm:border-l border-gray-100 pt-2 sm:pt-0 sm:pl-2">
          <SortControl currentSort={sort} />
        </div>
      </div>
      <Suspense key={query + sort + page} fallback={
        <div className="bg-white border rounded-xl shadow-sm p-24 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="animate-spin text-[#84c47c]" size={32} />
          <p className="text-sm text-gray-400 font-medium animate-pulse">Loading fleet database...</p>
        </div>
      }>
        <VehiclesTable sort={sort} query={query} page={page} />
      </Suspense>
    </div>
  );
}