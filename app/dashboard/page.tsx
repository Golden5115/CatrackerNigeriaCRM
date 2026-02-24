import { prisma } from "@/lib/prisma"
import { 
  Users, Wrench, AlertCircle, Clock, 
  Activity, ArrowRight, Smartphone, Cpu, Wifi 
} from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function DashboardOverview() {
  
  // 1. Run Multiple Queries in Parallel (Now includes Inventory Counts)
  const [
    pipelineLeads,
    techQueue,
    pendingOnboarding,
    pendingPayments,
    devicesInStock,
    simsInStock,
    recentJobs
  ] = await Promise.all([
    // Pipeline: New, Scheduled, or currently being installed
    prisma.job.count({ 
      where: { status: { in: ['NEW_LEAD', 'SCHEDULED', 'IN_PROGRESS'] } } 
    }),
    // Tech Queue: Waiting for QC approval
    prisma.job.count({ 
      where: { status: 'PENDING_QC' } 
    }),
    // Onboarding: Tech approved it, but CSR hasn't generated login yet
    prisma.job.count({ 
      where: { status: 'CONFIGURED', onboarded: false } 
    }),
    // Payments: Active/Configured jobs where money isn't collected
    prisma.job.count({ 
      where: { 
        paymentStatus: { not: 'PAID' }, 
        status: { in: ['PENDING_QC', 'CONFIGURED', 'ACTIVE'] } 
      } 
    }),
    // Trackers in Stock
    prisma.device.count({ 
      where: { status: 'IN_STOCK' } 
    }),
    // SIM Cards in Stock
    prisma.simCard.count({ 
      where: { status: 'IN_STOCK' } 
    }),
    // Recent Activity
    prisma.job.findMany({
      take: 5,
      orderBy: { updatedAt: 'desc' },
      include: {
        vehicle: { include: { client: true } }
      }
    })
  ]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* HEADER */}
      <div>
        <h2 className="text-3xl font-bold text-gray-800">Dashboard Overview</h2>
        <p className="text-gray-500">Welcome back. Here is what's happening today.</p>
      </div>

      {/* STATS CARDS (Now 6 cards in a 3-column grid for perfect balance) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Pipeline Leads */}
        <Link href="/dashboard/leads" className="block group">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between group-hover:border-blue-300 group-hover:shadow-md transition">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Pipeline Leads</p>
              <h3 className="text-3xl font-bold text-gray-900">{pipelineLeads}</h3>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
              <Users size={24} />
            </div>
          </div>
        </Link>

        {/* Card 2: Tech Queue */}
        <Link href="/dashboard/tech" className="block group">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between group-hover:border-orange-300 group-hover:shadow-md transition">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Tech Queue</p>
              <h3 className="text-3xl font-bold text-gray-900">{techQueue}</h3>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition">
              <Wrench size={24} />
            </div>
          </div>
        </Link>

        {/* Card 3: Pending Onboarding */}
        <Link href="/dashboard/activation" className="block group">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between group-hover:border-purple-300 group-hover:shadow-md transition">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Pending Onboarding</p>
              <h3 className="text-3xl font-bold text-gray-900">{pendingOnboarding}</h3>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition">
              <Smartphone size={24} />
            </div>
          </div>
        </Link>

        {/* Card 4: Pending Payments */}
        <Link href="/dashboard/payments" className="block group">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between group-hover:border-red-300 group-hover:shadow-md transition">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Pending Payment</p>
              <h3 className="text-3xl font-bold text-gray-900">{pendingPayments}</h3>
            </div>
            <div className="bg-red-50 p-3 rounded-lg text-red-600 group-hover:bg-red-600 group-hover:text-white transition">
              <AlertCircle size={24} />
            </div>
          </div>
        </Link>

        {/* Card 5: Tracker Hardware Stock */}
        <Link href="/dashboard/inventory" className="block group">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between group-hover:border-indigo-300 group-hover:shadow-md transition">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Trackers in Stock</p>
              <h3 className="text-3xl font-bold text-gray-900">{devicesInStock}</h3>
            </div>
            <div className="bg-indigo-50 p-3 rounded-lg text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition">
              <Cpu size={24} />
            </div>
          </div>
        </Link>

        {/* Card 6: SIM Card Stock */}
        <Link href="/dashboard/inventory" className="block group">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between group-hover:border-teal-300 group-hover:shadow-md transition">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">SIMs in Stock</p>
              <h3 className="text-3xl font-bold text-gray-900">{simsInStock}</h3>
            </div>
            <div className="bg-teal-50 p-3 rounded-lg text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition">
              <Wifi size={24} />
            </div>
          </div>
        </Link>
      </div>

      {/* RECENT ACTIVITY TABLE */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Activity size={18} /> Recent Activity
          </h3>
          <Link href="/dashboard/leads" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            View All <ArrowRight size={14} />
          </Link>
        </div>
        
        <div className="divide-y divide-gray-100">
          {recentJobs.map((job) => (
            <div key={job.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold shrink-0">
                  {job.vehicle.client.fullName.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{job.vehicle.client.fullName}</p>
                  <p className="text-xs text-gray-500">
                    {job.vehicle.name} {job.vehicle.year || ''} • <span className="font-mono">{job.vehicle.plateNumber || 'No Plate'}</span>
                  </p>
                </div>
              </div>

              <div className="hidden md:block text-right">
                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded border ${
                  job.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-100' :
                  job.status === 'PENDING_QC' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                  job.status === 'CONFIGURED' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                  job.status === 'IN_PROGRESS' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                  job.status === 'NEW_LEAD' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                  'bg-gray-50 text-gray-600 border-gray-200'
                }`}>
                  {job.status.replace('_', ' ')}
                </span>
                <div className="flex items-center gap-1 justify-end text-xs text-gray-400 mt-2">
                  <Clock size={10} />
                  <span>
                    {new Date(job.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              </div>
            </div>
          ))}
          
          {recentJobs.length === 0 && (
            <div className="p-8 text-center text-gray-400 text-sm">No recent activity found.</div>
          )}
        </div>
      </div>

    </div>
  );
}