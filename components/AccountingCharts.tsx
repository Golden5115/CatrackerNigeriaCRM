'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell, Legend, PieChart, Pie } from 'recharts';

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84c47c', '#3b82f6', '#8b5cf6', '#d946ef', '#ec4899', '#64748b'];
const formatYAxis = (value: number) => `₦${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`;

export function CashflowChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
        <YAxis axisLine={false} tickLine={false} tickFormatter={formatYAxis} tick={{fill: '#64748b', fontSize: 12}} />
        <Tooltip cursor={{fill: '#f8fafc'}} formatter={(value: any, name: any) => [`₦${Number(value || 0).toLocaleString()}`, name === 'revenue' ? 'Revenue' : 'Debits']} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
        <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#84c47c" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
        <Line type="monotone" dataKey="debits" name="Debits" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function DebitCategoryBarChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
        <YAxis axisLine={false} tickLine={false} tickFormatter={formatYAxis} tick={{fill: '#64748b', fontSize: 12}} />
        <Tooltip cursor={{fill: '#f8fafc'}} formatter={(value: any) => [`₦${Number(value || 0).toLocaleString()}`, 'Total Spent']} />
        <Bar dataKey="value" fill="#ef4444" radius={[6, 6, 0, 0]} maxBarSize={50}>
          {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
  if (percent < 0.04) return null; // Avoid labels overcrowding tiny slices
  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={11} fontWeight="bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function DebitCategoryPieChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomizedLabel}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value: any) => [`₦${Number(value || 0).toLocaleString()}`, 'Total Spent']} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
      </PieChart>
    </ResponsiveContainer>
  )
}