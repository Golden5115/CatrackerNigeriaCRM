'use client'

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { Loader2 } from 'lucide-react';

export default function OverviewFiltersClient({
  installerNames,
  leadSources,
  defaultMonth,
  defaultYear,
  defaultInstaller,
  defaultLeadSource
}: {
  installerNames: string[],
  leadSources: string[],
  defaultMonth: string,
  defaultYear: string,
  defaultInstaller: string,
  defaultLeadSource: string
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleFilter = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const month = formData.get('month') as string;
    const year = formData.get('year') as string;
    const installer = formData.get('installer') as string;
    const leadSource = formData.get('leadSource') as string;

    const params = new URLSearchParams();
    if (month) params.set('month', month);
    if (year) params.set('year', year);
    if (installer && installer !== 'ALL') params.set('installer', installer);
    if (leadSource && leadSource !== 'ALL') params.set('leadSource', leadSource);

    startTransition(() => {
      router.push(`/dashboard?${params.toString()}`);
    });
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
    <form onSubmit={handleFilter} className="flex flex-col sm:flex-row items-center gap-3">
      <div className="flex flex-col sm:flex-row items-center gap-2">
        <select 
          name="installer" 
          defaultValue={defaultInstaller}
          className="bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-xl px-3 py-2.5 outline-none focus:border-green-500 shadow-sm cursor-pointer disabled:opacity-50"
          disabled={isPending}
        >
          <option value="ALL">All Installers</option>
          {installerNames.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>

        <select 
          name="leadSource" 
          defaultValue={defaultLeadSource}
          className="bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 shadow-sm cursor-pointer disabled:opacity-50"
          disabled={isPending}
        >
          <option value="ALL">All Lead Sources</option>
          {leadSources.map(source => (
            <option key={source} value={source}>{source}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <select 
          name="month"
          defaultValue={defaultMonth} 
          className="bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm disabled:opacity-50"
          disabled={isPending}
        >
          {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        
        <select 
          name="year"
          defaultValue={defaultYear} 
          className="bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm disabled:opacity-50"
          disabled={isPending}
        >
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      
      <button 
        type="submit" 
        disabled={isPending}
        className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
      >
        {isPending && <Loader2 size={14} className="animate-spin" />}
        {isPending ? 'Filtering...' : 'Apply Filters'}
      </button>
    </form>
  )
}
