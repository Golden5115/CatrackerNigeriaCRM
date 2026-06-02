'use client'

import { useState, useMemo } from "react"
import { ArrowDownToLine, ArrowUpFromLine, Filter, Calendar as CalIcon } from "lucide-react"

export default function FinancialLedger({ revenueList, debitList }: { revenueList: any[], debitList: any[] }) {
  const [activeTab, setActiveTab] = useState<'REVENUE' | 'DEBITS'>('REVENUE')
  
  // 🟢 FIXED: Automatically defaults to the exact current month string (e.g. "June 2026")
  const currentMonthString = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthString)
  
  // 🟢 NEW: Exact Date Range Selectors
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount);
  }

  const allMonths = useMemo(() => {
    const months = new Set<string>();
    months.add(currentMonthString); // Always preserve the current month window
    [...revenueList, ...debitList].forEach(item => {
      const d = new Date(item.date);
      months.add(d.toLocaleString('default', { month: 'long', year: 'numeric' }));
    });
    return Array.from(months).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }, [revenueList, debitList, currentMonthString]);

  // Combined conditional filtering array
  const filteredRevenue = revenueList.filter(item => {
    const d = new Date(item.date);
    const matchesMonth = selectedMonth === "ALL" || d.toLocaleString('default', { month: 'long', year: 'numeric' }) === selectedMonth;
    const matchesStart = !startDate || d >= new Date(startDate);
    const matchesEnd = !endDate || d <= new Date(endDate + 'T23:59:59');
    return matchesMonth && matchesStart && matchesEnd;
  });

  const filteredDebits = debitList.filter(item => {
    const d = new Date(item.date);
    const matchesMonth = selectedMonth === "ALL" || d.toLocaleString('default', { month: 'long', year: 'numeric' }) === selectedMonth;
    const matchesStart = !startDate || d >= new Date(startDate);
    const matchesEnd = !endDate || d <= new Date(endDate + 'T23:59:59');
    return matchesMonth && matchesStart && matchesEnd;
  });

  return (
    <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden flex flex-col">
      
      {/* FILTER BAR CONTAINER */}
      <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div className="flex bg-gray-100 p-1 rounded-xl w-full xl:w-auto shrink-0">
          <button onClick={() => setActiveTab('REVENUE')} className={`flex-1 xl:w-32 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 ${activeTab === 'REVENUE' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <ArrowDownToLine size={14} className={activeTab === 'REVENUE' ? 'text-[#84c47c]' : ''}/> Revenue
          </button>
          <button onClick={() => setActiveTab('DEBITS')} className={`flex-1 xl:w-32 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 ${activeTab === 'DEBITS' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <ArrowUpFromLine size={14} className={activeTab === 'DEBITS' ? 'text-red-500' : ''}/> Debits
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
          {/* DATE PICKERS */}
          <div className="flex items-center gap-2 w-full sm:w-auto bg-white border border-gray-200 px-3 py-1.5 rounded-xl shadow-sm">
            <CalIcon size={14} className="text-gray-400" />
            <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); if(e.target.value) setSelectedMonth("ALL"); }} className="text-xs font-bold text-gray-700 outline-none bg-transparent" />
            <span className="text-gray-300 text-xs font-black">TO</span>
            <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); if(e.target.value) setSelectedMonth("ALL"); }} className="text-xs font-bold text-gray-700 outline-none bg-transparent" />
          </div>

          {/* DROP-DOWN OPTION */}
          <div className="relative w-full sm:w-auto shrink-0">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Filter size={14}/></div>
            <select value={selectedMonth} onChange={(e) => { setSelectedMonth(e.target.value); if(e.target.value !== "ALL") { setStartDate(""); setEndDate(""); } }} className="w-full sm:w-48 pl-8 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:border-blue-500 cursor-pointer shadow-sm">
              <option value="ALL">All Time History</option>
              {allMonths.map(month => <option key={month} value={month}>{month === currentMonthString ? `${month} (Current)` : month}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* REVENUE RENDERING ENGINE */}
      {activeTab === 'REVENUE' && (
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-white sticky top-0 z-10 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Date</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Source (Client & Vehicle)</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Collected By</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredRevenue.map((item) => (
                <tr key={item.id} className="hover:bg-green-50/30 transition group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-xs font-bold text-gray-600 bg-gray-100 border border-gray-200 px-2 py-1 rounded shadow-sm">
                      {new Date(item.date).toLocaleDateString('en-GB')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-sm text-gray-900">{item.clientName}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{item.vehicleName}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium text-gray-600 bg-gray-50 px-2 py-1 rounded border">
                      {item.collector}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-black text-[#2d4a2a] bg-[#e0f2de] px-3 py-1.5 rounded-lg border border-[#84c47c]/30">
                      +{formatCurrency(item.amount)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredRevenue.length === 0 && <div className="p-16 text-center text-gray-500 font-medium text-sm">No revenue records found for this period.</div>}
        </div>
      )}

      {/* DEBITS RENDERING ENGINE */}
      {activeTab === 'DEBITS' && (
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-white sticky top-0 z-10 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Date</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Category / Reason</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Recipient</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredDebits.map((item) => (
                <tr key={item.id} className="hover:bg-red-50/30 transition group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-xs font-bold text-gray-600 bg-gray-100 border border-gray-200 px-2 py-1 rounded shadow-sm">
                      {new Date(item.date).toLocaleDateString('en-GB')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-sm text-gray-900">{item.category}</p>
                    {(item.reason || item.note) && (
                      <p className="text-[11px] text-gray-500 mt-0.5 max-w-xs truncate" title={item.note || item.reason}>{item.reason || item.note}</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-gray-700 bg-gray-50 px-2 py-1 rounded border">
                      {item.recipient}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-black text-red-700 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200">
                      -{formatCurrency(item.amount)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredDebits.length === 0 && <div className="p-16 text-center text-gray-500 font-medium text-sm">No debit records found for this period.</div>}
        </div>
      )}
    </div>
  )
}