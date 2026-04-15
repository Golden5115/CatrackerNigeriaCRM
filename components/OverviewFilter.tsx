'use client'

import { useRouter, useSearchParams } from 'next/navigation';

export default function OverviewFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const currentMonth = searchParams.get('month') || (new Date().getMonth() + 1).toString();
  const currentYear = searchParams.get('year') || new Date().getFullYear().toString();

  const handleFilter = (month: string, year: string) => {
    router.push(`/dashboard?month=${month}&year=${year}`);
  }

  const months = [
    { value: '1', label: 'January' }, { value: '2', label: 'February' },
    { value: '3', label: 'March' }, { value: '4', label: 'April' },
    { value: '5', label: 'May' }, { value: '6', label: 'June' },
    { value: '7', label: 'July' }, { value: '8', label: 'August' },
    { value: '9', label: 'September' }, { value: '10', label: 'October' },
    { value: '11', label: 'November' }, { value: '12', label: 'December' }
  ];

  const years = ['2025', '2026', '2027', '2028'];

  return (
    <div className="flex gap-2">
      <select 
        value={currentMonth} 
        onChange={(e) => handleFilter(e.target.value, currentYear)}
        className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm"
      >
        {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
      </select>
      
      <select 
        value={currentYear} 
        onChange={(e) => handleFilter(currentMonth, e.target.value)}
        className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm"
      >
        {years.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>
  )
}