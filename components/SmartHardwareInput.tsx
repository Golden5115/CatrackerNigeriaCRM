'use client'

import { useState, useEffect, useRef } from "react"
import { searchAvailableStock } from "@/app/actions/inventory"
import { CheckCircle } from "lucide-react"

export default function SmartHardwareInput({ type, defaultValue, name }: { type: 'DEVICE' | 'SIM', defaultValue?: string, name: string }) {
  const [value, setValue] = useState(defaultValue || "")
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Fetch from warehouse as the user types
  useEffect(() => {
    if (value.length < 3 || !isOpen) {
      setSuggestions([])
      return
    }
    const fetchStock = async () => {
      const res = await searchAvailableStock(value, type)
      setSuggestions(res)
    }
    const timeout = setTimeout(fetchStock, 300)
    return () => clearTimeout(timeout)
  }, [value, isOpen, type])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <input
        type="text"
        name={name}
        value={value}
        onChange={(e) => { setValue(e.target.value); setIsOpen(true); }}
        onFocus={() => setIsOpen(true)}
        className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-sm font-mono font-bold bg-white"
        placeholder={`Search IN_STOCK ${type === 'DEVICE' ? 'IMEI' : 'SIM'}...`}
        required
      />
      
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 shadow-xl rounded-xl overflow-hidden z-50 max-h-48 overflow-y-auto">
          {suggestions.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => { 
                setValue(type === 'DEVICE' ? item.imei : item.simNumber);
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 flex items-center justify-between transition"
            >
              <span className="font-mono text-sm font-bold text-gray-800">{type === 'DEVICE' ? item.imei : item.simNumber}</span>
              <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-1 rounded flex items-center gap-1"><CheckCircle size={10}/> IN_STOCK</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}