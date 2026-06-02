'use client'

import { useState } from "react"
import { DebitCategoryBarChart, DebitCategoryPieChart } from "./AccountingCharts"
import { BarChart2, PieChart } from "lucide-react"

export default function ExpenseChartsWrapper({ data }: { data: any[] }) {
  const [view, setView] = useState<'PIE' | 'BAR'>('PIE')

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col h-full">
      <div className="flex items-center justify-between mb-6 border-b pb-4">
        <div className="flex items-center gap-2">
          <PieChart className="text-red-500" size={20}/>
          {/* 🟢 FIXED: Label updated so staff knows it is Monthly */}
          <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">This Month's Expenses</h3>
        </div>
        
        {/* Toggle Controls */}
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button 
            onClick={() => setView('PIE')} 
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1 ${view === 'PIE' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <PieChart size={14}/> Pie
          </button>
          <button 
            onClick={() => setView('BAR')} 
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1 ${view === 'BAR' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <BarChart2 size={14}/> Bar
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-[300px]">
        {data.length > 0 ? (
          view === 'PIE' ? (
            <DebitCategoryPieChart data={data} />
          ) : (
            <DebitCategoryBarChart data={data} />
          )
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center">
            <p className="text-sm font-medium">No expenses logged this month.</p>
          </div>
        )}
      </div>
    </div>
  )
}