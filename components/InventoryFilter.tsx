'use client'

import { useRouter, useSearchParams } from "next/navigation"

export default function InventoryFilter({ currentFilter = 'ALL' }: { currentFilter?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  return (
    <select 
      value={currentFilter}
      onChange={(e) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('status', e.target.value)
        router.push(`?${params.toString()}`)
      }}
      className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-[#84c47c] focus:border-[#84c47c] block w-full sm:w-48 p-2.5 outline-none font-medium cursor-pointer shadow-sm"
    >
      <option value="ALL">All Inventory</option>
      <option value="IN_STOCK">🟢 Unused (In Stock)</option>
      <option value="INSTALLED">🔵 Used (Installed)</option>
      <option value="FAULTY">🔴 Faulty / Rejected</option>
    </select>
  )
}