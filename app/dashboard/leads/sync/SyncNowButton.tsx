'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { triggerCtnSync } from '@/app/actions/ctnSync'

export default function SyncNowButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ imported?: number; error?: string } | null>(null)
  const router = useRouter()

  async function handleSync() {
    setLoading(true)
    setResult(null)

    try {
      const data = await triggerCtnSync()

      if (data.success) {
        setResult({ imported: data.imported })
      } else {
        setResult({ error: data.errors?.[0] || data.error || 'Sync failed' })
      }
      
      // Refresh the page data
      router.refresh()
    } catch (err: any) {
      setResult({ error: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      {result && (
        <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${
          result.error 
            ? 'bg-red-50 text-red-700 border border-red-200' 
            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        }`}>
          {result.error ? `⚠ ${result.error}` : `✓ Imported ${result.imported} leads`}
        </span>
      )}
      <button
        onClick={handleSync}
        disabled={loading}
        className="flex items-center gap-2 bg-[#84c47c] text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-[#6aa663] transition shadow-sm disabled:opacity-60"
      >
        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        {loading ? 'Syncing...' : 'Sync Now'}
      </button>
    </div>
  )
}
