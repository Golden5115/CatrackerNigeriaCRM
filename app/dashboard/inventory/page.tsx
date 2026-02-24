import { prisma } from "@/lib/prisma"
import AddInventoryForms from "@/components/AddInventoryForms"
import { Package, Hash, CheckCircle, XCircle } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function InventoryPage() {
  // Fetch unassigned stock from the database
  const availableDevices = await prisma.device.findMany({
    where: { status: 'IN_STOCK' },
    orderBy: { createdAt: 'desc' }
  })

  const availableSims = await prisma.simCard.findMany({
    where: { status: 'IN_STOCK' },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="max-w-6xl mx-auto">
      
      {/* HEADER */}
      <div className="mb-8">
         <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
           <Package className="text-[#84c47c]" size={32} /> 
           Inventory Management
         </h2>
         <p className="text-gray-500 mt-1">Add and monitor hardware before assigning to the field team.</p>
      </div>

      {/* INPUT FORMS COMPONENT */}
      <AddInventoryForms />

      {/* STOCK TABLES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* DEVICES TABLE */}
        <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
          <div className="bg-blue-50 px-6 py-4 border-b border-blue-100 flex justify-between items-center">
             <h3 className="font-bold text-blue-900">Trackers In Stock</h3>
             <span className="bg-blue-200 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">
               {availableDevices.length} Available
             </span>
          </div>
          <div className="max-h-[500px] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <tbody className="divide-y divide-gray-100">
                {availableDevices.map(device => (
                  <tr key={device.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 flex items-center gap-3">
                      <Hash size={14} className="text-gray-400" />
                      <span className="font-mono text-gray-800 font-medium">{device.imei}</span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                        <CheckCircle size={10} /> Ready
                      </span>
                    </td>
                  </tr>
                ))}
                {availableDevices.length === 0 && (
                  <tr>
                    <td colSpan={2} className="px-6 py-8 text-center text-gray-400">
                      <XCircle size={24} className="mx-auto mb-2 opacity-50" />
                      No trackers in stock. Add some above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SIM CARDS TABLE */}
        <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
          <div className="bg-purple-50 px-6 py-4 border-b border-purple-100 flex justify-between items-center">
             <h3 className="font-bold text-purple-900">SIM Cards In Stock</h3>
             <span className="bg-purple-200 text-purple-800 text-xs font-bold px-2 py-1 rounded-full">
               {availableSims.length} Available
             </span>
          </div>
          <div className="max-h-[500px] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <tbody className="divide-y divide-gray-100">
                {availableSims.map(sim => (
                  <tr key={sim.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 flex flex-col">
                      <span className="font-mono text-gray-800 font-medium">{sim.simNumber}</span>
                      <span className="text-[10px] text-gray-500 uppercase font-bold mt-0.5">{sim.network}</span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                        <CheckCircle size={10} /> Ready
                      </span>
                    </td>
                  </tr>
                ))}
                {availableSims.length === 0 && (
                  <tr>
                    <td colSpan={2} className="px-6 py-8 text-center text-gray-400">
                      <XCircle size={24} className="mx-auto mb-2 opacity-50" />
                      No SIM cards in stock. Add some above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}