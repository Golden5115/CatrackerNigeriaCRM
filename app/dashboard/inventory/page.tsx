import { prisma } from "@/lib/prisma"
import { verifySession } from "@/lib/session"
import LocalSearchInput from "@/components/LocalSearchInput"
import InventoryFilter from "@/components/InventoryFilter"
import AddInventoryForms from "@/components/AddInventoryForms"
import { Cpu, CreditCard, CheckCircle, Wrench, AlertTriangle } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function InventoryPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = await searchParams;
  const query = (params.query as string) || '';
  const statusFilter = (params.status as string) || 'ALL';

  const session = await verifySession()
  const isAdminOrOps = session?.role === 'ADMIN' || session?.role === 'OPERATIONS'

  // Build the dynamic filter logic
  const deviceWhere: any = {};
  const simWhere: any = {};

  if (query) {
    deviceWhere.imei = { contains: query, mode: 'insensitive' };
    simWhere.simNumber = { contains: query, mode: 'insensitive' };
  }

  if (statusFilter !== 'ALL') {
    deviceWhere.status = statusFilter;
    simWhere.status = statusFilter;
  }

  // Fetch from database
  const [devices, sims] = await Promise.all([
    prisma.device.findMany({ where: deviceWhere, include: { job: { include: { vehicle: { include: { client: true } } } } }, orderBy: { createdAt: 'desc' } }),
    prisma.simCard.findMany({ where: simWhere, include: { job: { include: { vehicle: { include: { client: true } } } } }, orderBy: { createdAt: 'desc' } })
  ])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'IN_STOCK': return <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1 w-fit"><CheckCircle size={10}/> Unused</span>;
      case 'INSTALLED': return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1 w-fit"><Wrench size={10}/> Used</span>;
      case 'FAULTY': return <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1 w-fit"><AlertTriangle size={10}/> Faulty</span>;
      default: return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-[10px] font-bold uppercase">{status}</span>;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Inventory Management</h2>
          <p className="text-sm text-gray-500">Track IMEIs, SIM cards, and hardware assignments.</p>
        </div>
        {isAdminOrOps && <AddInventoryForms />}
      </div>

      {/* 🟢 NEW: Unified Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-gray-100">
        <div className="flex-1">
          <LocalSearchInput placeholder="Search IMEI or SIM Number..." />
        </div>
        <InventoryFilter currentFilter={statusFilter} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* DEVICES (TRACKERS) TABLE */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[600px]">
          <div className="bg-gray-50 p-4 border-b flex items-center gap-2">
             <Cpu className="text-gray-500" size={18} />
             <h3 className="font-bold text-gray-800">Tracker Hardware (IMEIs)</h3>
             <span className="ml-auto bg-gray-200 text-gray-700 text-xs font-bold px-2 py-1 rounded-full">{devices.length}</span>
          </div>
          <div className="flex-1 overflow-auto p-4">
             <div className="space-y-3">
               {devices.map(device => (
                 <div key={device.id} className="p-3 border rounded-lg hover:border-blue-300 transition bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                       <div className="font-mono font-bold text-sm text-gray-900">{device.imei}</div>
                       {getStatusBadge(device.status)}
                    </div>
                    {device.status === 'INSTALLED' && device.job && (
                       <div className="text-xs text-gray-600 bg-white p-2 rounded border border-gray-100">
                         Installed in: <span className="font-bold">{device.job.vehicle.name} ({device.job.vehicle.plateNumber})</span><br/>
                         Client: <span className="font-medium">{device.job.vehicle.client.fullName}</span>
                       </div>
                    )}
                 </div>
               ))}
               {devices.length === 0 && <p className="text-sm text-gray-500 text-center py-8">No IMEIs found.</p>}
             </div>
          </div>
        </div>

        {/* SIM CARDS TABLE */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[600px]">
          <div className="bg-gray-50 p-4 border-b flex items-center gap-2">
             <CreditCard className="text-gray-500" size={18} />
             <h3 className="font-bold text-gray-800">Tracker SIM Cards</h3>
             <span className="ml-auto bg-gray-200 text-gray-700 text-xs font-bold px-2 py-1 rounded-full">{sims.length}</span>
          </div>
          <div className="flex-1 overflow-auto p-4">
             <div className="space-y-3">
               {sims.map(sim => (
                 <div key={sim.id} className="p-3 border rounded-lg hover:border-purple-300 transition bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                       <div>
                         <div className="font-mono font-bold text-sm text-gray-900">{sim.simNumber}</div>
                         <div className="text-[10px] font-bold text-purple-600 uppercase mt-0.5">{sim.network || "UNKNOWN NETWORK"}</div>
                       </div>
                       {getStatusBadge(sim.status)}
                    </div>
                    {sim.status === 'INSTALLED' && sim.job && (
                       <div className="text-xs text-gray-600 bg-white p-2 rounded border border-gray-100">
                         Active in: <span className="font-bold">{sim.job.vehicle.name} ({sim.job.vehicle.plateNumber})</span><br/>
                         Client: <span className="font-medium">{sim.job.vehicle.client.fullName}</span>
                       </div>
                    )}
                 </div>
               ))}
               {sims.length === 0 && <p className="text-sm text-gray-500 text-center py-8">No SIMs found.</p>}
             </div>
          </div>
        </div>

      </div>
    </div>
  )
}