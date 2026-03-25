'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function RevenueChart({ stats }: { stats: any }) {
  
  const revenueData = [
    { name: 'Today', Revenue: stats.dailyRevenue },
    { name: 'This Week', Revenue: stats.weeklyRevenue },
    { name: 'This Month', Revenue: stats.monthlyRevenue },
  ];

  return (
    <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
      <h4 className="font-bold text-gray-800 mb-6">Revenue Growth Trajectory</h4>
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={revenueData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontWeight: 'bold'}} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} tickFormatter={(value) => `₦${value.toLocaleString()}`} />
            <Tooltip 
              cursor={{fill: '#f3f4f6'}} 
              contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
              formatter={(value: any) => [`₦${Number(value).toLocaleString()}`, 'Revenue']}
            />
            <Bar dataKey="Revenue" fill="#84c47c" radius={[8, 8, 0, 0]} barSize={60} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}