import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import Logo2 from "@/components/Logo2"
import PrintInvoiceButton from "@/components/PrintInvoiceButton"
import { markInvoicePaid } from "@/app/actions/invoice"
import { ArrowLeft, CheckCircle, Pencil } from "lucide-react"
import { Metadata } from "next" // 👈 NEW: Import Next.js Metadata

// 👇 NEW: This function dynamically changes the browser tab title so the PDF saves with the correct name!
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    select: { invoiceNumber: true, status: true }
  });

  if (!invoice) return { title: "Invoice Not Found" };

  // If it's paid, name the PDF "Receipt-INV-XXXX", otherwise "Invoice-INV-XXXX"
  const documentType = invoice.status === 'PAID' ? 'Receipt' : 'Invoice';
  
  return {
    title: `${documentType}-${invoice.invoiceNumber}`
  };
}

export default async function InvoicePrintView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { items: true }
  });

  if (!invoice) return notFound();

  const isPaid = invoice.status === 'PAID';

  const handleMarkPaid = async () => {
    "use server"
    await markInvoicePaid(id)
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 flex flex-col items-center overflow-auto">
      
      <div className="no-print w-[210mm] flex justify-between items-center mb-4">
        <Link href="/dashboard/invoices" className="flex items-center gap-2 text-gray-500 hover:text-gray-800 font-bold transition">
          <ArrowLeft size={18} /> Back to Invoices
        </Link>
        <div className="flex gap-3">
          <Link href={`/dashboard/invoices/${id}/edit`} className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-50 transition flex items-center gap-2 shadow-sm">
            <Pencil size={16} /> Edit Invoice
          </Link>
          {!isPaid && (
            <form action={handleMarkPaid}>
              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-green-700 transition flex items-center gap-2 shadow-sm">
                <CheckCircle size={16} /> Mark as Paid
              </button>
            </form>
          )}
          <PrintInvoiceButton />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: A4; margin: 0; }
          body { background: white !important; }
          body * { visibility: hidden; }
          #printable-a4, #printable-a4 * { visibility: visible; }
          #printable-a4 { 
            position: absolute; left: 0; top: 0; 
            width: 210mm !important; min-height: 297mm !important;
            box-shadow: none !important; margin: 0 !important;
            -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; 
          }
          .no-print { display: none !important; }
        }
      `}} />

      <div id="printable-a4" className="bg-white w-[210mm] min-h-[297mm] shadow-2xl flex flex-col p-10 sm:p-12 relative mx-auto">
        
        {/* HEADER */}
        <div className="flex justify-between items-start mb-12">
          <div>
            <div className="mb-4">
              <div className="transform scale-150 origin-top-left">
                <Logo2 />
              </div>
            </div>
            <div className="text-gray-500 text-xs space-y-1 mt-6">
              <p>90 Wuraola House Ikeja </p>
              <p>Lagos, Nigeria</p>
              <p>impactcentric@gmail.com</p>
              <p>08039422997</p>
              <p>www.catrackernigeria.com.ng</p>
            </div>
          </div>
          <div className="text-right">
            <h1 className="text-4xl font-bold tracking-widest text-[#84c47c] uppercase">
              {isPaid ? "Receipt" : "Invoice"}
            </h1>
            <p className="text-gray-500 font-bold mt-2">#{invoice.invoiceNumber}</p>
          </div>
        </div>

        {/* METADATA */}
        <div className="flex justify-between mb-12">
          <div className="space-y-1">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Billed To</p>
            <h3 className="font-bold text-lg text-gray-800">{invoice.clientName}</h3>
            {invoice.clientAddress && <p className="text-sm text-gray-600">{invoice.clientAddress}</p>}
            {invoice.clientPhone && <p className="text-sm text-gray-600">{invoice.clientPhone}</p>}
            {invoice.clientEmail && <p className="text-sm text-gray-600">{invoice.clientEmail}</p>}
          </div>
          
          <div className="space-y-4 text-right">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Issue Date</p>
              <p className="text-sm font-bold text-gray-800">{new Date(invoice.issueDate).toLocaleDateString('en-GB')}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Due Date</p>
              <p className="text-sm font-bold text-gray-800">{new Date(invoice.dueDate).toLocaleDateString('en-GB')}</p>
            </div>
          </div>
        </div>

        {/* SUBJECT */}
        {invoice.subject && (
          <div className="mb-6 pb-2 border-b-2 border-[#84c47c]">
            <p className="text-sm font-bold text-gray-800">Subject: <span className="font-normal text-gray-600">{invoice.subject}</span></p>
          </div>
        )}

        {/* LINE ITEMS */}
        <div className="flex-1">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b-2 border-gray-800 text-gray-800">
                <th className="py-3 font-bold">Description</th>
                <th className="py-3 font-bold text-center">Qty / Rate</th>
                <th className="py-3 font-bold text-right">Unit Price</th>
                <th className="py-3 font-bold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoice.items.map((item) => (
                <tr key={item.id}>
                  <td className="py-4 text-gray-800 font-medium">{item.description}</td>
                  <td className="py-4 text-center text-gray-600">{item.quantity}</td>
                  <td className="py-4 text-right text-gray-600">₦{Number(item.unitPrice).toLocaleString()}</td>
                  <td className="py-4 text-right font-bold text-gray-900">₦{Number(item.total).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* TOTALS & BANK DETAILS */}
        <div className="grid grid-cols-2 gap-8 mt-12 border-t pt-8">
          <div className="space-y-6">
             {(invoice.bankName || invoice.accountName || invoice.accountNumber) && (
               <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm">
                 <p className="font-bold text-gray-800 uppercase tracking-widest text-[10px] mb-2">Payment Info</p>
                 {invoice.bankName && <p className="text-gray-600"><span className="font-bold">Bank:</span> {invoice.bankName}</p>}
                 {invoice.accountName && <p className="text-gray-600"><span className="font-bold">Name:</span> {invoice.accountName}</p>}
                 {invoice.accountNumber && <p className="font-bold text-lg text-gray-900 mt-1 tracking-widest">{invoice.accountNumber}</p>}
               </div>
             )}
             {invoice.notes && (
               <div className="text-xs text-gray-500">
                 <p className="font-bold text-gray-400 uppercase tracking-widest text-[10px] mb-1">Notes / Terms</p>
                 <p>{invoice.notes}</p>
               </div>
             )}
          </div>

          <div className="space-y-3 text-sm">
             <div className="flex justify-between text-gray-600">
               <span>Subtotal</span>
               <span>₦{Number(invoice.subtotal).toLocaleString()}</span>
             </div>
             
             {Number(invoice.discountValue) > 0 && (
               <div className="flex justify-between text-gray-600">
                 <span>Discount ({invoice.discountType === 'PERCENTAGE' ? `${Number(invoice.discountValue)}%` : 'Fixed'})</span>
                 <span className="text-red-500">- ₦{invoice.discountType === 'PERCENTAGE' ? (Number(invoice.subtotal) * (Number(invoice.discountValue)/100)).toLocaleString() : Number(invoice.discountValue).toLocaleString()}</span>
               </div>
             )}

             {Number(invoice.taxPercentage) > 0 && (
               <div className="flex justify-between text-gray-600">
                 <span>Tax / VAT ({Number(invoice.taxPercentage)}%)</span>
                 <span>+ ₦{((Number(invoice.subtotal) - (invoice.discountType === 'PERCENTAGE' ? Number(invoice.subtotal) * (Number(invoice.discountValue)/100) : Number(invoice.discountValue))) * (Number(invoice.taxPercentage)/100)).toLocaleString()}</span>
               </div>
             )}

             <div className="flex justify-between text-2xl font-bold text-[#84c47c] border-t-2 border-gray-800 pt-3 mt-3">
               <span>Total Due</span>
               <span>₦{Number(invoice.total).toLocaleString()}</span>
             </div>
             
             {isPaid && (
                <div className="mt-4 border-2 border-[#84c47c] text-[#84c47c] text-center font-bold tracking-widest uppercase py-2 transform -rotate-6 w-fit ml-auto px-6 opacity-70">
                  PAID IN FULL
                </div>
             )}
          </div>
        </div>

      </div>
    </div>
  );
}