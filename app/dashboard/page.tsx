import { prisma } from "@/lib/prisma"
import { 
  Users, Wrench, CheckCircle, AlertCircle, Clock, 
  Activity, ArrowRight, Smartphone 
} from "lucide-react";
import Link from "next/link";



export default async function DashboardOverview() {
  
  // 1. Run Multiple Queries in Parallel
  const [stats, recentJobs] = await Promise.all([
    // Group counts by Status
    prisma.job.groupBy({
      by: ['status'],
      _count: { _all: true }
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

  // 2. Process Stats Data
  const getCount = (status: string) => 
    stats.find(s => s.status === status)?._count._all || 0;

  const pipelineLeads = getCount('NEW_LEAD') + getCount('SCHEDULED');
  const techQueue = getCount('INSTALLED'); // Waiting for Tech
  const pendingOnboarding = getCount('CONFIGURED'); // Tech done, waiting for Onboarding
  const pendingPayments = getCount('PAYMENT_PENDING');

  return (
    <div className="space-y-8">
      
      {/* HEADER */}
      <div>
        <h2 className="text-3xl font-bold text-gray-800">Dashboard Overview</h2>
        <p className="text-gray-500">Welcome back. Here is what's happening today.</p>
      </div>

      {/* STATS CARDS (Now Clickable) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
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

        {/* Card 3: Pending Onboarding (Renamed from Active Vehicles) */}
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
                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold">
                  {job.vehicle.client.fullName.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{job.vehicle.client.fullName}</p>
                  <p className="text-xs text-gray-500">
                    {job.vehicle.name} {job.vehicle.year} • <span className="font-mono">{job.vehicle.plateNumber}</span>
                  </p>
                </div>
              </div>

              <div className="hidden md:block text-right">
                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded border ${
                  job.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-100' :
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