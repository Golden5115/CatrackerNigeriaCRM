'use client'

import { deleteJobTicket } from "@/app/actions/manageClient"
import { Trash2 } from "lucide-react"

export default function DeleteJobButton({ jobId }: { jobId: string }) {
  return (
    <button 
      onClick={async () => {
        if (confirm("Delete this job ticket? The client and their other vehicles/jobs will remain untouched.")) {
          await deleteJobTicket(jobId)
        }
      }}
      className="text-gray-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition"
      title="Delete Job Ticket"
    >
      <Trash2 size={14} />
    </button>
  )
}
