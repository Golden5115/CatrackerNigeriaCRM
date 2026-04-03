'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { updateInvoice } from "@/app/actions/invoice"
import { Plus, Trash2, Loader2, Save } from "lucide-react"

export default function EditInvoiceForm({ invoice }: { invoice: any }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Pre-fill State from existing invoice
  const [clientId] = useState(invoice.clientId || "")
  const [clientName, setClientName] = useState(invoice.clientName || "")
  const [clientEmail, setClientEmail] = useState(invoice.clientEmail || "")
  const [clientPhone, setClientPhone] = useState(invoice.clientPhone || "")
  const [clientAddress, setClientAddress] = useState(invoice.clientAddress || "")

  const [subject, setSubject] = useState(invoice.subject || "")
  const [issueDate, setIssueDate] = useState(new Date(invoice.issueDate).toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState(new Date(invoice.dueDate).toISOString().split('T')[0])
  
  // Format items from Prisma Decimals to Numbers
  const [items, setItems] = useState(invoice.items.map((i: any) => ({
    description: i.description,
    quantity: Number(i.quantity),
    unitPrice: Number(i.unitPrice)
  })))
  
  const [discountType, setDiscountType] = useState<'FIXED' | 'PERCENTAGE'>(invoice.discountType as any)
  const [discountValue, setDiscountValue] = useState(Number(invoice.discountValue))
  const [taxPercentage, setTaxPercentage] = useState(Number(invoice.taxPercentage))
  const [notes, setNotes] = useState(invoice.notes || "")
  
  const [bankName, setBankName] = useState(invoice.bankName || "")
  const [accountName, setAccountName] = useState(invoice.accountName || "")
  const [accountNumber, setAccountNumber] = useState(invoice.accountNumber || "")

  // Live Math
  const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);
  const discountAmount = discountType === 'PERCENTAGE' ? subtotal * (discountValue / 100) : discountValue;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * (taxPercentage / 100);
  const total = taxableAmount + taxAmount;

  const handleSubmit = async () => {
    if (!clientName || items.some((i: any) => !i.description)) return alert("Client Name and Item Descriptions are required.")
    setIsSubmitting(true)
    
    const payload = {
      clientId, clientName, clientEmail, clientPhone, clientAddress,
      subject, issueDate, dueDate, items,
      subtotal, discountType, discountValue, taxPercentage, total,
      notes, bankName, accountName, accountNumber
    }

    const res = await updateInvoice(invoice.id, payload)
    if (res.error) {
      alert(res.error)
      setIsSubmitting(false)
    } else {
      router.push(`/dashboard/invoices/${invoice.id}`)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        
      {/* BRANDED HEADER */}
      <div className="bg-[#84c47c] p-6 text-white flex justify-between items-center">
          <h3 className="text-xl font-bold tracking-widest uppercase opacity-90">Edit Invoice #{invoice.invoiceNumber}</h3>
          <div className="text-right">
            <div className="text-sm font-bold opacity-80 uppercase">Total Amount</div>
            <div className="text-3xl font-bold">₦{total.toLocaleString()}</div>
          </div>
      </div>

      <div className="p-8 space-y-8">
        
        {/* TOP ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
              <h4 className="font-bold text-gray-800 border-b pb-2">Bill To</h4>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Client Name *</label>
                <input value={clientName} onChange={(e)=>setClientName(e.target.value)} className="w-full p-2.5 border rounded-lg outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
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

          <div className="space-y-4">
              <h4 className="font-bold text-gray-800 border-b pb-2">Invoice Data</h4>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Subject</label>
                <input value={subject} onChange={(e)=>setSubject(e.target.value)} className="w-full p-2.5 border rounded-lg outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
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

        {/* LINE ITEMS */}
        <div className="space-y-2">
          <h4 className="font-bold text-gray-800 border-b pb-2">Line Items</h4>
          <div className="bg-gray-50 rounded-xl p-1">
            <div className="grid grid-cols-12 gap-2 px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <div className="col-span-6">Description</div>
              <div className="col-span-2 text-center">Qty / Rate</div>
              <div className="col-span-2 text-right">Unit Price (₦)</div>
              <div className="col-span-2 text-right">Amount</div>
            </div>

            {items.map((item: any, index: number) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-lg mb-1 border border-gray-100 shadow-sm relative group">
                <div className="col-span-6">
                  <input value={item.description} onChange={(e) => { const newItems = [...items]; newItems[index].description = e.target.value; setItems(newItems); }} className="w-full p-2 border border-transparent hover:border-gray-200 focus:border-[#84c47c] rounded outline-none text-sm font-medium" />
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

          <button onClick={() => setItems([...items, { description: "", quantity: 1, unitPrice: 0 }])} className="text-sm font-bold text-[#84c47c] flex items-center gap-1 hover:text-[#6aa663] px-2 py-2">
            <Plus size={16} /> Add Line Item
          </button>
        </div>

        {/* BOTTOM ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-6 border-t">
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Terms & Conditions / Notes</label>
              <textarea value={notes} onChange={(e)=>setNotes(e.target.value)} rows={3} className="w-full p-3 border rounded-xl outline-none text-sm" />
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                <h5 className="font-bold text-sm text-gray-800">Payment Details</h5>
                <div>
                  <input value={bankName} onChange={(e)=>setBankName(e.target.value)} placeholder="Bank Name" className="w-full p-2 text-sm border rounded mb-2 outline-none" />
                  <input value={accountName} onChange={(e)=>setAccountName(e.target.value)} placeholder="Account Name" className="w-full p-2 text-sm border rounded mb-2 outline-none" />
                  <input value={accountNumber} onChange={(e)=>setAccountNumber(e.target.value)} placeholder="Account Number" className="w-full p-2 text-sm border rounded outline-none" />
                </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 h-fit space-y-4">
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
              
              <div className="flex justify-between items-center text-xl font-bold text-[#84c47c]">
                <span>Total Due</span>
                <span>₦{total.toLocaleString()}</span>
              </div>

              <button onClick={handleSubmit} disabled={isSubmitting} className="w-full mt-4 bg-gray-800 text-white py-4 rounded-xl font-bold hover:bg-gray-900 transition shadow-lg flex justify-center items-center gap-2 text-lg">
                {isSubmitting ? <Loader2 size={24} className="animate-spin" /> : <><Save size={24}/> Update Invoice</>}
              </button>
          </div>
        </div>

      </div>
    </div>
  )
}