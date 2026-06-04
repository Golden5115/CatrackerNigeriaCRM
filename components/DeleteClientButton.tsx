'use client'

import { deleteClient } from "@/app/actions/manageClient"
import { Trash2 } from "lucide-react"

export default function DeleteClientButton({ clientId }: { clientId: string }) {
  return (
    <button 
      onClick={async () => {
        // 🟢 FIXED: Friendly warning message
        if (confirm("Archive this client? They will be hidden from the CRM, but their data will be saved safely.")) {
          await deleteClient(clientId)
        }
      }}
      className="text-gray-400 hover:text-orange-600 p-2 hover:bg-orange-50 rounded-lg transition"
      title="Archive Client"
    >
      <Trash2 size={20} />
    </button>
  )
}