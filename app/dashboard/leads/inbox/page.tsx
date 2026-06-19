import { prisma } from '@/lib/prisma'
import PendingLeadClient from './PendingLeadClient'

export const dynamic = 'force-dynamic'

export default async function LeadInboxPage() {
  const pendingLeads = await prisma.pendingLead.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Lead Inbox</h1>
        <p className="text-gray-500 mt-2">
          Review incoming leads from your website before they enter the Sales Pipeline.
        </p>
      </div>

      <div className="grid gap-6">
        {pendingLeads.length === 0 ? (
          <div className="bg-white border rounded-xl shadow-sm p-12 text-center text-gray-500">
            No pending leads at the moment.
          </div>
        ) : (
          pendingLeads.map((lead) => (
            <PendingLeadClient key={lead.id} lead={lead} />
          ))
        )}
      </div>
    </div>
  )
}
