import { verifySession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { 
  ArrowLeft, RefreshCw, Clock, CheckCircle, AlertTriangle, 
  XCircle, Zap, Globe, Hash, User, Phone, Car 
} from "lucide-react"
import SyncNowButton from "./SyncNowButton"

export const dynamic = 'force-dynamic'

export default async function CtnSyncPage() {
  // Auth: Admin only
  const session = await verifySession()
  const userId = typeof session?.userId === 'string' ? session.userId : null
  if (!userId) redirect('/login')
  
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (user?.role !== 'ADMIN') redirect('/dashboard')

  // Fetch sync metadata
  const meta = await prisma.ctnSyncMeta.findUnique({ where: { id: 'singleton' } })

  // Fetch recent CTN-imported clients (last 25)
  const recentLeads = await prisma.client.findMany({
    where: { ctnLeadId: { not: null } },
    orderBy: { createdAt: 'desc' },
    take: 25,
    include: {
      vehicles: {
        include: {
          jobs: { take: 1, orderBy: { createdAt: 'desc' } }
        }
      }
    }
  })

  // Total count of CTN leads
  const totalCtnLeads = await prisma.client.count({
    where: { ctnLeadId: { not: null } }
  })

  // Determine health status
  const lastRunAt = meta?.lastRunAt
  const minutesSinceSync = lastRunAt 
    ? Math.floor((Date.now() - new Date(lastRunAt).getTime()) / 60000) 
    : null

  let healthStatus: 'healthy' | 'warning' | 'error' | 'never' = 'never'
  if (meta?.lastError) healthStatus = 'error'
  else if (minutesSinceSync !== null && minutesSinceSync <= 15) healthStatus = 'healthy'
  else if (minutesSinceSync !== null && minutesSinceSync <= 60) healthStatus = 'warning'
  else if (minutesSinceSync !== null) healthStatus = 'error'

  const healthConfig = {
    healthy: { color: 'bg-emerald-500', pulse: 'animate-pulse', text: 'Healthy', textColor: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    warning: { color: 'bg-amber-500', pulse: '', text: 'Stale', textColor: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
    error:   { color: 'bg-red-500', pulse: '', text: 'Error', textColor: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
    never:   { color: 'bg-gray-400', pulse: '', text: 'Never Run', textColor: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' },
  }
  const health = healthConfig[healthStatus]

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/leads" className="p-2 hover:bg-gray-100 rounded-lg transition">
          <ArrowLeft size={20} className="text-gray-500" />
        </Link>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Globe size={24} className="text-[#84c47c]" />
            CTN Lead Feed Sync
          </h2>
          <p className="text-sm text-gray-500">Auto-imports leads from cartracker.com.ng every 10 minutes</p>
        </div>
        <SyncNowButton />
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Health */}
        <div className={`${health.bg} border ${health.border} rounded-xl p-4`}>
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-3 h-3 rounded-full ${health.color} ${health.pulse}`} />
            <span className={`text-xs font-bold uppercase tracking-wider ${health.textColor}`}>{health.text}</span>
          </div>
          <p className="text-[11px] text-gray-500">
            {minutesSinceSync !== null ? `Last sync ${minutesSinceSync}m ago` : 'No sync recorded yet'}
          </p>
        </div>

        {/* Last ID */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Hash size={14} className="text-gray-400" />
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Cursor (Last ID)</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{meta?.lastId ?? 0}</p>
        </div>

        {/* Last Batch */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={14} className="text-amber-500" />
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Last Batch</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{meta?.lastCount ?? 0} <span className="text-sm font-normal text-gray-400">leads</span></p>
        </div>

        {/* Total Imported */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle size={14} className="text-emerald-500" />
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Imported</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalCtnLeads}</p>
        </div>
      </div>

      {/* Error Banner */}
      {meta?.lastError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <XCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-red-800">Last Sync Error</p>
            <p className="text-xs text-red-600 mt-1 font-mono">{meta.lastError}</p>
          </div>
        </div>
      )}

      {/* Sync Details */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
          <Clock size={16} className="text-gray-400" />
          Sync Configuration
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-gray-50 rounded-lg p-3">
            <span className="text-gray-500 block mb-0.5">Schedule</span>
            <span className="font-bold text-gray-900">Every 10 minutes (Vercel Cron)</span>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <span className="text-gray-500 block mb-0.5">Endpoint</span>
            <span className="font-bold text-gray-900 font-mono">/api/ctn-sync</span>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <span className="text-gray-500 block mb-0.5">Feed Source</span>
            <span className="font-bold text-gray-900">cartracker.com.ng (Install Form)</span>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <span className="text-gray-500 block mb-0.5">Last Sync</span>
            <span className="font-bold text-gray-900">
              {meta?.lastRunAt 
                ? new Date(meta.lastRunAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                : 'Never'
              }
            </span>
          </div>
        </div>
      </div>

      {/* Recent Imports Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <Globe size={16} className="text-[#84c47c]" />
            Recently Imported CTN Leads
          </h3>
          <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-bold">
            Last {recentLeads.length} of {totalCtnLeads}
          </span>
        </div>

        {recentLeads.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-400">
            No CTN leads imported yet. The sync will run automatically every 10 minutes.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-500 uppercase">CTN ID</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-500 uppercase">Client</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-500 uppercase">Phone</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-500 uppercase">Vehicle(s)</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-500 uppercase">State</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-500 uppercase">Imported</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentLeads.map(client => (
                  <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5">
                      <span className="text-xs font-mono bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">
                        #{client.ctnLeadId}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-[#e0f2de] flex items-center justify-center text-[#2d4a2a] text-[10px] font-bold shrink-0">
                          {client.fullName.charAt(0)}
                        </div>
                        <span className="text-xs font-bold text-gray-900">{client.fullName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-600">{client.phoneNumber}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {client.vehicles.map(v => (
                          <span key={v.id} className="text-[10px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Car size={10} /> {v.name} {v.year ? `(${v.year})` : ''}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-600">{client.state || '—'}</td>
                    <td className="px-4 py-2.5 text-[11px] text-gray-400">
                      {new Date(client.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
