'use client'

import { useState } from "react"
import { Edit2, AlertCircle, X } from "lucide-react"
import { editHardware } from "@/app/actions/inventory"

export default function EditHardwareModal({
  type, id, currentValue, canEdit
}: {
  type: 'DEVICE' | 'SIM', id: string, currentValue: string, canEdit: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [value, setValue] = useState(currentValue)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  if (!canEdit) {
    return <span className="font-mono font-bold text-gray-800 break-all">{currentValue}</span>
  }

  async function handleSave() {
    if (!value.trim() || value === currentValue) {
      setIsOpen(false)
      return
    }
    setLoading(true); setError("");
    
    const res = await editHardware(type, id, value.trim())
    if (res?.error) setError(res.error)
    else setIsOpen(false)
    setLoading(false)
  }

  return (
    <div className="flex items-center gap-2 relative">
      <span className="font-mono font-bold text-gray-800 break-all">{currentValue}</span>
      <button onClick={() => setIsOpen(true)} className="text-gray-400 hover:text-blue-600 transition">
        <Edit2 size={14} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 shadow-xl rounded-xl p-4 z-50 w-64">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
              Edit {type === 'DEVICE' ? 'IMEI' : 'SIM'}
            </h4>
            <button onClick={() => { setIsOpen(false); setValue(currentValue); setError("") }} className="text-gray-400 hover:text-red-500 transition">
              <X size={14}/>
            </button>
          </div>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full p-2.5 border border-gray-300 rounded-lg text-sm font-mono font-bold mb-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
          {error && (
            <div className="bg-red-50 text-red-600 p-2 rounded-lg text-[10px] font-bold mb-3 flex items-start gap-1.5">
              <AlertCircle size={12} className="shrink-0 mt-0.5" />
              <p className="leading-tight">{error}</p>
            </div>
          )}
          <button onClick={handleSave} disabled={loading} className="w-full bg-blue-600 text-white font-bold text-xs py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}
    </div>
  )
}