'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function RevenueChart({ stats }: { stats: any[] }) {
  // We no longer need to manually map 'revenueData' here because 
  // the 'stats' prop is now a perfectly formatted 6-month array!

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={stats} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
        
        {/* X-Axis reads the "name" property (e.g., "Jan", "Feb", "Mar") */}
        <XAxis 
          dataKey="name" 
          axisLine={false} 
          tickLine={false} 
          tick={{fill: '#6b7280', fontWeight: 'bold'}} 
        />
        
        {/* Y-Axis intelligently formats large numbers into "k" (e.g., 150k instead of 150000) so it doesn't overlap */}
        <YAxis 
          axisLine={false} 
          tickLine={false} 
          tick={{fill: '#6b7280', fontSize: 12}} 
          tickFormatter={(value) => `₦${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`} 
        />
        
        <Tooltip 
          cursor={{fill: '#f3f4f6'}} 
          contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
          formatter={(value: any) => [`₦${Number(value).toLocaleString()}`, 'Revenue']}
        />
        
        {/* The Bar now looks specifically for the "total" property in our 6-month array */}
        <Bar 
          dataKey="total" 
          fill="#84c47c" 
          radius={[8, 8, 0, 0]} 
          maxBarSize={60} 
        />
      </BarChart>
    </ResponsiveContainer>
  )
}