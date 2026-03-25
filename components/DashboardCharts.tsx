'use client'

import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

const COLORS = ['#84c47c', '#f59e0b', '#ef4444']; // Green, Orange, Red

export default function DashboardCharts({ stats }: { stats: any }) {
  
  // Format data for the Pie Chart
  const leadData = [
    { name: 'Onboarded', value: stats.leadsConverted },
    { name: 'Pending', value: stats.leadsUnconverted },
    { name: 'Lost', value: stats.leadsLost },
  ];

  // Format data for the Bar Chart (Jobs Only)
  const jobData = [
    { name: 'Today', Jobs: stats.dailyJobs },
    { name: 'This Week', Jobs: stats.weeklyJobs },
    { name: 'This Month', Jobs: stats.monthlyJobs },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
      
      {/* Job Volume Bar Chart */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h4 className="font-bold text-gray-800 mb-6">Job Completion Volume</h4>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={jobData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}/>
              <Bar dataKey="Jobs" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Completed Jobs" />
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
          
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
            <span className="text-3xl font-bold text-gray-800">{stats.totalLeads}</span>
            <span className="text-xs font-bold text-gray-400 uppercase">Total Leads</span>
          </div>
        </div>
      </div>

    </div>
  )
}