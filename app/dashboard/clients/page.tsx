import { prisma } from "@/lib/prisma"
import Link from "next/link";
import { 
  Car, AlertCircle, CheckCircle, MailWarning, 
  Wrench, Pencil, Trash2, Smartphone 
} from "lucide-react";
import DeleteClientButton from "@/components/DeleteClientButton";
import SortControl from "@/components/SortControl"; 



export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;
  const sort = (params.sort as string) || 'date_desc';

  // 1. Determine Sorting Logic
  let orderBy = {};
  switch (sort) {
    case 'name_asc': orderBy = { fullName: 'asc' }; break;
    case 'name_desc': orderBy = { fullName: 'desc' }; break;
    case 'date_asc': orderBy = { createdAt: 'asc' }; break;
    case 'date_desc': default: orderBy = { createdAt: 'desc' }; break;
  }

  // 2. Fetch Clients
  const clients = await prisma.client.findMany({
    where: {
      vehicles: {
        some: {
          jobs: {
            some: {
              status: { 
                in: ['INSTALLED', 'CONFIGURED', 'ACTIVE', 'PAYMENT_PENDING', 'COMPLETED'] 
              }
            }
          }
        }
      }
    },
    include: {
      vehicles: {
        include: { jobs: true }
      }
    },
    orderBy: orderBy
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-3xl font-bold text-gray-800">Client Database</h2>
           <p className="text-gray-500">Manage active clients, monitor financials and fleet status.</p>
        </div>
        <div className="w-full md:w-48">
          <SortControl />
        </div>
      </div>

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Client Info</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Fleet Status</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Config Date</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Financials</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Alerts</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {clients.map((client) => {
                
                // --- FINANCIAL CALCULATION ---
                const totalPaid = client.vehicles.reduce((sum, v) => {
                  // Ensure we treat amountPaid as a Number
                  return sum + (v.jobs[0]?.amountPaid ? Number(v.jobs[0].amountPaid) : 0);
                }, 0);

                // --- CONFIG DATE LOGIC ---
                const configDates = client.vehicles
                  .map(v => v.jobs[0]?.configurationDate)
                  .filter(d => d != null)
                  .sort((a,b) => new Date(b!).getTime() - new Date(a!).getTime());
                
                const lastConfigDate = configDates.length > 0 
                  ? new Date(configDates[0]!).toLocaleDateString('en-GB') 
                  : 'Pending';

                // --- STATUS LOGIC ---
                const unpaidCount = client.vehicles.filter(v => 
                  v.jobs.some(j => j.status === 'ACTIVE' && j.paymentStatus !== 'PAID')
                ).length;

                const techQueueCount = client.vehicles.filter(v => 
                  v.jobs.some(j => j.status === 'INSTALLED')
                ).length;

                const onboardingCount = client.vehicles.filter(v => 
                  v.jobs.some(j => j.status === 'CONFIGURED' && !j.onboarded)
                ).length;

                const isAllClear = unpaidCount === 0 && techQueueCount === 0 && onboardingCount === 0;

                return (
                  <tr key={client.id} className="hover:bg-gray-50 group transition">
                    
                    {/* 1. Client Info */}
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{client.fullName}</div>
                      <div className="text-xs text-gray-500">{client.phoneNumber}</div>
                    </td>
                    
                    {/* 2. Fleet Info */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold">
                        <Car size={12} /> {client.vehicles.length} Vehicle(s)
                      </span>
                      <div className="text-xs text-gray-400 mt-1 truncate max-w-[150px]">
                        {client.vehicles.map(v => v.name).join(", ")}
                      </div>
                    </td>

                    {/* 3. Configuration Date */}
                    <td className="px-6 py-4">
                      <div className={`text-xs px-2 py-1 rounded border w-fit font-medium flex items-center gap-1 ${lastConfigDate === 'Pending' ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                         <Smartphone size={10} />
                         {lastConfigDate}
                      </div>
                    </td>

                    {/* 4. Financials */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-green-700">
                          ₦{totalPaid.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-gray-400 uppercase tracking-wide">Total Paid</span>
                      </div>
                    </td>

                    {/* 5. Alerts */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 items-start">
                        {unpaidCount > 0 && (
                          <Link href="/dashboard/payments" className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded-full text-[10px] font-bold uppercase hover:bg-red-200">
                            <AlertCircle size={10} /> {unpaidCount} Payment Due
                          </Link>
                        )}
                        {techQueueCount > 0 && (
                          <Link href="/dashboard/tech" className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-[10px] font-bold uppercase hover:bg-orange-200">
                            <Wrench size={10} /> {techQueueCount} In Tech
                          </Link>
                        )}
                        {onboardingCount > 0 && (
                          <Link href="/dashboard/activation" className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-[10px] font-bold uppercase hover:bg-purple-200">
                            <MailWarning size={10} /> {onboardingCount} Needs Login
                          </Link>
                        )}
                        {isAllClear && (
                          <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium">
                            <CheckCircle size={12} /> All Clear
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 6. Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <Link 
                          href={`/dashboard/clients/${client.id}/edit`}
                          className="text-gray-400 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Pencil size={18} />
                        </Link>
                        <DeleteClientButton clientId={client.id} />
                        <Link 
                          href={`/dashboard/clients/${client.id}`}
                          className="text-blue-600 hover:text-blue-900 font-medium text-sm border border-blue-200 px-3 py-1 rounded hover:bg-blue-50 ml-2"
                        >
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {clients.length === 0 && (
             <div className="p-12 text-center text-gray-500">No active clients found.</div>
          )}
        </div>
      </div>
    </div>
  );
}