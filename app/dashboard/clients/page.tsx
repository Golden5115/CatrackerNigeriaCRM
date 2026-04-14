import { prisma } from "@/lib/prisma"
import Link from "next/link";
import React, { Suspense } from "react";
import { 
  Car, AlertCircle, CheckCircle, MailWarning, 
  Wrench, Pencil, Calendar, XCircle, Loader2 // 👈 Added Calendar icon
} from "lucide-react";
import { verifySession } from "@/lib/session"
import DeleteClientButton from "@/components/DeleteClientButton";
import SortControl from "@/components/SortControl"; 
import LocalSearchInput from "@/components/LocalSearchInput";
import Pagination from "@/components/Pagination";
import ImportCSVButton from "@/components/ImportCSVButton";

export const dynamic = 'force-dynamic';

async function ClientsTable({ 
  sort, query, page, canEdit, canDelete 
}: { 
  sort: string, query: string, page: number, canEdit: boolean, canDelete: boolean 
}) {
  const pageSize = 40;

  let orderBy = {};
  switch (sort) {
    case 'name_asc': orderBy = { fullName: 'asc' }; break;
    case 'name_desc': orderBy = { fullName: 'desc' }; break;
    case 'date_asc': orderBy = { createdAt: 'asc' }; break;
    case 'updated_desc': orderBy = { createdAt: 'desc' }; break;
    case 'updated_asc': orderBy = { createdAt: 'asc' }; break;
    case 'pending_payments': orderBy = { createdAt: 'desc' }; break;
    case 'date_desc': default: orderBy = { createdAt: 'desc' }; break;
  }

  const whereClause: any = {
    OR: [
      { vehicles: { some: { jobs: { some: { status: { in: ['PENDING_QC', 'CONFIGURED', 'ACTIVE', 'LEAD_LOST'] } } } } } },
      { importBatchId: { not: null } }
    ]
  };

  const andConditions: any[] = [];

  if (query) {
    andConditions.push({
      OR: [
        { fullName: { contains: query, mode: 'insensitive' } },
        { phoneNumber: { contains: query } },
        { vehicles: { some: { plateNumber: { contains: query, mode: 'insensitive' } } } }
      ]
    });
  }

  if (sort === 'pending_payments') {
    andConditions.push({
      vehicles: { some: { jobs: { some: { status: 'ACTIVE', paymentStatus: { not: 'PAID' } } } } }
    });
  }

  if (andConditions.length > 0) {
    whereClause.AND = andConditions;
  }

  const [totalRecords, clients] = await Promise.all([
    prisma.client.count({ where: whereClause }),
    prisma.client.findMany({
      where: whereClause,
      include: { vehicles: { include: { jobs: true } } },
      orderBy: orderBy,
      skip: (page - 1) * pageSize, take: pageSize, 
    })
  ]);

  const totalPages = Math.ceil(totalRecords / pageSize);

  return (
    <div className="bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col">
      <div className="flex-1">
        <table className="min-w-full divide-y divide-gray-200">
          
          <thead className="bg-gray-50 hidden md:table-header-group">
            <tr>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase">Client Info</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase">Fleet Status</th>
              {/* 🟢 FIXED: Changed header to Date Added */}
              <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase">Date Added</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase">Financials</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase">Alerts</th>
              <th className="px-4 py-3 text-right text-[11px] font-bold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 block md:table-row-group">
            {clients.map((client) => {
              const totalPaid = client.vehicles.reduce((sum, v) => {
                return sum + v.jobs.reduce((jobSum, j) => jobSum + (j.amountPaid ? Number(j.amountPaid) : 0), 0);
              }, 0);
              
              // 🟢 FIXED: Extract the exact date the client was created in the system
              const dateAdded = new Date(client.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

              const unpaidCount = client.vehicles.reduce((count, v) => count + v.jobs.filter(j => j.status === 'ACTIVE' && j.paymentStatus !== 'PAID').length, 0);
              const techQueueCount = client.vehicles.reduce((count, v) => count + v.jobs.filter(j => j.status === 'PENDING_QC').length, 0);
              const onboardingCount = client.vehicles.reduce((count, v) => count + v.jobs.filter(j => j.status === 'CONFIGURED' && !j.onboarded).length, 0);
              const isAllClear = unpaidCount === 0 && techQueueCount === 0 && onboardingCount === 0;
              const isLostProspect = client.vehicles.every(v => v.jobs.every(j => j.status === 'LEAD_LOST'));

              return (
                <React.Fragment key={client.id}>
                  
                  {/* MOBILE VIEW */}
                  <tr className="md:hidden block p-3 border-b border-gray-50">
                    <td className="block">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-bold text-gray-900 text-sm">{client.fullName}</div>
                          <div className="text-[11px] text-gray-500 font-medium mt-0.5">{client.phoneNumber}</div>
                          {/* Added Date to Mobile View */}
                          <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1"><Calendar size={10}/> Added: {dateAdded}</div>
                        </div>
                        <div className="flex items-center gap-1">
                          {canEdit && <Link href={`/dashboard/clients/${client.id}/edit`} className="text-gray-400 hover:text-blue-600 p-1.5"><Pencil size={14} /></Link>}
                          <Link href={`/dashboard/clients/${client.id}`} className="text-blue-600 font-bold bg-blue-50 px-2.5 py-1 rounded-lg text-xs">View</Link>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-2">
                         <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                           <span className="text-[9px] text-gray-400 font-bold uppercase block mb-1">Fleet Size</span>
                           <div className="text-xs font-bold text-gray-800 flex items-center gap-1"><Car size={12}/> {client.vehicles.length} Vehicles</div>
                         </div>
                         <div className="bg-green-50 p-2 rounded-lg border border-green-100">
                           <span className="text-[9px] text-green-600 font-bold uppercase block mb-1">Total Paid</span>
                           <div className="text-xs font-bold text-green-800">₦{totalPaid.toLocaleString()}</div>
                         </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 items-center">
                        {unpaidCount > 0 && <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase"><AlertCircle size={10} /> {unpaidCount} Due</span>}
                        {techQueueCount > 0 && <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase"><Wrench size={10} /> {techQueueCount} In Tech</span>}
                        {onboardingCount > 0 && <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase"><MailWarning size={10} /> Login</span>}
                        {isAllClear && <span className="inline-flex items-center gap-1 text-green-600 text-[9px] font-bold uppercase px-1"><CheckCircle size={10} /> All Clear</span>}
                      </div>
                    </td>
                  </tr>

                  {/* DESKTOP VIEW */}
                  <tr className="hidden md:table-row hover:bg-gray-50 group transition">
                    <td className="px-4 py-3">
                      <div className="font-bold text-sm text-gray-900">{client.fullName}</div>
                      <div className="text-[11px] text-gray-500">{client.phoneNumber}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[11px] font-bold"><Car size={10} /> {client.vehicles.length} Vehicle(s)</span>
                      <div className="text-[10px] text-gray-400 mt-1 truncate max-w-[150px]">{client.vehicles.map(v => v.name).join(", ")}</div>
                    </td>
                    <td className="px-4 py-3">
                      {/* 🟢 FIXED: Display the Date Added clearly */}
                      <div className="text-[11px] px-1.5 py-0.5 rounded border w-fit font-medium flex items-center gap-1 bg-gray-50 text-gray-600 border-gray-200">
                        <Calendar size={10} /> {dateAdded}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col"><span className="text-xs font-bold text-green-700">₦{totalPaid.toLocaleString()}</span><span className="text-[9px] text-gray-400 uppercase tracking-wide">Total Paid</span></div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1 items-start">
                        {unpaidCount > 0 && <Link href="/dashboard/payments" className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase"><AlertCircle size={10} /> {unpaidCount} Due</Link>}
                        {techQueueCount > 0 && <Link href="/dashboard/tech" className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase"><Wrench size={10} /> {techQueueCount} In Tech</Link>}
                        {onboardingCount > 0 && <Link href="/dashboard/activation" className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase"><MailWarning size={10} /> Needs Login</Link>}
                        {isAllClear && <span className="inline-flex items-center gap-1 text-green-600 text-[10px] font-medium"><CheckCircle size={10} /> All Clear</span>}
                        {isLostProspect && <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase border"><XCircle size={8} /> Lost Prospect</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end items-center gap-1">
                        {canEdit && <Link href={`/dashboard/clients/${client.id}/edit`} className="text-gray-400 hover:text-blue-600 p-1.5 hover:bg-blue-50 rounded-lg"><Pencil size={14} /></Link>}
                        {canDelete && <DeleteClientButton clientId={client.id} />}
                        <Link href={`/dashboard/clients/${client.id}`} className="text-blue-600 hover:text-blue-900 font-bold text-xs border border-blue-200 px-2 py-1 rounded hover:bg-blue-50 ml-1">View</Link>
                      </div>
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
        {clients.length === 0 && <div className="p-12 text-center text-sm text-gray-500">No clients found matching your search.</div>}
      </div>
      
      <Pagination totalPages={totalPages} currentPage={page} />
    </div>
  );
}

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = await searchParams;
  const sort = (params.sort as string) || 'date_desc';
  const query = (params.query as string) || '';
  const page = Number(params.page) || 1; 

  const session = await verifySession() 
  const userId = typeof session?.userId === 'string' ? session.userId : "";
  const currentUser = await prisma.user.findUnique({ where: { id: userId } });
  const isAdmin = currentUser?.role === 'ADMIN';
  const canEdit = isAdmin || currentUser?.canEdit === true;
  const canDelete = isAdmin || currentUser?.canDelete === true;

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-gray-800">Client Database</h2>
           <p className="text-sm text-gray-500">Manage active clients, monitor financials and fleet status.</p>
        </div>
        
        <div className="flex flex-col w-full sm:w-auto sm:flex-row gap-2">
          {isAdmin && (
            <ImportCSVButton />
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-gray-100">
        <div className="flex-1">
          <LocalSearchInput placeholder="Search clients or plates..." />
        </div>
        <div className="w-full sm:w-48 border-t sm:border-t-0 sm:border-l border-gray-100 pt-2 sm:pt-0 sm:pl-2">
          <SortControl currentSort={sort} />
        </div>
      </div>

      <Suspense key={query + sort + page} fallback={
        <div className="bg-white border rounded-xl shadow-sm p-24 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="animate-spin text-[#84c47c]" size={32} />
          <p className="text-sm text-gray-400 font-medium animate-pulse">Loading database page {page}...</p>
        </div>
      }>
        <ClientsTable sort={sort} query={query} page={page} canEdit={canEdit} canDelete={canDelete} />
      </Suspense>

    </div>
  );
}