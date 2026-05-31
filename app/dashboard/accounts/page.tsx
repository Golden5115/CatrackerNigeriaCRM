import { verifySession } from "@/lib/session"
import { getAccountsAnalytics } from "@/app/actions/accounts"
import { DollarSign, ArrowDownToLine, ArrowUpFromLine, Activity, CreditCard, PieChart, List } from "lucide-react"
import { CashflowChart, DebitCategoryChart } from "@/components/AccountingCharts"
import AddDebitForm from "@/components/AddDebitForm"
import FinancialLedger from "@/components/FinancialLedger" // 🟢 NEW

export const dynamic = 'force-dynamic';

export default async function AccountsPage() {
  await verifySession();

  const analytics = await getAccountsAnalytics();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount);
  }

  const isProfitable = analytics.netCashflow >= 0;

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto font-sans">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Accounts & Finance</h2>
          <p className="text-sm text-gray-500 font-medium mt-1">Master dashboard for tracking Job Revenue, Company Debits, and Cashflow.</p>
        </div>
        <AddDebitForm />
      </div>

      {/* METRICS ROW (🟢 UPDATED: Now emphasizes THIS MONTH) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Monthly Revenue */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-green-50 p-3 rounded-2xl text-[#84c47c]"><ArrowDownToLine size={24} /></div>
            <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full uppercase tracking-wider">This Month</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Monthly Revenue</p>
            <p className="text-3xl font-black text-gray-900">{formatCurrency(analytics.revenue.thisMonth)}</p>
            <p className="text-xs font-bold text-gray-400 mt-2 bg-gray-50 w-fit px-2 py-1 rounded border">All-Time: {formatCurrency(analytics.revenue.total)}</p>
          </div>
        </div>

        {/* Monthly Debits */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-red-50 p-3 rounded-2xl text-red-500"><ArrowUpFromLine size={24} /></div>
            <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-1 rounded-full uppercase tracking-wider">This Month</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Monthly Debits</p>
            <p className="text-3xl font-black text-gray-900">{formatCurrency(analytics.debits.thisMonth)}</p>
            <p className="text-xs font-bold text-gray-400 mt-2 bg-gray-50 w-fit px-2 py-1 rounded border">All-Time: {formatCurrency(analytics.debits.total)}</p>
          </div>
        </div>

        {/* Net Cashflow (All Time) */}
        <div className={`rounded-3xl p-6 shadow-sm border flex flex-col justify-between hover:shadow-md transition relative overflow-hidden ${isProfitable ? 'bg-gradient-to-br from-[#2d4a2a] to-[#1e331c] border-[#2d4a2a] text-white' : 'bg-gradient-to-br from-red-900 to-red-950 border-red-900 text-white'}`}>
          <div className="absolute right-0 top-0 opacity-10 -mr-4 -mt-4"><DollarSign size={120}/></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="bg-white/20 backdrop-blur p-3 rounded-2xl text-white"><Activity size={24} /></div>
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-1">All-Time Net Cashflow</p>
            <p className="text-3xl font-black">{formatCurrency(analytics.netCashflow)}</p>
          </div>
        </div>

        {/* Pending Payments Count */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-orange-50 p-3 rounded-2xl text-orange-500"><CreditCard size={24} /></div>
            <span className="text-[10px] font-bold bg-orange-100 text-orange-700 px-2 py-1 rounded-full uppercase tracking-wider">Unpaid</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Outstanding Jobs</p>
            <p className="text-3xl font-black text-gray-900">{analytics.pendingPaymentJobs} <span className="text-sm font-medium text-gray-500">jobs</span></p>
          </div>
        </div>

      </div>

      {/* CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cashflow Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
           <div className="flex items-center gap-2 mb-6 border-b pb-4">
             <Activity className="text-blue-500" size={20}/>
             <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">6-Month Cashflow Trend</h3>
           </div>
           <CashflowChart data={analytics.monthlyTrend} />
        </div>

        {/* Debit Category Breakdown */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col">
           <div className="flex items-center gap-2 mb-6 border-b pb-4">
             <PieChart className="text-red-500" size={20}/>
             <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Expense Breakdown</h3>
           </div>
           <div className="flex-1 min-h-[300px]">
             {analytics.debits.byCategory.length > 0 ? (
               <DebitCategoryChart data={analytics.debits.byCategory} />
             ) : (
               <div className="h-full flex flex-col items-center justify-center text-gray-400">
                 <p className="text-sm font-medium">No expenses logged yet.</p>
               </div>
             )}
           </div>
        </div>
      </div>

      {/* 🟢 NEW: MASTER FINANCIAL LEDGER */}
      <div>
        <div className="flex items-center gap-2 mb-4 px-2">
          <List className="text-[#84c47c]" size={22}/>
          <h2 className="text-xl font-bold text-gray-800">Financial Ledger</h2>
        </div>
        <FinancialLedger revenueList={analytics.revenueList} debitList={analytics.debitList} />
      </div>

    </div>
  )
}