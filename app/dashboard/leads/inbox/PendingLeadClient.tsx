'use client'

import { useState } from 'react'
import { approveLead, rejectLead } from '@/app/actions/pendingLeads'
import { CheckCircle2, XCircle, Loader2, Phone, User, Car, Clock, MapPin, MessageSquare } from 'lucide-react'

export default function PendingLeadClient({ lead }: { lead: any }) {
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  
  const payload = lead.payload || {}

  async function handleApprove() {
    setIsApproving(true)
    try {
      await approveLead(lead.id)
    } catch (e: any) {
      alert(`Error approving lead: ${e.message}`)
      setIsApproving(false)
    }
  }

  async function handleReject() {
    if (!confirm('Are you sure you want to reject and delete this lead?')) return
    setIsRejecting(true)
    try {
      await rejectLead(lead.id)
    } catch (e: any) {
      alert('Error rejecting lead.')
      setIsRejecting(false)
    }
  }

  // Extract common fields for display
  const name = payload.fullName || payload.owner || payload.name || 'Unknown'
  const phone = payload.phoneNumber || payload.phone || 'No phone'
  const car = payload.vehicleName || payload.car || 'No vehicle specified'
  const address = payload.address || 'No address provided'
  const notes = payload.remarks || payload.notes || payload.message || ''

  return (
    <div className="bg-white border rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-700">
                <User size={16} className="text-gray-400" />
                <span className="font-semibold text-lg">{name}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Phone size={16} className="text-gray-400" />
                <span>{phone}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin size={16} className="text-gray-400" />
                <span className="truncate max-w-[250px]">{address}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-600">
                <Car size={16} className="text-gray-400" />
                <span className="font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded">{car}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Clock size={16} className="text-gray-400" />
                <span>Submitted: {new Date(lead.createdAt).toLocaleString()}</span>
              </div>
              {notes && (
                <div className="flex items-start gap-2 text-gray-600 text-sm mt-2 bg-gray-50 p-2 rounded">
                  <MessageSquare size={16} className="text-gray-400 mt-0.5 shrink-0" />
                  <span className="italic line-clamp-2">{notes}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full md:w-48 shrink-0">
            <button
              onClick={handleApprove}
              disabled={isApproving || isRejecting}
              className="flex items-center justify-center gap-2 w-full bg-[#84c47c] text-white py-2.5 px-4 rounded-lg font-bold hover:bg-[#6eb066] transition disabled:opacity-50"
            >
              {isApproving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
              Approve
            </button>
            <button
              onClick={handleReject}
              disabled={isApproving || isRejecting}
              className="flex items-center justify-center gap-2 w-full bg-white border-2 border-red-100 text-red-600 py-2.5 px-4 rounded-lg font-bold hover:bg-red-50 hover:border-red-200 transition disabled:opacity-50"
            >
              {isRejecting ? <Loader2 size={18} className="animate-spin" /> : <XCircle size={18} />}
              Reject
            </button>
          </div>
          
        </div>
        
        {/* Raw Payload Debugger for Admins (hidden by default, useful for setup) */}
        <details className="mt-4 text-xs text-gray-400">
          <summary className="cursor-pointer hover:text-gray-600">View Raw Webhook Payload</summary>
          <pre className="mt-2 bg-gray-900 text-green-400 p-3 rounded overflow-x-auto">
            {JSON.stringify(payload, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  )
}
