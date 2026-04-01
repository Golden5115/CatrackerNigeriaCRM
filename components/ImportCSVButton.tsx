'use client'

import { useState, useRef } from "react"
import { Upload, Loader2, FileUp, Database, ArrowLeft, RotateCcw, CheckCircle } from "lucide-react"
import { processCSVChunk, rollbackImport, undoLastImport } from "@/app/actions/importClients"


export default function ImportCSVButton() {
  const [step, setStep] = useState<'IDLE' | 'MAPPING' | 'IMPORTING' | 'SUCCESS'>('IDLE')
  const [file, setFile] = useState<File | null>(null)
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  
  // Mapping State
  const [mapName, setMapName] = useState("")
  const [mapPhone, setMapPhone] = useState("")
  const [mapEmail, setMapEmail] = useState("")
  const [mapAddress, setMapAddress] = useState("")
  const [mapDate, setMapDate] = useState("") 

  // Success & Progress State
  const [result, setResult] = useState<{inserted: number, skipped: number, batchId: string} | null>(null)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [isRollingBack, setIsRollingBack] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (selectedFile.type !== "text/csv" && !selectedFile.name.endsWith('.csv')) {
      alert("Please upload a valid .csv file.")
      return
    }

    const text = await selectedFile.text()
    const firstLine = text.split('\n')[0]
    const headers = firstLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''))

    setCsvHeaders(headers)
    setFile(selectedFile)
    setStep('MAPPING')

    setMapName(headers.find(h => h.toLowerCase().includes('name')) || "")
    setMapPhone(headers.find(h => h.toLowerCase().includes('phone') || h.toLowerCase().includes('mobile')) || "")
    setMapEmail(headers.find(h => h.toLowerCase().includes('email')) || "")
    setMapAddress(headers.find(h => h.toLowerCase().includes('address')) || "")
    setMapDate(headers.find(h => h.toLowerCase().includes('date') || h.toLowerCase().includes('created')) || "") 
  }

  // 🛑 NEW: CHUNKING LOGIC
  const executeImport = async () => {
    if (!file || !mapName || !mapPhone) {
      alert("Name and Phone mappings are mandatory.")
      return
    }

    setStep('IMPORTING')
    
    // Read whole file in the browser
    const text = await file.text()
    const rows = text.split('\n').filter(row => row.trim().length > 0)
    
    const headers = rows[0]
    const dataRows = rows.slice(1) // Remove headers from data
    
    setProgress({ current: 0, total: dataRows.length })
    
    const batchId = `BATCH_${Date.now()}`
    const CHUNK_SIZE = 1000; // Easily bypasses 1MB limits
    
    let totalInserted = 0
    let totalSkipped = 0

    const mapping = {
      fullName: mapName,
      phoneNumber: mapPhone,
      email: mapEmail,
      address: mapAddress,
      createdAt: mapDate
    }

    // Loop and send chunks one by one
    for (let i = 0; i < dataRows.length; i += CHUNK_SIZE) {
      const chunk = dataRows.slice(i, i + CHUNK_SIZE)
      const chunkText = [headers, ...chunk].join('\n') // Put headers back on top of chunk
      
      const res = await processCSVChunk(chunkText, mapping, batchId)

      if (res.error) {
        alert(`Import Failed at row ${i}: ${res.error}`)
        setStep('IDLE')
        setFile(null)
        return
      }

      totalInserted += res.inserted ?? 0
      totalSkipped += res.skipped ?? 0
      
      // Update UI Live Progress
      setProgress({ current: Math.min(i + CHUNK_SIZE, dataRows.length), total: dataRows.length })
    }

    setResult({ inserted: totalInserted, skipped: totalSkipped, batchId })
    setStep('SUCCESS')
  }

  const handleRollback = async () => {
    if (!result?.batchId) return
    setIsRollingBack(true)
    
    const res = await rollbackImport(result.batchId)
    if (res.error) {
      alert(`Rollback failed: ${res.error}`)
    } else {
      alert(`Rollback successful! Removed ${res.deleted} imported clients.`)
      setStep('IDLE')
      setFile(null)
      setResult(null)
    }
    setIsRollingBack(false)
  }

  const reset = () => {
    setStep('IDLE'); setFile(null); setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

 const handleEmergencyUndo = async () => {
    if (!confirm("Are you sure you want to delete the last batch of imported clients? This cannot be undone.")) return;
    
    setIsRollingBack(true)
    // 👇 Calls our new emergency function
    const res = await undoLastImport() 
    if (res.error) {
      alert(`Rollback failed: ${res.error}`)
    } else {
      alert(`Success! Permanently deleted ${res.deleted} imported clients.`)
    }
    setIsRollingBack(false)
  }

  if (step === 'IDLE') {
    return (
      <div className="flex items-center gap-2">
        <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
        
        {/* Permanent Emergency Undo Button */}
        <button 
          onClick={handleEmergencyUndo} 
          disabled={isRollingBack}
          className="w-full sm:w-auto justify-center bg-red-50 text-red-600 border border-red-200 px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-red-100 transition shadow-sm disabled:opacity-50"
        >
          {isRollingBack ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />} Undo Last Import
        </button>

        <button 
          onClick={() => fileInputRef.current?.click()} 
          className="w-full sm:w-auto justify-center bg-blue-50 text-blue-600 border border-blue-200 px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-blue-100 transition shadow-sm"
        >
          <FileUp size={14} /> Import Zoho CSV
        </button>
      </div>
    )
  }

  if (step === 'SUCCESS' && result) {
    return (
      <div className="flex items-center gap-3 bg-green-50 border border-green-200 p-2 rounded-xl shadow-sm">
        <div className="flex flex-col px-2">
          <span className="text-xs font-bold text-green-800 flex items-center gap-1"><CheckCircle size={12}/> Import Complete</span>
          <span className="text-[10px] text-green-600">{result.inserted} Added • {result.skipped} Skipped (Duplicates)</span>
        </div>
        <div className="border-l border-green-200 pl-3 flex gap-2">
          <button onClick={handleRollback} disabled={isRollingBack} className="bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 hover:bg-red-200 transition disabled:opacity-50">
            {isRollingBack ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />} Undo
          </button>
          <button onClick={reset} className="bg-white text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-gray-50 transition">Done</button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-blue-200 shadow-lg rounded-xl p-4 w-full sm:w-[400px] z-50 absolute right-8 top-24">
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <h3 className="font-bold text-sm text-gray-800 flex items-center gap-2"><Database size={16} className="text-blue-500" /> Map CSV Columns</h3>
        <button onClick={reset} className="text-gray-400 hover:text-gray-600"><ArrowLeft size={16}/></button>
      </div>
      
      <div className="space-y-3 mb-4">
        {[
          { label: "Client Full Name *", val: mapName, setter: setMapName, req: true },
          { label: "Phone Number *", val: mapPhone, setter: setMapPhone, req: true },
          { label: "Email Address", val: mapEmail, setter: setMapEmail, req: false },
          { label: "Physical Address", val: mapAddress, setter: setMapAddress, req: false },
          { label: "Date Added (Zoho)", val: mapDate, setter: setMapDate, req: false }
        ].map((field, i) => (
          <div key={i} className="flex justify-between items-center text-xs">
            <label className={`font-bold ${field.req ? 'text-gray-800' : 'text-gray-500'}`}>{field.label}</label>
            <select value={field.val} onChange={(e) => field.setter(e.target.value)} className="w-40 border rounded p-1.5 outline-none focus:border-blue-500 max-w-[50%]">
              <option value="">-- Ignore --</option>
              {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
        ))}
      </div>

      <button onClick={executeImport} disabled={step === 'IMPORTING'} className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-xs font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-80">
        {step === 'IMPORTING' ? (
          <><Loader2 size={14} className="animate-spin" /> {progress.current} / {progress.total} Processed...</>
        ) : (
          <><Upload size={14} /> Run Database Import</>
        )}
      </button>
    </div>
  )
}