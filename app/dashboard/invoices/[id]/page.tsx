import { prisma } from "@/lib/prisma"
import { verifySession } from "@/lib/session"
import Link from "next/link"
import { ArrowLeft, Phone, MapPin, Globe, CheckCircle, MessageSquare } from "lucide-react"
import PrintInvoiceButton from "@/components/PrintInvoiceButton"
import { revalidatePath } from "next/cache"
import { Metadata } from "next" // 👈 NEW IMPORT

export const dynamic = 'force-dynamic'

// 🟢 NEW: This automatically changes the browser tab title to the Invoice Number, 
// which forces the "Save as PDF" dialog to use it as the default file name!
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    select: { invoiceNumber: true }
  })
  return { 
    title: invoice?.invoiceNumber || `INV-${id.slice(-6).toUpperCase()}` 
  }
}

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  await verifySession()
  const { id } = await params

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { 
      client: true, 
      items: true 
    }
  })

  if (!invoice) return <div className="p-12 text-center text-gray-500">Invoice not found.</div>

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount)
  }

  const subtotal = Number(invoice.subtotal || 0);
  const discountVal = Number(invoice.discountValue || 0);
  const isPercentage = invoice.discountType === 'PERCENTAGE';
  const discountAmount = isPercentage ? subtotal * (discountVal / 100) : discountVal;
  
  const taxPerc = Number(invoice.taxPercentage || 0);
  const taxAmount = (subtotal - discountAmount) * (taxPerc / 100);

  async function markAsPaidAction(formData: FormData) {
    'use server'
    const invoiceId = formData.get('invoiceId') as string
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'PAID' }
    })
    revalidatePath(`/dashboard/invoices/${invoiceId}`)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 print:p-0 print:m-0 print:space-y-0 print:w-full print:max-w-none print:block">
      
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
        }
      `}} />

      {/* ACTION BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100 print:hidden gap-4">
        <Link href="/dashboard/invoices" className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition font-bold text-sm bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
          <ArrowLeft size={16} /> Back to Invoices
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          
          {invoice.status !== 'PAID' && (
            <form action={markAsPaidAction}>
              <input type="hidden" name="invoiceId" value={invoice.id} />
              <button type="submit" className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-green-600 transition border border-green-600 shadow-sm">
                <CheckCircle size={16} /> Mark as Paid
              </button>
            </form>
          )}

          <Link href={`/dashboard/invoices/${invoice.id}/edit`} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-200 transition border border-gray-200">
            Edit Details
          </Link>
          <PrintInvoiceButton />
        </div>
      </div>

      {/* PREMIUM INVOICE DOCUMENT */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-8 sm:p-16 print:shadow-none print:border-none print:p-10 print:rounded-none relative overflow-hidden text-gray-800">
        
        <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-[#84c47c] to-blue-600 print:hidden"></div>

        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 mt-4 border-b border-gray-100 pb-12 print:flex-row print:items-start print:gap-4">
          <div className="space-y-4 print:w-1/2">
            <div className="flex-row items-center gap-4">
               <img 
                 src="/logo2.png" 
                 alt="Car Tracker Nigeria Logo" 
                 className="w-30 h-30 object-contain print:w-50 print:h-50" 
               />
               <div>
                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest print:text-[8px]">Premium Telematics Solutions</p>
               </div>
            </div>
            
            <div className="text-xs text-gray-500 space-y-1.5 font-medium mt-4 print:text-[10px]">
              <p className="flex items-center gap-2"><MapPin size={14} className="text-gray-400"/> 90 Wuraola House Ikeja, Lagos Nigeria</p>
              <p className="flex items-center gap-2"><Phone size={14} className="text-gray-400"/> 0803 9422 2997</p>
              <p className="flex items-center gap-2"><MessageSquare size={14} className="text-gray-400"/> hello@cartracker.com.ng</p>
              <p className="flex items-center gap-2"><Globe size={14} className="text-gray-400"/> www.cartrackernigeria.com</p>
            </div>
          </div>

          <div className="text-left md:text-right print:text-right print:w-1/2">
            <h2 className="text-4xl sm:text-5xl font-black text-black-600 uppercase tracking-tighter mb-2 print:text-4xl">Invoice</h2>
            <p className="text-lg font-bold text-gray-900 print:text-base">{invoice.invoiceNumber || `#INV-${invoice.id.slice(-6).toUpperCase()}`}</p>
            
            <div className="mt-4 inline-block">
              {invoice.status === 'PAID' ? (
                <span className="bg-green-100 text-green-700 border border-green-200 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">Paid in Full</span>
              ) : invoice.status === 'PARTIAL' ? (
                <span className="bg-orange-100 text-orange-700 border border-orange-200 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">Partially Paid</span>
              ) : (
                <span className="bg-red-100 text-red-700 border border-red-200 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">Payment Due</span>
              )}
            </div>
          </div>
        </div>

        {/* BILLING DETAILS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 py-10 print:grid-cols-2 print:gap-8 break-inside-avoid">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 border-b pb-2">Billed To</p>
            <h3 className="text-lg font-black text-gray-900 mb-1 print:text-base">
              {invoice.clientName || invoice.client?.fullName}
            </h3>
            <div className="text-sm text-gray-600 font-medium space-y-1 mt-2 print:text-xs">
              {(invoice.clientAddress || invoice.client?.address) && <p>{invoice.clientAddress || invoice.client?.address}</p>}
              {(invoice.clientEmail || invoice.client?.email) && <p className="text-blue-600">{invoice.clientEmail || invoice.client?.email}</p>}
              {(invoice.clientPhone || invoice.client?.phoneNumber) && <p>{invoice.clientPhone || invoice.client?.phoneNumber}</p>}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6 bg-gray-50/50 p-6 rounded-2xl border border-gray-100 print:bg-gray-50 print:p-4">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Issue Date</p>
              <p className="text-sm font-bold text-gray-900 print:text-xs">
                {new Date(invoice.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Due Date</p>
              <p className="text-sm font-bold text-gray-900 print:text-xs">
                {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Upon Receipt'}
              </p>
            </div>
          </div>
        </div>

        {/* LINE ITEMS TABLE */}
        <div className="mt-4 rounded-2xl overflow-hidden border border-gray-200">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200 print:bg-gray-100">
              <tr>
                <th className="py-4 px-6 text-[10px] font-black text-gray-500 uppercase tracking-widest w-1/2 print:px-4">Description</th>
                <th className="py-4 px-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center print:px-4">Qty</th>
                <th className="py-4 px-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right print:px-4">Unit Price</th>
                <th className="py-4 px-6 text-[10px] font-black text-gray-900 uppercase tracking-widest text-right bg-gray-100 print:px-4 print:bg-gray-200">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoice.items?.map((item: any) => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition break-inside-avoid">
                  <td className="py-5 px-6 print:px-4">
                    <p className="text-sm font-bold text-gray-900 print:text-xs">{item.description}</p>
                  </td>
                  <td className="py-5 px-6 text-center text-sm font-medium text-gray-600 print:px-4 print:text-xs">
                    {item.quantity}
                  </td>
                  <td className="py-5 px-6 text-right text-sm font-medium text-gray-600 print:px-4 print:text-xs">
                    {formatCurrency(Number(item.unitPrice))}
                  </td>
                  <td className="py-5 px-6 text-right text-sm font-black text-gray-900 bg-gray-50/30 print:px-4 print:text-xs print:bg-gray-50">
                    {formatCurrency(Number(item.total))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FINANCIAL SUMMARY & BANK DETAILS */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-12 mt-12 print:flex-row print:gap-8 break-inside-avoid">
          
          <div className="w-full md:w-1/2 bg-blue-50/50 p-6 rounded-2xl border border-blue-100 print:bg-blue-50 print:border-blue-200 print:p-4">
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2 print:text-blue-800">
              Payment Information
            </p>
            {invoice.bankName ? (
              <div className="space-y-3">
                <div>
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Bank Name</p>
                  <p className="text-sm font-black text-gray-900 print:text-xs">{invoice.bankName}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Account Name</p>
                  <p className="text-sm font-bold text-gray-800 print:text-xs">{invoice.accountName}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Account Number</p>
                  <p className="text-xl font-mono font-black text-blue-700 tracking-widest print:text-lg print:text-blue-900">{invoice.accountNumber}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 font-medium print:text-xs">Please contact us directly for secure payment transfer details.</p>
            )}
          </div>

          <div className="w-full md:w-1/3 space-y-4 print:space-y-3">
            <div className="flex justify-between items-center text-sm font-medium text-gray-600 print:text-xs">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            
            {discountAmount > 0 && (
              <div className="flex justify-between items-center text-sm font-medium text-red-500 print:text-xs">
                <span>Discount {isPercentage ? `(${discountVal}%)` : ''}</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            
            {taxPerc > 0 && (
              <div className="flex justify-between items-center text-sm font-medium text-gray-600 print:text-xs">
                <span>Tax / VAT ({taxPerc}%)</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>
            )}
            
            <div className="flex justify-between items-center text-xl font-black text-gray-900 pt-4 border-t-2 border-gray-900 print:text-lg">
              <span>Total Due</span>
              <span>{formatCurrency(Number(invoice.total))}</span>
            </div>
          </div>
        </div>

        {invoice.notes && (
          <div className="mt-12 pt-8 border-t border-gray-100 break-inside-avoid">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Additional Notes</p>
            <p className="text-sm text-gray-600 font-medium whitespace-pre-wrap print:text-xs">{invoice.notes}</p>
          </div>
        )}

        <div className="mt-16 text-center break-inside-avoid">
          <p className="text-sm font-bold text-gray-400 italic print:text-xs">Thank you for choosing Car Tracker Nigeria.</p>
        </div>

      </div>
    </div>
  )
}