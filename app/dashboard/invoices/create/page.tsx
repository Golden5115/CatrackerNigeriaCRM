'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { searchClientsForInvoice, createInvoice, getLastInvoiceDefaults } from "@/app/actions/invoice"
import { Plus, Trash2, Search, Loader2, Save } from "lucide-react"

export default function CreateInvoicePage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [clientSearch, setClientSearch] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  
  const [clientId, setClientId] = useState("")
  const [clientName, setClientName] = useState("")
  const [clientEmail, setClientEmail] = useState("")
  const [clientPhone, setClientPhone] = useState("")
  const [clientAddress, setClientAddress] = useState("")

  const [subject, setSubject] = useState("")
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState("")
  
  const [items, setItems] = useState([{ description: "", quantity: 1, unitPrice: 0 }])
  
  const [discountType, setDiscountType] = useState<'FIXED' | 'PERCENTAGE'>('PERCENTAGE')
  const [discountValue, setDiscountValue] = useState(0)
  const [taxPercentage, setTaxPercentage] = useState(0)
  const [notes, setNotes] = useState("Payment is due within 7 days. Thank you for your business.")
  
  const [bankName, setBankName] = useState("")
  const [accountName, setAccountName] = useState("")
  const [accountNumber, setAccountNumber] = useState("")

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const discountAmount = discountType === 'PERCENTAGE' ? subtotal * (discountValue / 100) : discountValue;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * (taxPercentage / 100);
  const total = taxableAmount + taxAmount;

  useEffect(() => {
    async function loadDefaults() {
      const defaults = await getLastInvoiceDefaults();
      if (defaults) {
        if (defaults.bankName) setBankName(defaults.bankName);
        if (defaults.accountName) setAccountName(defaults.accountName);
        if (defaults.accountNumber) setAccountNumber(defaults.accountNumber);
        if (defaults.notes) setNotes(defaults.notes);
      }
    }
    loadDefaults();
  }, []);
  
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (clientSearch.length >= 2 && clientSearch !== clientName) {
        setIsSearching(true)
        const results = await searchClientsForInvoice(clientSearch)
        setSearchResults(results)
        setIsSearching(false)
      } else {
        setSearchResults([])
      }
    }, 300)
    return () => clearTimeout(delayDebounceFn)
  }, [clientSearch, clientName])

  const selectClient = (c: any) => {
    setClientId(c.id)
    setClientName(c.fullName)
    setClientSearch(c.fullName)
    setClientEmail(c.email || "")
    setClientPhone(c.phoneNumber || "")
    setClientAddress(c.address || "")
    setSearchResults([])
  }

  const handleSubmit = async () => {
    if (!clientName || items.some(i => !i.description)) return alert("Client Name and Item Descriptions are required.")
    setIsSubmitting(true)
    
    const payload = {
      clientId, clientName, clientEmail, clientPhone, clientAddress,
      subject, issueDate, dueDate, items,
      subtotal, discountType, discountValue, taxPercentage, total,
      notes, bankName, accountName, accountNumber
    }

    const res = await createInvoice(payload)
    if (res.error) {
      alert(res.error)
      setIsSubmitting(false)
    } else {
      router.push(`/dashboard/invoices/${res.invoiceId}`)
    }
  }

  return (
    <div className="max-w-5xl mx-auto pb-12 space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Create Invoice</h2>
          <p className="text-gray-500">Generate a professional bill for a client.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        
        <div className="bg-[#84c47c] p-4 sm:p-6 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
           <h3 className="text-xl sm:text-2xl font-bold tracking-widest uppercase opacity-90">Invoice Details</h3>
           <div className="text-left sm:text-right w-full sm:w-auto border-t sm:border-t-0 border-white/20 pt-4 sm:pt-0">
             <div className="text-xs sm:text-sm font-bold opacity-80 uppercase">Total Amount</div>
             <div className="text-2xl sm:text-3xl font-bold">₦{total.toLocaleString()}</div>
           </div>
        </div>

        <div className="p-4 sm:p-8 space-y-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left: Client Info */}
            <div className="space-y-4 relative">
               <h4 className="font-bold text-gray-800 border-b pb-2">Bill To</h4>
               
               <div className="relative">
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Search or Type Name *</label>
                 <div className="relative">
                   <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                   <input 
                     value={clientSearch}
                     onChange={(e) => { setClientSearch(e.target.value); setClientName(e.target.value); setClientId(""); }}
                     placeholder="Search database or type new name..." 
                     className="w-full p-2.5 pl-10 border rounded-lg focus:ring-2 focus:ring-[#84c47c] outline-none" 
                   />
                 </div>
                 
                 {searchResults.length > 0 && (
                   <div className="absolute z-50 w-full mt-1 bg-white border shadow-xl rounded-lg overflow-hidden">
                     {searchResults.map(c => (
                       <button key={c.id} onClick={() => selectClient(c)} className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b text-sm">
                         <span className="font-bold text-gray-800 block">{c.fullName}</span>
                         <span className="text-xs text-gray-500">{c.phoneNumber} • {c.email || "No Email"}</span>
                       </button>
                     ))}
                   </div>
                 )}
               </div>

               {/* 🟢 FIXED: Changed grid-cols-2 to grid-cols-1 md:grid-cols-2 to stack on mobile */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone</label>
                   <input value={clientPhone} onChange={(e)=>setClientPhone(e.target.value)} className="w-full p-2.5 border rounded-lg outline-none" />
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                   <input value={clientEmail} onChange={(e)=>setClientEmail(e.target.value)} className="w-full p-2.5 border rounded-lg outline-none" />
                 </div>
               </div>
               <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Address</label>
                 <input value={clientAddress} onChange={(e)=>setClientAddress(e.target.value)} className="w-full p-2.5 border rounded-lg outline-none" />
               </div>
            </div>

            {/* Right: Invoice Data */}
            <div className="space-y-4">
               <h4 className="font-bold text-gray-800 border-b pb-2">Invoice Data</h4>
               <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Invoice Subject / Project Name</label>
                 <input value={subject} onChange={(e)=>setSubject(e.target.value)} placeholder="e.g. Fleet Installation - 5 Vehicles" className="w-full p-2.5 border rounded-lg outline-none" />
               </div>
               {/* 🟢 FIXED: Changed grid-cols-2 to grid-cols-1 md:grid-cols-2 to stack on mobile */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Issue Date</label>
                   <input type="date" value={issueDate} onChange={(e)=>setIssueDate(e.target.value)} className="w-full p-2.5 border rounded-lg outline-none" />
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Due Date</label>
                   <input type="date" value={dueDate} onChange={(e)=>setDueDate(e.target.value)} required className="w-full p-2.5 border rounded-lg outline-none border-orange-300" />
                 </div>
               </div>
            </div>
          </div>

          {/* --- MIDDLE: LINE ITEMS TABLE --- */}
          <div className="space-y-2">
            <div className="flex justify-between items-center border-b pb-2">
              <h4 className="font-bold text-gray-800">Line Items</h4>
            </div>
            
            {/* 🟢 FIXED: Wrapped the items in overflow-x-auto and min-w-[700px] so it safely scrolls horizontally on mobile without squishing */}
            <div className="bg-gray-50 rounded-xl p-1 overflow-x-auto w-full custom-scrollbar">
              <div className="min-w-[700px]">
                <div className="grid grid-cols-12 gap-2 px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <div className="col-span-6">Description</div>
                  <div className="col-span-2 text-center">Qty / Rate</div>
                  <div className="col-span-2 text-right">Unit Price (₦)</div>
                  <div className="col-span-2 text-right">Amount</div>
                </div>

                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-lg mb-1 border border-gray-100 shadow-sm relative group">
                    <div className="col-span-6">
                      <input value={item.description} onChange={(e) => { const newItems = [...items]; newItems[index].description = e.target.value; setItems(newItems); }} placeholder="Item description..." className="w-full p-2 border border-transparent hover:border-gray-200 focus:border-[#84c47c] rounded outline-none text-sm font-medium" />
                    </div>
                    <div className="col-span-2">
                      <input type="number" min="1" value={item.quantity} onChange={(e) => { const newItems = [...items]; newItems[index].quantity = Number(e.target.value); setItems(newItems); }} className="w-full p-2 border border-transparent hover:border-gray-200 focus:border-[#84c47c] rounded outline-none text-sm text-center" />
                    </div>
                    <div className="col-span-2">
                      <input type="number" value={item.unitPrice} onChange={(e) => { const newItems = [...items]; newItems[index].unitPrice = Number(e.target.value); setItems(newItems); }} className="w-full p-2 border border-transparent hover:border-gray-200 focus:border-[#84c47c] rounded outline-none text-sm text-right" />
                    </div>
                    <div className="col-span-2 text-right font-bold text-gray-800 pr-2">
                      ₦{(item.quantity * item.unitPrice).toLocaleString()}
                    </div>
                    
                    {items.length > 1 && (
                      <button onClick={() => { const newItems = [...items]; newItems.splice(index, 1); setItems(newItems); }} className="absolute -left-3 -top-2 bg-red-100 text-red-600 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition shadow-sm">
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => setItems([...items, { description: "", quantity: 1, unitPrice: 0 }])} className="text-sm font-bold text-[#84c47c] flex items-center gap-1 hover:text-[#6aa663] px-2 py-2">
              <Plus size={16} /> Add Line Item
            </button>
          </div>

          {/* --- BOTTOM ROW: TOTALS & BANK DETAILS --- */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 pt-6 border-t">
            
            {/* Left: Notes & Bank */}
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Terms & Conditions / Notes</label>
                <textarea value={notes} onChange={(e)=>setNotes(e.target.value)} rows={3} className="w-full p-3 border rounded-xl outline-none text-sm" />
              </div>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                 <h5 className="font-bold text-sm text-gray-800 flex items-center gap-2">Payment Details (Optional)</h5>
                 <div>
                   <input value={bankName} onChange={(e)=>setBankName(e.target.value)} placeholder="Bank Name (e.g. GTBank)" className="w-full p-2 text-sm border rounded mb-2 outline-none" />
                   <input value={accountName} onChange={(e)=>setAccountName(e.target.value)} placeholder="Account Name" className="w-full p-2 text-sm border rounded mb-2 outline-none" />
                   <input value={accountNumber} onChange={(e)=>setAccountNumber(e.target.value)} placeholder="Account Number" className="w-full p-2 text-sm border rounded outline-none" />
                 </div>
              </div>
            </div>

            {/* Right: Calculations */}
            <div className="bg-gray-50 rounded-2xl p-4 sm:p-6 border border-gray-200 h-fit space-y-4">
               <div className="flex justify-between items-center text-sm font-bold text-gray-600">
                 <span>Subtotal</span>
                 <span>₦{subtotal.toLocaleString()}</span>
               </div>
               
               <div className="flex justify-between items-center">
                 <div className="flex items-center gap-2">
                   <span className="text-sm font-bold text-gray-600">Discount</span>
                   <select value={discountType} onChange={(e)=>setDiscountType(e.target.value as any)} className="text-xs border rounded p-1">
                     <option value="PERCENTAGE">%</option>
                     <option value="FIXED">₦</option>
                   </select>
                   <input type="number" value={discountValue} onChange={(e)=>setDiscountValue(Number(e.target.value))} className="w-16 border rounded p-1 text-xs text-right" />
                 </div>
                 <span className="text-sm font-bold text-red-500">- ₦{discountAmount.toLocaleString()}</span>
               </div>

               <div className="flex justify-between items-center">
                 <div className="flex items-center gap-2">
                   <span className="text-sm font-bold text-gray-600">Tax / VAT</span>
                   <span className="text-xs bg-gray-200 px-2 py-1 rounded">%</span>
                   <input type="number" value={taxPercentage} onChange={(e)=>setTaxPercentage(Number(e.target.value))} className="w-16 border rounded p-1 text-xs text-right" />
                 </div>
                 <span className="text-sm font-bold text-gray-600">+ ₦{taxAmount.toLocaleString()}</span>
               </div>

               <hr className="border-gray-300" />
               
               <div className="flex justify-between items-center text-lg sm:text-xl font-bold text-[#84c47c]">
                 <span>Total Due</span>
                 <span>₦{total.toLocaleString()}</span>
               </div>

               <button onClick={handleSubmit} disabled={isSubmitting} className="w-full mt-4 bg-[#84c47c] text-white py-4 rounded-xl font-bold hover:bg-[#6aa663] transition shadow-lg shadow-green-500/20 flex justify-center items-center gap-2 text-lg">
                 {isSubmitting ? <Loader2 size={24} className="animate-spin" /> : <><Save size={24}/> Save Invoice</>}
               </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  )
}