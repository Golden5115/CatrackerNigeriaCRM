'use client'

import { useRef } from "react"
import { addDevice, addSimCard } from "@/app/actions/inventory"
import SubmitButton from "./SubmitButton"
import { Cpu, Smartphone } from "lucide-react"

export default function AddInventoryForms() {
  const deviceFormRef = useRef<HTMLFormElement>(null)
  const simFormRef = useRef<HTMLFormElement>(null)

  // Handle adding IMEI
  const handleAddDevice = async (formData: FormData) => {
    const res = await addDevice(formData)
    if (res?.error) {
      alert("Error: " + res.error)
    } else {
      deviceFormRef.current?.reset() // Clear the input on success
    }
  }

  // Handle adding SIM
  const handleAddSim = async (formData: FormData) => {
    const res = await addSimCard(formData)
    if (res?.error) {
      alert("Error: " + res.error)
    } else {
      simFormRef.current?.reset() // Clear the input on success
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      
      {/* ADD TRACKER FORM */}
      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Cpu className="text-blue-600" size={18} /> Add Tracker Hardware
        </h3>
        <form ref={deviceFormRef} action={handleAddDevice} className="flex gap-2">
          <input 
            type="number" 
            name="imei" 
            placeholder="Scan or type IMEI..." 
            required 
            className="flex-1 p-3 border rounded-lg font-mono text-sm outline-none focus:border-blue-500"
          />
          <SubmitButton className="bg-blue-600 text-white px-4 py-3 rounded-lg font-bold hover:bg-blue-700 whitespace-nowrap">
            Add Stock
          </SubmitButton>
        </form>
      </div>

      {/* ADD SIM CARD FORM */}
      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Smartphone className="text-purple-600" size={18} /> Add SIM Card
        </h3>
        <form ref={simFormRef} action={handleAddSim} className="flex gap-2">
          <select name="network" className="p-3 border rounded-lg text-sm bg-gray-50 outline-none focus:border-purple-500">
            <option value="MTN">MTN</option>
            <option value="Airtel">Airtel</option>
            <option value="Glo">Glo</option>
            <option value="9mobile">9mobile</option>
          </select>
          <input 
            type="number" 
            name="simNumber" 
            placeholder="080..." 
            required 
            className="flex-1 p-3 border rounded-lg font-mono text-sm outline-none focus:border-purple-500"
          />
          <SubmitButton className="bg-purple-600 text-white px-4 py-3 rounded-lg font-bold hover:bg-purple-700 whitespace-nowrap">
            Add Stock
          </SubmitButton>
        </form>
      </div>

    </div>
  )
}