'use client'

import { useState } from "react"
import { Car, Hash, Calendar, Plus, Trash2 } from "lucide-react"
import SubmitButton from "@/components/SubmitButton"
import { addVehicleToClient } from "@/app/actions/addVehicleToClient"
import Link from "next/link"

export default function AddMultipleVehiclesForm({ clientId }: { clientId: string }) {
  // Start with 1 vehicle row by default
  const [vehicles, setVehicles] = useState([{ id: Date.now(), name: '', year: '', plateNumber: '' }])
  
  const addRow = () => setVehicles([...vehicles, { id: Date.now(), name: '', year: '', plateNumber: '' }])
  
  const removeRow = (id: number) => {
    if (vehicles.length > 1) {
      setVehicles(vehicles.filter(v => v.id !== id))
    }
  }

  const updateRow = (id: number, field: string, value: string) => {
    setVehicles(vehicles.map(v => v.id === id ? { ...v, [field]: value } : v))
  }

  const inputClass = "w-full border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 py-3 pr-4 pl-10 text-sm text-gray-700 bg-white placeholder-gray-400";

  return (
     <form action={addVehicleToClient} className="space-y-6">
        <input type="hidden" name="clientId" value={clientId} />
        {/* Safely strings the array to send to the backend */}
        <input type="hidden" name="vehiclesData" value={JSON.stringify(vehicles)} />

        <div className="space-y-6">
          {vehicles.map((v, index) => (
             <div key={v.id} className="p-6 border border-gray-100 bg-gray-50/50 rounded-2xl relative group shadow-sm transition-all">
                {/* Only show delete button if there's more than 1 vehicle */}
                {vehicles.length > 1 && (
                   <button type="button" onClick={() => removeRow(v.id)} className="absolute -top-3 -right-3 bg-white border border-red-200 text-red-500 hover:bg-red-50 p-2 rounded-full shadow-md transition z-10">
                     <Trash2 size={16} />
                   </button>
                )}
                
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded">#{index + 1}</span> Vehicle Details
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="lg:col-span-2">
                    <label className="block text-[11px] font-bold text-gray-500 mb-1">Vehicle Name / Model *</label>
                    <div className="relative">
                      <Car className="absolute left-3 top-3 text-gray-400" size={18} />
                      <input required value={v.name} onChange={(e) => updateRow(v.id, 'name', e.target.value)} placeholder="e.g. Toyota Camry" className={inputClass} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1">Year</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 text-gray-400" size={18} />
                      <input value={v.year} onChange={(e) => updateRow(v.id, 'year', e.target.value)} placeholder="e.g. 2018" className={inputClass} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1">Plate Number</label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-3 text-gray-400" size={18} />
                      <input value={v.plateNumber} onChange={(e) => updateRow(v.id, 'plateNumber', e.target.value)} placeholder="ABC-123-XY" className={`${inputClass} font-mono uppercase`} />
                    </div>
                  </div>
                </div>
             </div>
          ))}
        </div>

        {/* 🟢 Add Another Vehicle Button */}
        <div className="flex justify-start">
           <button type="button" onClick={addRow} className="flex items-center gap-2 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2.5 rounded-xl transition border border-blue-200 shadow-sm">
             <Plus size={16} /> Add Another Vehicle
           </button>
        </div>

        <div className="pt-6 border-t border-gray-100 flex gap-4">
           <Link 
             href={`/dashboard/clients/${clientId}`}
             className="px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 font-bold transition flex items-center justify-center w-1/3"
           >
             Cancel
           </Link>
           <SubmitButton 
             className="flex-1 bg-[#84c47c] text-white py-3 rounded-xl font-bold hover:bg-[#6aa663] shadow-lg transition text-lg"
             loadingText="Creating Tickets..."
           >
             Create Job Tickets ({vehicles.length})
           </SubmitButton>
        </div>
     </form>
  )
}