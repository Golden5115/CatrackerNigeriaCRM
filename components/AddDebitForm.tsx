'use client'

import { useState } from "react"
import { Plus, X, AlertCircle, CheckCircle } from "lucide-react"
import { addDebit } from "@/app/actions/accounts"

const CATEGORIES = ['Recharge', 'Logistics', 'Waybill', 'Utility', 'Salary', 'Loan', 'Gift', 'Purchase', 'Custom']

export default function AddDebitForm() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [category, setCategory] = useState("Logistics")

  // 🟢 NEW: State to handle the comma formatting
  const [rawAmount, setRawAmount] = useState("")
  const [displayAmount, setDisplayAmount] = useState("")

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 1. Strip out everything except numbers and decimals
    let val = e.target.value.replace(/[^0-9.]/g, '');
    
    // 2. Prevent the user from typing multiple decimal points
    const parts = val.split('.');
    if (parts.length > 2) {
       parts.pop();
       val = parts.join('.');
    }

    setRawAmount(val); // Save the clean mathematical number

    // 3. Format the display string with commas
    if (val) {
       const formattedParts = val.split('.');
       formattedParts[0] = Number(formattedParts[0]).toLocaleString('en-US'); // Add commas to thousands
       setDisplayAmount(formattedParts.join('.'));
    } else {
       setDisplayAmount("");
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true); setError(""); setSuccess("");

    const formData = new FormData(e.currentTarget)
    const res = await addDebit(formData)

    if (res?.error) {
      setError(res.error)
    } else {
      setSuccess("Debit recorded successfully!")
      setTimeout(() => { 
        setIsOpen(false); 
        setSuccess(""); 
        setRawAmount(""); 
        setDisplayAmount(""); 
      }, 1500)
    }
    setLoading(false)
  }

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="bg-red-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-red-700 transition shadow-sm border border-red-700">
        <Plus size={18} /> Log Expense
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100 relative">
            <button onClick={() => setIsOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-red-500 transition"><X size={20} /></button>
            <h3 className="text-xl font-black text-gray-900 mb-6">Record Debit</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Amount (₦) *</label>
                  {/* 🟢 NEW: Hidden input quietly sends the clean number (e.g. 4000) to the backend */}
                  <input type="hidden" name="amount" value={rawAmount} />
                  
                  {/* 🟢 NEW: Visible input formats it beautifully (e.g. 4,000) for the user */}
                  <input 
                    type="text" 
                    value={displayAmount}
                    onChange={handleAmountChange}
                    required 
                    className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition text-sm font-black bg-white" 
                    placeholder="0.00" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Received By *</label>
                  <input type="text" name="recipientName" required className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition text-sm font-bold bg-white" placeholder="Name of payee..." />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date *</label>
                  <input type="datetime-local" name="date" required defaultValue={new Date().toISOString().slice(0, 16)} className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition text-sm font-medium bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category *</label>
                  <select name="category" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition text-sm font-medium bg-white">
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>

              {category === 'Custom' && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Custom Reason *</label>
                  <input type="text" name="reason" required placeholder="Specify the custom reason..." className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition text-sm font-medium bg-white" />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Optional Note</label>
                <textarea name="note" rows={2} placeholder="Any additional details..." className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition text-sm font-medium resize-none bg-white"></textarea>
              </div>

              {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold flex items-center gap-2"><AlertCircle size={16} /> {error}</div>}
              {success && <div className="bg-green-50 text-green-700 p-3 rounded-xl text-xs font-bold flex items-center gap-2"><CheckCircle size={16} /> {success}</div>}

              <div className="pt-2">
                <button type="submit" disabled={loading} className="w-full bg-red-600 text-white font-bold py-3.5 rounded-xl hover:bg-red-700 transition shadow-sm disabled:opacity-50">
                  {loading ? "Recording..." : "Save Debit Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}