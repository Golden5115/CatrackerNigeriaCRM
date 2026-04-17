import { prisma } from "@/lib/prisma"
import { verifySession } from "@/lib/session"
import { DollarSign, TrendingUp, TrendingDown, Calendar, CreditCard, Activity } from "lucide-react"
import RevenueChart from "@/components/RevenueChart"
import { fixHistoricalPaymentDates } from "@/app/actions/fixData"

export const dynamic = 'force-dynamic';

export default async function RevenuePage() {
  await verifySession();

  const now = new Date();
  
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  startOfThisMonth.setHours(0, 0, 0, 0);

  const startOfThisWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  startOfThisWeek.setHours(0, 0, 0, 0);

  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  startOfLastMonth.setHours(0, 0, 0, 0);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  // 🟢 FIXED: Fetch paymentDate, and restrict outstanding count to ONBOARDED jobs only!
  const [paidJobs, unpaidJobsCount] = await Promise.all([
    prisma.job.findMany({ 
      where: { amountPaid: { gt: 0 } }, 
      select: { amountPaid: true, updatedAt: true, paymentDate: true } 
    }),
    prisma.job.count({ 
      where: { 
        paymentStatus: { not: 'PAID' },
        onboarded: true // 👈 NEW: Only counts if the client is actually fully active/onboarded
      }
    })
  ]);

  let thisMonthRev = 0;
  let thisWeekRev = 0;
  let lastMonthRev = 0;
  let totalAllTime = 0;

  // 🟢 FIXED: The "Swiss Army Knife" data bucket that guarantees the chart renders
  const chartData = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { 
      month: d.getMonth(), 
      year: d.getFullYear(), 
      name: d.toLocaleString('default', { month: 'short' }), 
      total: 0,
      revenue: 0, // 👈 Fallback 1
      amount: 0,  // 👈 Fallback 2
      value: 0    // 👈 Fallback 3
    };
  });

// Sort Job Payments into their correct time buckets
  paidJobs.forEach(job => {
    const amt = Number(job.amountPaid || 0);
    const date = job.paymentDate ? new Date(job.paymentDate) : new Date(job.updatedAt); 
    
    totalAllTime += amt;

    if (date >= startOfThisMonth) thisMonthRev += amt;
    if (date >= startOfThisWeek) thisWeekRev += amt;
    if (date >= startOfLastMonth && date <= endOfLastMonth) lastMonthRev += amt;

    if (date >= sixMonthsAgo) {
      const bucket = chartData.find(b => b.month === date.getMonth() && b.year === date.getFullYear());
      if (bucket) {
        bucket.total += amt;
        bucket.revenue += amt; // 👈 Syncs all fallbacks
        bucket.amount += amt;  
        bucket.value += amt;   
      }
    }
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount);
  }

  let growth = 0;
  if (lastMonthRev > 0) {
    growth = Math.round(((thisMonthRev - lastMonthRev) / lastMonthRev) * 100);
  } else if (thisMonthRev > 0) {
    growth = 100; 
  }

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Financial Analysis</h2>
          <p className="text-sm text-gray-500 font-medium mt-1">Real-time revenue tracking synced from confirmed job payments.</p>
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* THIS MONTH */}
        <div className="bg-gradient-to-br from-[#84c47c] to-[#5a9a52] rounded-3xl p-6 shadow-lg shadow-green-900/20 text-white relative overflow-hidden group transition hover:-translate-y-1">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-xs font-bold text-green-100 uppercase tracking-widest mb-1">Made This Month</p>
              <div className="flex items-end gap-2 mt-2">
                 <p className="text-4xl sm:text-5xl font-black tracking-tighter">{formatCurrency(thisMonthRev)}</p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-sm font-bold bg-white/20 w-fit px-3 py-1 rounded-full backdrop-blur-sm">
                 {growth >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                 <span>{growth > 0 ? '+' : ''}{growth}% from last month</span>
              </div>
            </div>
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm hidden sm:block">
              <DollarSign size={24} className="text-white" />
            </div>
          </div>
        </div>

        {/* THIS WEEK */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-6 shadow-lg shadow-blue-900/20 text-white relative overflow-hidden group transition hover:-translate-y-1">
          <div className="absolute bottom-0 right-0 -mb-4 -mr-4 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-1">Made This Week</p>
              <div className="flex items-end gap-2 mt-2">
                 <p className="text-4xl sm:text-5xl font-black tracking-tighter">{formatCurrency(thisWeekRev)}</p>
              </div>
            </div>
            <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-sm hidden sm:block">
              <Activity size={24} className="text-white" />
            </div>
          </div>
        </div>

        {/* LAST MONTH */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-6 shadow-lg shadow-gray-900/20 text-white relative overflow-hidden group transition hover:-translate-y-1">
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Made Last Month</p>
              <div className="flex items-end gap-2 mt-2">
                 <p className="text-4xl sm:text-5xl font-black tracking-tighter text-gray-100">{formatCurrency(lastMonthRev)}</p>
              </div>
            </div>
            <div className="bg-white/5 p-3 rounded-2xl border border-white/10 hidden sm:block">
              <Calendar size={24} className="text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* CHART & OUTSTANDING ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* CHART */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
           <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-blue-500"></span> 6-Month Revenue Trend
           </h3>
           <div className="h-[300px] w-full">
              <RevenueChart stats={chartData} />
           </div>
        </div>

        {/* OUTSTANDING & ALL TIME */}
        <div className="space-y-5">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 h-1/2 flex flex-col justify-center relative overflow-hidden group hover:shadow-md transition">
             <div className="absolute right-0 top-0 text-red-500/5 -mt-4 -mr-4 group-hover:scale-110 transition duration-500"><CreditCard size={120} /></div>
             <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1 relative z-10">Unpaid Onboarded Jobs</p>
             <p className="text-3xl font-black text-gray-900 relative z-10">{unpaidJobsCount}</p>
             <p className="text-xs font-medium text-gray-500 mt-2 relative z-10">Total active clients with outstanding balances.</p>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 h-1/2 flex flex-col justify-center relative overflow-hidden group hover:shadow-md transition">
             <div className="absolute right-0 top-0 text-green-500/5 -mt-4 -mr-4 group-hover:scale-110 transition duration-500"><DollarSign size={120} /></div>
             <p className="text-[10px] font-bold text-[#84c47c] uppercase tracking-widest mb-1 relative z-10">All-Time Revenue</p>
             <p className="text-3xl font-black text-gray-900 relative z-10">{formatCurrency(totalAllTime)}</p>
             <p className="text-xs font-medium text-gray-500 mt-2 relative z-10">Total confirmed payments collected via jobs.</p>
          </div>
        </div>

      </div>

    </div>
  )
}