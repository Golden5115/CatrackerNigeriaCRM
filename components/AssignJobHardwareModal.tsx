'use client'

import { useState, useEffect } from "react"
import { Edit2, AlertCircle, X } from "lucide-react"
import { updateJobHardware, searchAvailableStock } from "@/app/actions/inventory"

export default function AssignJobHardwareModal({
  jobId, type, currentValue, canEdit
}: {
  jobId: string, type: 'DEVICE' | 'SIM', currentValue: string | undefined | null, canEdit: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [value, setValue] = useState(currentValue || "")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<any[]>([])

  // Smart Debounced Search
  useEffect(() => {
    if (!isOpen || value.length < 3 || value === currentValue) {
      setSuggestions([])
      return
    }
    const fetchStock = async () => {
      const res = await searchAvailableStock(value, type)
      setSuggestions(res)
    }
    const timeout = setTimeout(fetchStock, 300)
    return () => clearTimeout(timeout)
  }, [value, isOpen, currentValue, type])

  if (!canEdit) {
    return <span className="font-mono font-bold text-gray-800 break-all">{currentValue || "---"}</span>
  }

  async function handleSave(selectedValue?: string) {
    const finalValue = (selectedValue || value).trim();
    if (!finalValue || finalValue === currentValue) {
      setIsOpen(false)
      return
    }
    setLoading(true); setError("");

    const res = await updateJobHardware(jobId, type, finalValue)
    if (res?.error) setError(res.error)
    else setIsOpen(false)
    
    setLoading(false)
  }

  return (
    <div className="flex items-center gap-2 relative">
      <span className="font-mono font-bold text-gray-800 break-all">{currentValue || "---"}</span>
      <button onClick={() => setIsOpen(true)} className="text-gray-400 hover:text-blue-600 transition">
        <Edit2 size={14} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 shadow-xl rounded-xl p-4 z-50 w-72">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
              Assign {type === 'DEVICE' ? 'IMEI' : 'SIM'}
            </h4>
            <button onClick={() => { setIsOpen(false); setValue(currentValue || ""); setError("") }} className="text-gray-400 hover:text-red-500 transition">
              <X size={14}/>
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm font-mono font-bold mb-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              placeholder={`Search IN_STOCK or type new...`}
            />
            
            {/* AutoComplete Dropdown */}
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 shadow-lg rounded-lg overflow-hidden z-10">
                {suggestions.map(item => (
                  <button
                    key={item.id}
                    onClick={() => { 
                      const val = type === 'DEVICE' ? item.imei : item.simNumber;
                      setValue(val); 
                      handleSave(val); 
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-blue-50 border-b last:border-b-0 flex items-center justify-between"
                  >
                    <span className="font-mono text-sm font-bold text-gray-800">{type === 'DEVICE' ? item.imei : item.simNumber}</span>
                    <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded">IN STOCK</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-2 rounded-lg text-[10px] font-bold flex items-start gap-1.5 mt-1 mb-2">
              <AlertCircle size={12} className="shrink-0 mt-0.5" />
              <p className="leading-tight">{error}</p>
            </div>
          )}
          
          <button onClick={() => handleSave()} disabled={loading} className="w-full bg-blue-600 text-white font-bold text-xs py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">
            {loading ? "Saving..." : "Update Hardware"}
          </button>
        </div>
      )}
    </div>
  )
}