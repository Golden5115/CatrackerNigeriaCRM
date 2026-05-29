'use client'

import { useState } from "react"
import { Cpu, CreditCard, CheckCircle, Wrench, AlertTriangle, UserCheck, X, Building } from "lucide-react"
import EditHardwareModal from "@/components/EditHardwareModal"
import { assignHardware } from "@/app/actions/inventory"

// 🟢 FIXED: Removed the 'installers' prop completely from the interface
export default function InventoryTables({ 
  devices, 
  sims, 
  canEdit 
}: { 
  devices: any[], 
  sims: any[], 
  canEdit: boolean 
}) {
  const [selectedDevices, setSelectedDevices] = useState<string[]>([])
  const [selectedSims, setSelectedSims] = useState<string[]>([])
  const [assigningType, setAssigningType] = useState<'DEVICE' | 'SIM' | null>(null)
  
  const [installerName, setInstallerName] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const toggleDevice = (id: string) => {
    setSelectedDevices(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const toggleSim = (id: string) => {
    setSelectedSims(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const handleAssign = async (nameToAssign: string | null) => {
    if (!assigningType) return;
    setLoading(true);
    
    const ids = assigningType === 'DEVICE' ? selectedDevices : selectedSims;
    
    await assignHardware(assigningType, ids, nameToAssign);
    
    if (assigningType === 'DEVICE') setSelectedDevices([]);
    else setSelectedSims([]);
    
    setAssigningType(null);
    setInstallerName("");
    setLoading(false);
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'IN_STOCK': return <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1 w-fit"><CheckCircle size={10}/> Unused</span>;
      case 'INSTALLED': return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1 w-fit"><Wrench size={10}/> Used</span>;
      case 'FAULTY': return <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1 w-fit"><AlertTriangle size={10}/> Faulty</span>;
      default: return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-[10px] font-bold uppercase">{status}</span>;
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* DEVICES TABLE */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[600px] relative">
          <div className="bg-gray-50 p-4 border-b flex items-center justify-between">
             <div className="flex items-center gap-2">
               <Cpu className="text-gray-500" size={18} />
               <h3 className="font-bold text-gray-800">Tracker Hardware</h3>
               <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-1 rounded-full">{devices.length}</span>
             </div>
             {selectedDevices.length > 0 && canEdit && (
               <button onClick={() => setAssigningType('DEVICE')} className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-blue-700 transition shadow-sm flex items-center gap-1.5">
                 <UserCheck size={14}/> Assign ({selectedDevices.length})
               </button>
             )}
          </div>
          <div className="flex-1 overflow-auto p-4">
             <div className="space-y-3">
               {devices.map(device => (
                 <div key={device.id} className={`p-3 border rounded-lg transition ${selectedDevices.includes(device.id) ? 'border-blue-500 bg-blue-50/30' : 'hover:border-blue-300 bg-gray-50'}`}>
                    <div className="flex justify-between items-start mb-2">
                       <div className="flex items-start gap-3">
                         {canEdit && device.status === 'IN_STOCK' && (
                           <input type="checkbox" checked={selectedDevices.includes(device.id)} onChange={() => toggleDevice(device.id)} className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer" />
                         )}
                         <div className="text-sm">
                           <EditHardwareModal type="DEVICE" id={device.id} currentValue={device.imei} canEdit={canEdit} />
                           {device.assignedToName && device.status === 'IN_STOCK' && (
                             <p className="text-[10px] font-bold text-blue-600 mt-1 uppercase tracking-wider bg-blue-100/50 w-fit px-2 py-0.5 rounded flex items-center gap-1">
                               <UserCheck size={10}/> With: {device.assignedToName}
                             </p>
                           )}
                         </div>
                       </div>
                       {getStatusBadge(device.status)}
                    </div>
                    {device.status === 'INSTALLED' && device.job && (
                       <div className="text-xs text-gray-600 bg-white p-2 rounded border border-gray-100 ml-7">
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
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[600px] relative">
          <div className="bg-gray-50 p-4 border-b flex items-center justify-between">
             <div className="flex items-center gap-2">
               <CreditCard className="text-gray-500" size={18} />
               <h3 className="font-bold text-gray-800">Tracker SIM Cards</h3>
               <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-1 rounded-full">{sims.length}</span>
             </div>
             {selectedSims.length > 0 && canEdit && (
               <button onClick={() => setAssigningType('SIM')} className="bg-purple-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-purple-700 transition shadow-sm flex items-center gap-1.5">
                 <UserCheck size={14}/> Assign ({selectedSims.length})
               </button>
             )}
          </div>
          <div className="flex-1 overflow-auto p-4">
             <div className="space-y-3">
               {sims.map(sim => (
                 <div key={sim.id} className={`p-3 border rounded-lg transition ${selectedSims.includes(sim.id) ? 'border-purple-500 bg-purple-50/30' : 'hover:border-purple-300 bg-gray-50'}`}>
                    <div className="flex justify-between items-start mb-2">
                       <div className="flex items-start gap-3">
                         {canEdit && sim.status === 'IN_STOCK' && (
                           <input type="checkbox" checked={selectedSims.includes(sim.id)} onChange={() => toggleSim(sim.id)} className="mt-1 w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500 cursor-pointer" />
                         )}
                         <div className="text-sm">
                           <EditHardwareModal type="SIM" id={sim.id} currentValue={sim.simNumber} canEdit={canEdit} />
                           <div className="text-[10px] font-bold text-purple-600 uppercase mt-0.5">{sim.network || "UNKNOWN NETWORK"}</div>
                           {sim.assignedToName && sim.status === 'IN_STOCK' && (
                             <p className="text-[10px] font-bold text-blue-600 mt-1 uppercase tracking-wider bg-blue-100/50 w-fit px-2 py-0.5 rounded flex items-center gap-1">
                               <UserCheck size={10}/> With: {sim.assignedToName}
                             </p>
                           )}
                         </div>
                       </div>
                       {getStatusBadge(sim.status)}
                    </div>
                    {sim.status === 'INSTALLED' && sim.job && (
                       <div className="text-xs text-gray-600 bg-white p-2 rounded border border-gray-100 ml-7">
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

      {/* 🟢 MANUAL ASSIGNMENT MODAL */}
      {assigningType && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 relative">
            <button onClick={() => {setAssigningType(null); setInstallerName("")}} className="absolute top-4 right-4 text-gray-400 hover:text-red-500"><X size={20}/></button>
            
            <h3 className="text-lg font-black text-gray-900 mb-1">Assign {assigningType === 'DEVICE' ? 'Trackers' : 'SIM Cards'}</h3>
            <p className="text-sm text-gray-500 mb-6">Manually enter the name of the technician who is holding the selected {assigningType === 'DEVICE' ? selectedDevices.length : selectedSims.length} items.</p>
            
            <input 
              type="text"
              value={installerName}
              onChange={(e) => setInstallerName(e.target.value)}
              placeholder="Enter technician's name..."
              className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-sm font-bold bg-gray-50 mb-4"
            />

            <div className="flex flex-col gap-2">
              <button 
                onClick={() => handleAssign(installerName)} 
                disabled={loading || !installerName.trim()}
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                <UserCheck size={18}/> {loading ? "Assigning..." : "Confirm Assignment"}
              </button>
              
              <button 
                onClick={() => handleAssign(null)} 
                disabled={loading}
                className="w-full bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                <Building size={18}/> Return to Warehouse
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  )
}