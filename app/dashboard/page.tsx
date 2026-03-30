import { prisma } from "@/lib/prisma"
import { verifySession } from "@/lib/session"
import { CheckCircle, Briefcase, Users, TrendingUp, AlertCircle, BarChart3 } from "lucide-react"
import DashboardCharts from "@/components/DashboardCharts"

export const dynamic = 'force-dynamic'

export default async function DashboardOverview() {
  const session = await verifySession()
  const userId = typeof session?.userId === 'string' ? session.userId : null;
  const user = userId ? await prisma.user.findUnique({ where: { id: userId }}) : null;

 // --- ADMIN DATA CRUNCHING ---
  let stats = {
    dailyJobs: 0, weeklyJobs: 0, monthlyJobs: 0,
    leadsConverted: 0, leadsUnconverted: 0, leadsLost: 0, totalLeads: 0
  };
  
  if (user?.role === 'ADMIN') {
    const allJobs = await prisma.job.findMany({
      select: {
        status: true,
        updatedAt: true,
        onboarded: true,
        amountPaid: true,      // Needed for Revenue
        paymentStatus: true    // Needed for Revenue
      }
    })

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfWeek = new Date(today);
    firstDayOfWeek.setDate(today.getDate() - today.getDay());

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    stats = {
      dailyJobs: 0, weeklyJobs: 0, monthlyJobs: 0,
      leadsConverted: 0, leadsUnconverted: 0, leadsLost: 0, totalLeads: allJobs.length
    }

    allJobs.forEach(job => {
      const jobDate = new Date(job.updatedAt);

      if (['ACTIVE', 'CONFIGURED'].includes(job.status)) {
        if (jobDate >= today) stats.dailyJobs++;
        if (jobDate >= firstDayOfWeek) stats.weeklyJobs++;
        if (jobDate >= firstDayOfMonth) stats.monthlyJobs++;
      }

      // 👇 FIX: Strict Lead Conversion Logic
      if (job.status === 'LEAD_LOST') {
        stats.leadsLost++;
      } else if (job.status === 'ACTIVE' || job.onboarded === true) {
        stats.leadsConverted++; // Only counts if fully onboarded!
      } else {
        stats.leadsUnconverted++; // Everything else (New, Scheduled, In Progress, In Tech) is Pending
      }
    })
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      
      {/* 1. THE HERO SECTION */}
      <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-50 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/3"></div>
        
        <div className="bg-[#e0f2de] w-20 h-20 rounded-full flex items-center justify-center shrink-0">
          <CheckCircle size={40} className="text-[#2d4a2a]" />
        </div>
        
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user?.fullName || 'Team Member'}!</h2>
          <p className="text-gray-500 text-lg mb-4">You are logged in as <span className="font-bold text-[#84c47c]">{user?.role.replace('_', ' ')}</span>.</p>
          
          {user?.role !== 'ADMIN' && (
            <div className="inline-block bg-gray-50 border px-6 py-3 rounded-xl text-sm font-medium text-gray-600">
              Select a module from the sidebar menu to begin your workflow.
            </div>
          )}
        </div>
      </div>

      {/* 2. ADMIN LIVE METRICS (Operations Only) */}
      {user?.role === 'ADMIN' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* SECTION A: JOB VOLUME */}
            <div className="flex flex-col">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Briefcase className="text-blue-500" /> Installations Completed
              </h3>
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6 flex-1">
                <div className="flex justify-between items-center border-b pb-4 mt-2">
                  <span className="text-gray-600 font-medium">Completed Today</span>
                  <span className="text-2xl font-bold text-gray-900 bg-blue-50 px-4 py-1 rounded-lg">{stats.dailyJobs}</span>
                </div>
                <div className="flex justify-between items-center border-b pb-4">
                  <span className="text-gray-600 font-medium">Completed This Week</span>
                  <span className="text-2xl font-bold text-gray-900 bg-blue-50 px-4 py-1 rounded-lg">{stats.weeklyJobs}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Completed This Month</span>
                  <span className="text-2xl font-bold text-gray-900 bg-blue-100 px-4 py-1 rounded-lg text-blue-800">{stats.monthlyJobs}</span>
                </div>
              </div>
            </div>

            {/* SECTION B: LEAD PIPELINE */}
            <div className="flex flex-col">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Users className="text-orange-500" /> Sales Pipeline Health
              </h3>
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex-1">
                
                <div className="mb-6 flex justify-between items-end">
                  <div>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Total Leads Logged</p>
                    <h3 className="text-4xl font-bold text-gray-900">{stats.totalLeads}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Conversion Rate</p>
                    <h3 className="text-2xl font-bold text-[#84c47c]">
                      {Math.round((stats.leadsConverted / Math.max(stats.totalLeads, 1)) * 100)}%
                    </h3>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-[#e0f2de]/50 p-3 rounded-xl border border-[#84c47c]/30">
                    <span className="flex items-center gap-2 text-sm font-bold text-green-800"><TrendingUp size={16}/> Successfully Onboarded</span>
                    <span className="font-bold text-green-800">{stats.leadsConverted}</span>
                  </div>
                  <div className="flex justify-between items-center bg-orange-50 p-3 rounded-xl border border-orange-100">
                    <span className="flex items-center gap-2 text-sm font-bold text-orange-800"><AlertCircle size={16}/> Pending / In Progress</span>
                    <span className="font-bold text-orange-800">{stats.leadsUnconverted}</span>
                  </div>
                  <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-200">
                    <span className="flex items-center gap-2 text-sm font-bold text-gray-600"><BarChart3 size={16}/> Lost / Cancelled Leads</span>
                    <span className="font-bold text-gray-600">{stats.leadsLost}</span>
                  </div>
                </div>

              </div>
            </div>

          </div>
          
          {/* Charts (Jobs & Leads only) */}
          <DashboardCharts stats={stats} />
        </div>
      )}
    </div>
  )
}