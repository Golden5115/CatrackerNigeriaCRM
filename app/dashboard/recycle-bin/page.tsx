import { prisma } from "@/lib/prisma"
import { verifySession } from "@/lib/session"
import { redirect } from "next/navigation"
import { Trash2, RotateCcw, AlertTriangle, Calendar, Car, Briefcase, FileText, LifeBuoy } from "lucide-react"
import RecycleBinClient from "./RecycleBinClient"
import { runAutoCleanup } from "@/app/actions/recycleBin"

export const dynamic = 'force-dynamic';

export default async function RecycleBinPage() {
  const session = await verifySession()
  if (session?.role !== 'ADMIN') redirect('/dashboard')

  // Automatically delete items older than 30 days
  await runAutoCleanup()

  // Fetch all archived items
  const [archivedClients, archivedJobs, archivedVehicles, archivedInvoices, archivedSupport] = await Promise.all([
    prisma.client.findMany({ where: { isArchived: true }, orderBy: { deletedAt: 'desc' } }),
    prisma.job.findMany({ 
      where: { isArchived: true }, 
      include: { vehicle: { include: { client: true } } },
      orderBy: { deletedAt: 'desc' } 
    }),
    prisma.vehicle.findMany({ 
      where: { isArchived: true }, 
      include: { client: true },
      orderBy: { deletedAt: 'desc' } 
    }),
    prisma.invoice.findMany({ where: { isArchived: true }, orderBy: { deletedAt: 'desc' } }),
    prisma.support.findMany({ where: { isArchived: true }, orderBy: { deletedAt: 'desc' } }),
  ])

  // Process data for the client component
  const data = {
    clients: archivedClients.map(c => ({ id: c.id, name: c.fullName, type: 'client' as const, date: c.deletedAt })),
    jobs: archivedJobs.map(j => ({ id: j.id, name: `${j.jobType} - ${j.vehicle?.name || 'Unknown'} (${j.vehicle?.client?.fullName || 'Unknown'})`, type: 'job' as const, date: j.deletedAt })),
    vehicles: archivedVehicles.map(v => ({ id: v.id, name: `${v.name} (${v.client?.fullName || 'Unknown'})`, type: 'vehicle' as const, date: v.deletedAt })),
    invoices: archivedInvoices.map(i => ({ id: i.id, name: `${i.invoiceNumber} - ${i.clientName}`, type: 'invoice' as const, date: i.deletedAt })),
    support: archivedSupport.map(s => ({ id: s.id, name: `Ticket: ${s.issue} (${s.clientName})`, type: 'support' as const, date: s.deletedAt })),
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Trash2 className="text-red-500" /> Recycle Bin
          </h2>
          <p className="text-sm text-gray-500">Restore deleted items or permanently erase them. Items older than 30 days are automatically deleted.</p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3 text-amber-800 shadow-sm text-sm font-medium">
        <AlertTriangle size={20} className="shrink-0 text-amber-600" />
        <p>Restoring a <strong>Job Ticket</strong> will leave its hardware (Tracker/SIM) fields blank. This prevents conflicts if the hardware was used by another installer while the ticket was deleted. You will need to re-assign hardware after restoring.</p>
      </div>

      <RecycleBinClient data={data} />
    </div>
  )
}
