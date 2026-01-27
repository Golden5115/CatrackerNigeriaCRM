'use client'

import { deleteClient } from "@/app/actions/manageClient"
import { Trash2 } from "lucide-react"

export default function DeleteClientButton({ clientId }: { clientId: string }) {
  return (
    <button 
      onClick={async () => {
        if (confirm("Are you sure? This will delete the client, their vehicles, and jobs permanently.")) {
          await deleteClient(clientId)
        }
      }}
      className="text-gray-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition"
      title="Delete Client"
    >
      <Trash2 size={20} />
    </button>
  )
}