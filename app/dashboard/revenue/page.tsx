import { prisma } from "@/lib/prisma"
import { verifySession } from "@/lib/session"
import { Wallet, ArrowUpRight, DollarSign } from "lucide-react"
import RevenueChart from "@/components/RevenueChart" // We'll create this next
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic'

export default async function RevenueAnalysisPage() {
  const session = await verifySession()
  const userId = typeof session?.userId === 'string' ? session.userId : null;
  const user = userId ? await prisma.user.findUnique({ where: { id: userId }}) : null;

  // Protect this route: Admins Only
  if (user?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

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

 const stats = {
    dailyRevenue: 0, 
    weeklyRevenue: 0, 
    monthlyRevenue: 0,
    totalHistoricalRevenue: 0
  };

  allJobs.forEach(job => {
    if (job.paymentStatus === 'PAID') {
      const amount = Number(job.amountPaid || 0);
      const jobDate = new Date(job.updatedAt);
      
      stats.totalHistoricalRevenue += amount;

      if (jobDate >= today) stats.dailyRevenue += amount;
      if (jobDate >= firstDayOfWeek) stats.weeklyRevenue += amount;
      if (jobDate >= firstDayOfMonth) stats.monthlyRevenue += amount;
    }
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      
      <div>
        <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <Wallet className="text-[#84c47c]" size={32} /> Financial Analytics
        </h2>
        <p className="text-gray-500 mt-1">Track company revenue and payment collection metrics.</p>
      </div>

      {/* TOP CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm border-t-4 border-t-green-300">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Today's Revenue</p>
          <h3 className="text-2xl font-bold text-gray-900">₦{stats.dailyRevenue.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm border-t-4 border-t-green-500">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">This Week</p>
          <h3 className="text-2xl font-bold text-gray-900">₦{stats.weeklyRevenue.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm border-t-4 border-t-[#2d4a2a]">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">This Month</p>
          <h3 className="text-2xl font-bold text-gray-900">₦{stats.monthlyRevenue.toLocaleString()}</h3>
        </div>
        <div className="bg-green-50 p-6 rounded-2xl border border-green-200 shadow-sm relative overflow-hidden">
          <DollarSign className="absolute -right-4 -bottom-4 text-green-100 w-24 h-24 rotate-12" />
          <p className="text-xs font-bold text-green-800 uppercase tracking-wider mb-1 relative z-10">All-Time Revenue</p>
          <h3 className="text-2xl font-bold text-green-900 relative z-10 flex items-center gap-2">
            ₦{stats.totalHistoricalRevenue.toLocaleString()} <ArrowUpRight size={16} />
          </h3>
        </div>
      </div>

      {/* REVENUE CHART */}
      <RevenueChart stats={stats} />

    </div>
  )
}