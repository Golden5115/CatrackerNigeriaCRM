'use client'

import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

const COLORS = ['#84c47c', '#f59e0b', '#ef4444']; // Green, Orange, Red

export default function DashboardCharts({ stats }: { stats: any }) {
  
  // Format data for the Pie Chart
  const leadData = [
    { name: 'Converted', value: stats.leadsConverted },
    { name: 'Pending', value: stats.leadsUnconverted },
    { name: 'Lost', value: stats.leadsLost },
  ];

  // Format data for the Bar Chart
  const revenueData = [
    { name: 'Today', Revenue: stats.dailyRevenue, Jobs: stats.dailyJobs },
    { name: 'This Week', Revenue: stats.weeklyRevenue, Jobs: stats.weeklyJobs },
    { name: 'This Month', Revenue: stats.monthlyRevenue, Jobs: stats.monthlyJobs },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
      
      {/* Revenue Bar Chart */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h4 className="font-bold text-gray-800 mb-6">Revenue & Job Volume</h4>
        {/* We use a fixed height container to guarantee it NEVER overlaps */}
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" orientation="left" stroke="#84c47c" axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" axisLine={false} tickLine={false} />
              <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}/>
              <Legend />
              <Bar yAxisId="left" dataKey="Revenue" fill="#84c47c" radius={[4, 4, 0, 0]} name="Revenue (₦)" />
              <Bar yAxisId="right" dataKey="Jobs" fill="#e5e7eb" radius={[4, 4, 0, 0]} name="Jobs" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Leads Pie Chart */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
        <h4 className="font-bold text-gray-800 mb-2">Lead Conversion Distribution</h4>
        <div className="flex-1 h-[300px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={leadData}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={110}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {leadData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}/>
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
          
          {/* Center Text inside the Donut */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
            <span className="text-3xl font-bold text-gray-800">{stats.totalLeads}</span>
            <span className="text-xs font-bold text-gray-400 uppercase">Total Leads</span>
          </div>
        </div>
      </div>

    </div>
  )
}