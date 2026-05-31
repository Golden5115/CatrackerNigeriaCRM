'use client'

import { useState, useMemo } from "react"
import { ArrowDownToLine, ArrowUpFromLine, Search, Filter } from "lucide-react"

export default function FinancialLedger({ revenueList, debitList }: { revenueList: any[], debitList: any[] }) {
  const [activeTab, setActiveTab] = useState<'REVENUE' | 'DEBITS'>('REVENUE')
  const [selectedMonth, setSelectedMonth] = useState<string>("ALL")

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount);
  }

  // Extract unique months (e.g., "May 2026") from both lists for the filter
  const allMonths = useMemo(() => {
    const months = new Set<string>();
    [...revenueList, ...debitList].forEach(item => {
      const d = new Date(item.date);
      months.add(d.toLocaleString('default', { month: 'long', year: 'numeric' }));
    });
    // Sort chronologically (simplistic sort by string assuming recent years)
    return Array.from(months).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }, [revenueList, debitList]);

  // Filter data based on selected month
  const filteredRevenue = revenueList.filter(item => 
    selectedMonth === "ALL" || new Date(item.date).toLocaleString('default', { month: 'long', year: 'numeric' }) === selectedMonth
  );

  const filteredDebits = debitList.filter(item => 
    selectedMonth === "ALL" || new Date(item.date).toLocaleString('default', { month: 'long', year: 'numeric' }) === selectedMonth
  );

  return (
    <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden flex flex-col">
      
      {/* HEADER & FILTERS */}
      <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex bg-gray-100 p-1 rounded-xl w-full sm:w-auto">
          <button 
            onClick={() => setActiveTab('REVENUE')} 
            className={`flex-1 sm:w-32 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 ${activeTab === 'REVENUE' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <ArrowDownToLine size={14} className={activeTab === 'REVENUE' ? 'text-[#84c47c]' : ''}/> Revenue
          </button>
          <button 
            onClick={() => setActiveTab('DEBITS')} 
            className={`flex-1 sm:w-32 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 ${activeTab === 'DEBITS' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <ArrowUpFromLine size={14} className={activeTab === 'DEBITS' ? 'text-red-500' : ''}/> Debits
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto relative">
          <div className="absolute left-3 text-gray-400"><Filter size={14}/></div>
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full sm:w-48 pl-8 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:border-blue-500 cursor-pointer shadow-sm"
          >
            <option value="ALL">All Time History</option>
            {allMonths.map(month => <option key={month} value={month}>{month}</option>)}
          </select>
        </div>
      </div>

      {/* REVENUE TABLE */}
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
          {filteredRevenue.length === 0 && (
             <div className="p-16 text-center text-gray-500 font-medium text-sm">No revenue records found for {selectedMonth === 'ALL' ? 'all time' : selectedMonth}.</div>
          )}
        </div>
      )}

      {/* DEBITS TABLE */}
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
                      <p className="text-[11px] text-gray-500 mt-0.5 max-w-xs truncate" title={item.note || item.reason}>
                        {item.reason || item.note}
                      </p>
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
          {filteredDebits.length === 0 && (
             <div className="p-16 text-center text-gray-500 font-medium text-sm">No debit records found for {selectedMonth === 'ALL' ? 'all time' : selectedMonth}.</div>
          )}
        </div>
      )}
    </div>
  )
}