import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Plus, FileText, CheckCircle, AlertCircle } from "lucide-react"

export default async function InvoicesList() {
  const invoices = await prisma.invoice.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Invoices</h2>
          <p className="text-gray-500">Manage all billing and receipts.</p>
        </div>
        <Link href="/dashboard/invoices/create" className="bg-[#84c47c] text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-[#6aa663] transition shadow-sm">
          <Plus size={16} /> Create Invoice
        </Link>
      </div>

      {/* 🟢 FIXED: Added overflow-x-auto and w-full so the table can be swiped on phones */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden overflow-x-auto w-full custom-scrollbar">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase whitespace-nowrap">Invoice No.</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase whitespace-nowrap">Date Created</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase whitespace-nowrap">Client</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase whitespace-nowrap">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase whitespace-nowrap">Status</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase whitespace-nowrap">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {invoices.map(inv => (
              <tr key={inv.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 font-mono font-bold text-sm text-gray-900 whitespace-nowrap">{inv.invoiceNumber}</td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-bold text-sm text-gray-800">{new Date(inv.createdAt).toLocaleDateString('en-GB')}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{new Date(inv.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
                </td>

                <td className="px-6 py-4 text-sm font-medium text-gray-700 whitespace-nowrap">{inv.clientName}</td>
                <td className="px-6 py-4 font-bold text-gray-900 whitespace-nowrap">₦{Number(inv.total).toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {inv.status === 'PAID' ? 
                    <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded w-fit"><CheckCircle size={12}/> PAID</span> :
                    <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded w-fit"><AlertCircle size={12}/> UNPAID</span>
                  }
                </td>
                <td className="px-6 py-4 text-right whitespace-nowrap">
                  <Link href={`/dashboard/invoices/${inv.id}`} className="text-blue-600 font-bold bg-blue-50 px-3 py-1.5 rounded-lg text-xs hover:bg-blue-100 transition inline-block">Open Invoice</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {invoices.length === 0 && <div className="p-12 text-center text-gray-500 font-medium">No invoices created yet.</div>}
      </div>
    </div>
  )
}