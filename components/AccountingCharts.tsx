'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell, Legend } from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#d946ef', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#84c47c', '#64748b'];
const formatYAxis = (value: number) => `₦${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`;

export function CashflowChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
        <YAxis axisLine={false} tickLine={false} tickFormatter={formatYAxis} tick={{fill: '#64748b', fontSize: 12}} />
        {/* 🟢 FIXED: Changed name: string to name: any to clear the TS error */}
        <Tooltip cursor={{fill: '#f8fafc'}} formatter={(value: any, name: any) => [`₦${Number(value || 0).toLocaleString()}`, name === 'revenue' ? 'Revenue' : 'Debits']} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
        <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#84c47c" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
        <Line type="monotone" dataKey="debits" name="Debits" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function DebitCategoryChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
        <YAxis axisLine={false} tickLine={false} tickFormatter={formatYAxis} tick={{fill: '#64748b', fontSize: 12}} />
        <Tooltip cursor={{fill: '#f8fafc'}} formatter={(value: any) => [`₦${Number(value || 0).toLocaleString()}`, 'Total Debit']} />
        <Bar dataKey="value" fill="#ef4444" radius={[6, 6, 0, 0]} maxBarSize={50}>
          {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}