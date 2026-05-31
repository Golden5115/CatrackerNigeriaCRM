import { prisma } from "@/lib/prisma"
import { verifySession } from "@/lib/session"
import LocalSearchInput from "@/components/LocalSearchInput"
import InventoryFilter from "@/components/InventoryFilter"
import AddInventoryForms from "@/components/AddInventoryForms"
import InventoryTables from "@/components/InventoryTables" 

export const dynamic = 'force-dynamic'

export default async function InventoryPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = await searchParams;
  const query = (params.query as string) || '';
  const statusFilter = (params.status as string) || 'ALL';

  const session = await verifySession()
  const isAdminOrOps = session?.role === 'ADMIN' || session?.role === 'OPERATIONS'
  const canEdit: boolean = Boolean(session?.canEdit === true || isAdminOrOps)

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

  const [devices, sims] = await Promise.all([
    prisma.device.findMany({ 
      where: deviceWhere, 
      include: { 
        job: { include: { vehicle: { include: { client: true } } } } 
      }, 
      orderBy: { createdAt: 'desc' } 
    }),
    prisma.simCard.findMany({ 
      where: simWhere, 
      include: { 
        job: { include: { vehicle: { include: { client: true } } } } 
      }, 
      orderBy: { createdAt: 'desc' } 
    })
  ])

  // 🟢 FIXED: Safely serializes the Prisma objects to destroy the `Decimal` error
  const safeDevices = JSON.parse(JSON.stringify(devices));
  const safeSims = JSON.parse(JSON.stringify(sims));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Inventory Management</h2>
          <p className="text-sm text-gray-500">Track IMEIs, SIM cards, and hardware assignments.</p>
        </div>
        {isAdminOrOps && <AddInventoryForms />}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-gray-100">
        <div className="flex-1">
          <LocalSearchInput placeholder="Search IMEI or SIM Number..." />
        </div>
        <InventoryFilter currentFilter={statusFilter} />
      </div>

      <InventoryTables 
        devices={safeDevices} 
        sims={safeSims} 
        canEdit={canEdit} 
      />

    </div>
  )
}