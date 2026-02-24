'use client'

import { useState } from 'react'
import { searchAvailableStock } from '@/app/actions/inventory'
import { Search, X, CheckCircle } from 'lucide-react'

interface InventorySearchProps {
  type: 'DEVICE' | 'SIM'
  name: string
}

export default function InventorySearch({ type, name }: InventorySearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)

  const handleSearch = async (val: string) => {
    setQuery(val)
    if (val.length >= 3) {
      const res = await searchAvailableStock(val, type)
      setResults(res)
    } else {
      setResults([])
    }
  }

  // If they selected an item, show a green locked-in box
  if (selected) {
    return (
      <div className="bg-green-50 p-3 rounded-xl border border-green-200 flex justify-between items-center shadow-inner">
        <div className="flex items-center gap-2">
          <CheckCircle size={18} className="text-green-600" />
          <div>
            <p className="font-bold text-green-900 text-sm">
              {type === 'DEVICE' ? selected.imei : selected.simNumber}
            </p>
            {type === 'SIM' && <p className="text-[10px] text-green-700 uppercase">{selected.network}</p>}
            
            {/* THIS IS THE SECRET WEAPON: We submit the unique ID, not the text */}
            <input type="hidden" name={name} value={selected.id} />
          </div>
        </div>
        <button 
          type="button" 
          onClick={() => { setSelected(null); setQuery(''); }} 
          className="text-gray-400 hover:text-red-500 bg-white rounded-full p-1"
        >
          <X size={16} />
        </button>
      </div>
    )
  }

  // Default Search Input State
  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-3.5 text-gray-400" size={16} />
        <input
          type="text"
          placeholder={type === 'DEVICE' ? 'Search last 4 digits of IMEI...' : 'Search SIM...'}
          className="w-full pl-9 p-3 border rounded-xl bg-white shadow-inner text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
          onChange={(e) => handleSearch(e.target.value)}
          value={query}
        />
      </div>
      
      {/* The Dropdown List */}
      {results.length > 0 && (
        <div className="absolute w-full bg-white border shadow-2xl rounded-xl mt-2 z-50 overflow-hidden max-h-48 overflow-y-auto">
          {results.map(item => (
            <div
              key={item.id}
              onClick={() => { setSelected(item); setResults([]); }}
              className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0 transition"
            >
              <p className="font-bold text-gray-800 text-sm">{type === 'DEVICE' ? item.imei : item.simNumber}</p>
              {type === 'SIM' && <p className="text-[10px] text-gray-500 uppercase">{item.network}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}