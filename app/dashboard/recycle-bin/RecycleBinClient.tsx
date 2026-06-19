'use client'

import { useState } from 'react'
import { RotateCcw, Trash2, Loader2, Calendar } from 'lucide-react'
import { permanentlyDelete } from '@/app/actions/recycleBin'
import { restoreClient, restoreJobTicket, restoreVehicle } from '@/app/actions/manageClient'
import { restoreInvoice } from '@/app/actions/invoice'
import { restoreSupportTicket } from '@/app/actions/support'
import { useRouter } from 'next/navigation'

export type ItemType = 'client' | 'job' | 'vehicle' | 'invoice' | 'support'

interface Item {
  id: string
  name: string
  type: ItemType
  date: Date | null
}

export interface DataType {
  clients: Item[]
  jobs: Item[]
  vehicles: Item[]
  invoices: Item[]
  support: Item[]
}

export default function RecycleBinClient({ data }: { data: DataType }) {
  const [activeTab, setActiveTab] = useState<keyof DataType>('jobs')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const router = useRouter()

  const tabs: { id: keyof DataType, label: string, count: number }[] = [
    { id: 'jobs', label: 'Job Tickets', count: data.jobs?.length || 0 },
    { id: 'clients', label: 'Clients', count: data.clients?.length || 0 },
    { id: 'vehicles', label: 'Vehicles', count: data.vehicles?.length || 0 },
    { id: 'invoices', label: 'Invoices', count: data.invoices?.length || 0 },
    { id: 'support', label: 'Support', count: data.support?.length || 0 },
  ]

  const activeItems = data[activeTab] || []

  async function handleRestore(id: string, type: ItemType) {
    if (!confirm('Are you sure you want to restore this item?')) return
    setLoadingId(id)
    try {
      if (type === 'client') await restoreClient(id)
      if (type === 'job') await restoreJobTicket(id)
      if (type === 'vehicle') await restoreVehicle(id)
      if (type === 'invoice') await restoreInvoice(id)
      if (type === 'support') await restoreSupportTicket(id)
      router.refresh()
    } catch (e) {
      alert('Failed to restore item.')
    } finally {
      setLoadingId(null)
    }
  }

  async function handleDelete(id: string, type: ItemType) {
    if (!confirm('PERMANENTLY DELETE? This cannot be undone!')) return
    setLoadingId(id)
    try {
      await permanentlyDelete(id, type)
      router.refresh()
    } catch (e) {
      alert('Failed to delete item.')
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
      <div className="border-b overflow-x-auto flex custom-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as keyof DataType)}
            className={`px-6 py-4 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id 
                ? 'border-[#84c47c] text-[#84c47c]' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab.label} <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">{tab.count}</span>
          </button>
        ))}
      </div>

      <div className="p-0">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Item Name / Details</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Deleted Date</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {activeItems.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 font-medium text-sm text-gray-900">{item.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500 flex items-center gap-2">
                  <Calendar size={14} className="text-gray-400" />
                  {item.date ? new Date(item.date).toLocaleDateString('en-GB') : 'Unknown'}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleRestore(item.id, item.type)}
                      disabled={loadingId === item.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition disabled:opacity-50"
                    >
                      {loadingId === item.id ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                      Restore
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, item.type)}
                      disabled={loadingId === item.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-xs font-bold transition disabled:opacity-50"
                    >
                      {loadingId === item.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {activeItems.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-sm text-gray-500 font-medium">
                  No deleted items in this category.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
