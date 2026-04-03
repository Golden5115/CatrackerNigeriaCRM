'use client'

import { Printer } from "lucide-react"

export default function PrintInvoiceButton() {
  return (
    <button 
      onClick={() => window.print()} 
      className="bg-gray-800 text-white px-4 py-2 rounded font-bold text-sm hover:bg-gray-900 transition flex items-center gap-2"
    >
      <Printer size={16} /> Print / Save PDF
    </button>
  )
}