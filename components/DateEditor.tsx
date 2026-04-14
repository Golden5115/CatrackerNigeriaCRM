'use client'

import { useState } from "react";
import { Calendar, Pencil, X, Loader2 } from "lucide-react";
import { updateInstallDate } from "@/app/actions/installer";

export default function DateEditor({ jobId, currentDisplayDate }: { jobId: string, currentDisplayDate: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!newDate) return setIsEditing(false);
    setIsSaving(true);
    const res = await updateInstallDate(jobId, newDate);
    if (res?.error) alert(res.error);
    setIsEditing(false);
    setIsSaving(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 bg-white p-1 rounded-lg border shadow-lg relative z-10 w-fit">
        <input 
          type="date" 
          value={newDate} 
          onChange={(e) => setNewDate(e.target.value)}
          className="text-[11px] p-1.5 border rounded outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button onClick={handleSave} disabled={isSaving} className="bg-blue-600 text-white text-[10px] px-2.5 py-1.5 rounded flex items-center font-bold hover:bg-blue-700 transition">
          {isSaving ? <Loader2 size={12} className="animate-spin" /> : "Save"}
        </button>
        <button onClick={() => setIsEditing(false)} className="bg-gray-100 text-gray-500 text-[10px] p-1.5 rounded hover:bg-gray-200 transition"><X size={12}/></button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 group w-fit">
      <div className={`text-[11px] font-medium flex items-center gap-1 px-2 py-1 rounded border ${currentDisplayDate === 'Pending' ? 'bg-gray-50 text-gray-400 border-gray-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
        <Calendar size={12} className={currentDisplayDate === 'Pending' ? 'text-gray-400' : 'text-green-500'}/> {currentDisplayDate}
      </div>
      <button onClick={() => setIsEditing(true)} className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-blue-600 transition bg-white rounded shadow-sm border border-gray-200">
        <Pencil size={10} />
      </button>
    </div>
  );
}