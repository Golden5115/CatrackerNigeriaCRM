'use client'

import { useRef, useState } from "react"
import { addDevice, addSimCard } from "@/app/actions/inventory"
import SubmitButton from "./SubmitButton"
import { Cpu, Smartphone, AlertCircle, CheckCircle2 } from "lucide-react"

export default function AddInventoryForms() {
  const deviceFormRef = useRef<HTMLFormElement>(null)
  const simFormRef = useRef<HTMLFormElement>(null)

  const [deviceError, setDeviceError] = useState("")
  const [deviceSuccess, setDeviceSuccess] = useState("")
  const [simError, setSimError] = useState("")
  const [simSuccess, setSimSuccess] = useState("")

  const handleAddDevice = async (formData: FormData) => {
    setDeviceError(""); setDeviceSuccess("");
    const res = await addDevice(formData)
    if (res?.error) {
      setDeviceError(res.error)
    } else {
      setDeviceSuccess("Hardware added successfully!")
      deviceFormRef.current?.reset()
      setTimeout(() => setDeviceSuccess(""), 3000)
    }
  }

  const handleAddSim = async (formData: FormData) => {
    setSimError(""); setSimSuccess("");
    const res = await addSimCard(formData)
    if (res?.error) {
      setSimError(res.error)
    } else {
      setSimSuccess("SIM card added successfully!")
      simFormRef.current?.reset()
      setTimeout(() => setSimSuccess(""), 3000)
    }
  }

  return (
   <div className="flex flex-col lg:flex-row gap-4 w-full lg:w-auto items-stretch lg:items-center">
      
      {/* ADD TRACKER FORM */}
      <div className="bg-white p-6 rounded-xl border shadow-sm flex-1">
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
        {deviceError && <p className="text-xs font-bold text-red-600 mt-2 flex items-center gap-1 bg-red-50 p-2 rounded"><AlertCircle size={14}/> {deviceError}</p>}
        {deviceSuccess && <p className="text-xs font-bold text-green-600 mt-2 flex items-center gap-1 bg-green-50 p-2 rounded"><CheckCircle2 size={14}/> {deviceSuccess}</p>}
      </div>

      {/* ADD SIM CARD FORM */}
      <div className="bg-white p-6 rounded-xl border shadow-sm flex-1">
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
        {simError && <p className="text-xs font-bold text-red-600 mt-2 flex items-center gap-1 bg-red-50 p-2 rounded"><AlertCircle size={14}/> {simError}</p>}
        {simSuccess && <p className="text-xs font-bold text-green-600 mt-2 flex items-center gap-1 bg-green-50 p-2 rounded"><CheckCircle2 size={14}/> {simSuccess}</p>}
      </div>

    </div>
  )
}