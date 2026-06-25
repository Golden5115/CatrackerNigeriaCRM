import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Search as SearchIcon, User, Car, Cpu, Smartphone, ArrowRight, Wrench, FileText, Briefcase, CreditCard, Server, CheckCircle, XCircle, TrendingUp, Archive } from "lucide-react"

export const dynamic = 'force-dynamic'

// Helper: Determine which module/status a job is currently in
function getJobModuleBadge(job: any) {
  if (job.isArchived) return { label: 'Archived', color: 'bg-gray-100 text-gray-600 border-gray-200' }
  switch (job.status) {
    case 'NEW_LEAD': return { label: 'Sales Pipeline', color: 'bg-blue-100 text-blue-700 border-blue-200' }
    case 'SCHEDULED': return { label: 'Scheduled', color: 'bg-purple-100 text-purple-700 border-purple-200' }
    case 'IN_PROGRESS': return { label: 'In Progress', color: 'bg-orange-100 text-orange-700 border-orange-200' }
    case 'PENDING_QC': return { label: 'Tech Queue', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' }
    case 'CONFIGURED': return { label: job.onboarded ? 'Client Database' : 'Onboarding', color: job.onboarded ? 'bg-green-100 text-green-700 border-green-200' : 'bg-indigo-100 text-indigo-700 border-indigo-200' }
    case 'ACTIVE': return { label: 'Active Client', color: 'bg-green-100 text-green-700 border-green-200' }
    case 'LEAD_LOST': return { label: 'Lost Lead', color: 'bg-gray-100 text-gray-600 border-gray-200' }
    default: return { label: job.status.replace('_', ' '), color: 'bg-gray-100 text-gray-600 border-gray-200' }
  }
}

// Helper: Get the best module status for a client based on their jobs
function getClientModuleBadges(client: any) {
  const badges: { label: string, color: string }[] = []
  const statuses = new Set<string>()
  
  for (const vehicle of client.vehicles) {
    for (const job of vehicle.jobs) {
      if (!job.isArchived) {
        statuses.add(job.status)
        if (job.status === 'ACTIVE' && job.paymentStatus !== 'PAID') {
          badges.push({ label: 'Payment Due', color: 'bg-red-100 text-red-700 border-red-200' })
        }
      }
    }
  }

  if (statuses.has('ACTIVE')) badges.unshift({ label: 'Active Client', color: 'bg-green-100 text-green-700 border-green-200' })
  else if (statuses.has('CONFIGURED')) badges.unshift({ label: 'Onboarding', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' })
  else if (statuses.has('PENDING_QC')) badges.unshift({ label: 'Tech Queue', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' })
  else if (statuses.has('IN_PROGRESS')) badges.unshift({ label: 'In Progress', color: 'bg-orange-100 text-orange-700 border-orange-200' })
  else if (statuses.has('SCHEDULED')) badges.unshift({ label: 'Scheduled', color: 'bg-purple-100 text-purple-700 border-purple-200' })
  else if (statuses.has('NEW_LEAD')) badges.unshift({ label: 'Sales Pipeline', color: 'bg-blue-100 text-blue-700 border-blue-200' })
  else if (statuses.has('LEAD_LOST')) badges.unshift({ label: 'Lost Lead', color: 'bg-gray-100 text-gray-600 border-gray-200' })
  
  return badges.length > 0 ? badges : [{ label: 'Client Database', color: 'bg-gray-100 text-gray-600 border-gray-200' }]
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = await searchParams;
  const q = typeof params.q === 'string' ? params.q : '';

  if (!q) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <SearchIcon size={48} className="mb-4 opacity-20" />
        <p className="text-xl font-medium text-gray-500">Enter a search term to begin.</p>
        <p className="text-sm mt-2">Search by client name, phone, plate number, or IMEI.</p>
      </div>
    );
  }

  // 🟢 FIXED: All queries now exclude archived records
  const [clients, vehicles, devices, simCards, supportTickets, invoices] = await Promise.all([
    prisma.client.findMany({
      where: {
        isArchived: false,
        OR: [
          { fullName: { contains: q, mode: 'insensitive' } },
          { phoneNumber: { contains: q } },
          { email: { contains: q, mode: 'insensitive' } },
          { address: { contains: q, mode: 'insensitive' } },
          { state: { contains: q, mode: 'insensitive' } }
        ]
      },
      include: { 
        vehicles: { 
          where: { isArchived: false },
          include: { 
            jobs: { where: { isArchived: false }, select: { status: true, paymentStatus: true, onboarded: true, isArchived: true } } 
          } 
        } 
      }
    }),
    prisma.vehicle.findMany({
      where: {
        isArchived: false,
        client: { isArchived: false },
        OR: [
          { plateNumber: { contains: q, mode: 'insensitive' } },
          { name: { contains: q, mode: 'insensitive' } },
          { year: { contains: q } }
        ]
      },
      include: { 
        client: true,
        jobs: { where: { isArchived: false }, select: { status: true, paymentStatus: true, onboarded: true, isArchived: true } }
      }
    }),
    prisma.device.findMany({
      where: { imei: { contains: q } },
      include: { job: { include: { vehicle: { include: { client: true } } } } }
    }),
    prisma.simCard.findMany({
      where: { simNumber: { contains: q } },
      include: { job: { include: { vehicle: { include: { client: true } } } } }
    }),
    prisma.support.findMany({
      where: {
        isArchived: false,
        OR: [
          { clientName: { contains: q, mode: 'insensitive' } },
          { phoneNumber: { contains: q } },
          { imei: { contains: q } },
          { oldImei: { contains: q } }
        ]
      }
    }),
    prisma.invoice.findMany({
      where: {
        isArchived: false,
        OR: [
          { invoiceNumber: { contains: q, mode: 'insensitive' } },
          { clientName: { contains: q, mode: 'insensitive' } }
        ]
      }
    })
  ]);

  const totalResults = clients.length + vehicles.length + devices.length + simCards.length + supportTickets.length + invoices.length;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      
      <div className="border-b pb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
          <SearchIcon className="text-blue-500" size={28} />
          Search Results for &quot;{q}&quot;
        </h2>
        <p className="text-gray-500 mt-1">Found {totalResults} matching records in your database.</p>
      </div>

      {totalResults === 0 && (
        <div className="bg-gray-50 rounded-xl p-12 text-center border border-dashed">
          <p className="text-gray-500 font-medium">No results found.</p>
          <p className="text-sm text-gray-400 mt-1">Double-check your spelling or try a different keyword.</p>
        </div>
      )}

      {/* --- CLIENT RESULTS --- */}
      {clients.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 border-b pb-2">
             <User size={18} className="text-[#84c47c]" /> Matching Clients
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clients.map(client => {
              const badges = getClientModuleBadges(client)
              return (
                <Link href={`/dashboard/clients/${client.id}`} key={client.id} className="block bg-white p-4 rounded-xl border hover:border-[#84c47c] hover:shadow-md transition group">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-gray-900 text-lg group-hover:text-[#2d4a2a] transition">{client.fullName}</p>
                      <p className="text-sm text-gray-500 mt-1">{client.phoneNumber}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className="text-xs bg-gray-100 text-gray-600 w-fit px-2 py-1 rounded font-medium">{client.vehicles.length} Vehicle(s)</span>
                        {badges.map((badge, i) => (
                          <span key={i} className={`text-[9px] px-2 py-1 rounded-full font-bold uppercase tracking-wider border ${badge.color}`}>{badge.label}</span>
                        ))}
                      </div>
                    </div>
                    <ArrowRight size={18} className="text-gray-300 group-hover:text-[#84c47c] transition" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* --- VEHICLE RESULTS --- */}
      {vehicles.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 border-b pb-2">
             <Car size={18} className="text-blue-500" /> Matching Vehicles
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vehicles.map(vehicle => {
              const jobBadges = vehicle.jobs.map((job: any) => getJobModuleBadge(job))
              return (
                <Link href={`/dashboard/clients/${vehicle.clientId}`} key={vehicle.id} className="block bg-white p-4 rounded-xl border hover:border-blue-400 hover:shadow-md transition group">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-gray-900">{vehicle.name} <span className="font-normal text-gray-500 text-sm">({vehicle.year || 'N/A'})</span></p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="font-mono text-xs bg-gray-100 border px-2 py-1 rounded font-bold">{vehicle.plateNumber || 'NO PLATE'}</span>
                        <span className="text-xs text-gray-500">Owned by: {vehicle.client.fullName}</span>
                      </div>
                      {jobBadges.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {jobBadges.map((badge: any, i: number) => (
                            <span key={i} className={`text-[9px] px-2 py-1 rounded-full font-bold uppercase tracking-wider border ${badge.color}`}>{badge.label}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <ArrowRight size={18} className="text-gray-300 group-hover:text-blue-500 transition" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* --- SUPPORT TICKETS --- */}
      {supportTickets.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 border-b pb-2">
             <Wrench size={18} className="text-orange-500" /> Matching Support Tickets
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {supportTickets.map(ticket => (
              <Link href={`/dashboard/support`} key={ticket.id} className="block bg-white p-4 rounded-xl border hover:border-orange-400 hover:shadow-md transition group">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-gray-900">{ticket.clientName}</p>
                    <p className="text-sm text-gray-500 mt-1 truncate">{ticket.issue}</p>
                    <div className="flex gap-1.5 mt-2">
                      {ticket.status === 'RESOLVED' ? (
                        <span className="text-[9px] px-2 py-1 rounded-full font-bold uppercase tracking-wider border bg-green-100 text-green-700 border-green-200">Resolved</span>
                      ) : (
                        <span className="text-[9px] px-2 py-1 rounded-full font-bold uppercase tracking-wider border bg-orange-100 text-orange-700 border-orange-200">Pending</span>
                      )}
                    </div>
                  </div>
                  <ArrowRight size={18} className="text-gray-300 group-hover:text-orange-500 transition" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* --- INVOICES --- */}
      {invoices.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 border-b pb-2">
             <FileText size={18} className="text-yellow-500" /> Matching Invoices
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {invoices.map(invoice => (
              <Link href={`/dashboard/invoices/${invoice.id}`} key={invoice.id} className="block bg-white p-4 rounded-xl border hover:border-yellow-400 hover:shadow-md transition group">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-gray-900">{invoice.invoiceNumber}</p>
                    <p className="text-sm text-gray-500 mt-1">Billed to: {invoice.clientName}</p>
                    <div className="flex gap-1.5 mt-2">
                      {invoice.status === 'PAID' ? (
                        <span className="text-[9px] px-2 py-1 rounded-full font-bold uppercase tracking-wider border bg-green-100 text-green-700 border-green-200">Paid</span>
                      ) : invoice.status === 'CANCELLED' ? (
                        <span className="text-[9px] px-2 py-1 rounded-full font-bold uppercase tracking-wider border bg-gray-100 text-gray-600 border-gray-200">Cancelled</span>
                      ) : (
                        <span className="text-[9px] px-2 py-1 rounded-full font-bold uppercase tracking-wider border bg-red-100 text-red-700 border-red-200">Unpaid</span>
                      )}
                    </div>
                  </div>
                  <ArrowRight size={18} className="text-gray-300 group-hover:text-yellow-500 transition" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* --- HARDWARE (DEVICE & SIM) RESULTS --- */}
      {(devices.length > 0 || simCards.length > 0) && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 border-b pb-2">
             <Cpu size={18} className="text-purple-500" /> Matching Hardware
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {devices.map(device => (
              <div key={device.id} className="bg-white p-4 rounded-xl border">
                <div className="flex items-start gap-3">
                  <Cpu size={20} className="text-purple-500 shrink-0 mt-1" />
                  <div className="w-full">
                    <p className="font-mono font-bold text-gray-900 break-all">{device.imei}</p>
                    <p className="text-xs text-gray-500 font-bold uppercase mt-1">Status: {device.status}</p>
                    {device.job?.vehicle && (
                      <div className="mt-3 pt-3 border-t text-sm">
                        <p className="text-gray-500">Installed in:</p>
                        <Link href={`/dashboard/clients/${device.job.vehicle.clientId}`} className="text-blue-600 hover:underline font-medium block truncate">
                          {device.job.vehicle.name} ({device.job.vehicle.plateNumber})
                        </Link>
                        <p className="text-xs text-gray-400 mt-0.5">Client: {device.job.vehicle.client.fullName}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {simCards.map(sim => (
              <div key={sim.id} className="bg-white p-4 rounded-xl border">
                <div className="flex items-start gap-3">
                  <Smartphone size={20} className="text-purple-500 shrink-0 mt-1" />
                  <div className="w-full">
                    <p className="font-mono font-bold text-gray-900">{sim.simNumber}</p>
                    <p className="text-xs text-gray-500 font-bold uppercase mt-1">
                      Network: {sim.network || 'Unknown'} | Status: {sim.status}
                    </p>
                    {sim.job?.vehicle && (
                      <div className="mt-3 pt-3 border-t text-sm">
                        <p className="text-gray-500">Installed in:</p>
                        <Link href={`/dashboard/clients/${sim.job.vehicle.clientId}`} className="text-blue-600 hover:underline font-medium block truncate">
                          {sim.job.vehicle.name} ({sim.job.vehicle.plateNumber})
                        </Link>
                        <p className="text-xs text-gray-400 mt-0.5">Client: {sim.job.vehicle.client.fullName}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}