'use client'

import { useState } from "react"
import { Pencil } from "lucide-react"
import EditUserModal from "@/components/EditUserModal" // 👈 Using the new Master Modal

export default function EditAccessButton({ user }: { user: any }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 text-gray-600 hover:text-blue-600 bg-white border px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm hover:shadow"
      >
        <Pencil size={12} /> Edit User
      </button>

      {isOpen && (
        <EditUserModal user={user} onClose={() => setIsOpen(false)} />
      )}
    </>
  )
}