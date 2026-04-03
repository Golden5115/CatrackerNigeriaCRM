import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import EditInvoiceForm from "@/components/EditInvoiceForm"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { items: true }
  });

  if (!invoice) return notFound();

  // 👇 FIX: "Flatten" the Prisma Decimal objects into standard numbers 
  // before passing them over the server/client boundary
  const sanitizedInvoice = {
    ...invoice,
    subtotal: Number(invoice.subtotal),
    discountValue: Number(invoice.discountValue),
    taxPercentage: Number(invoice.taxPercentage),
    total: Number(invoice.total),
    items: invoice.items.map(item => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      total: Number(item.total)
    }))
  };

  return (
    <div className="max-w-5xl mx-auto pb-12 space-y-6">
      <div className="mb-6">
        <Link href={`/dashboard/invoices/${id}`} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 font-bold transition w-fit mb-4 text-sm">
          <ArrowLeft size={16} /> Back to Invoice
        </Link>
        <h2 className="text-3xl font-bold text-gray-800">Edit Invoice</h2>
        <p className="text-gray-500">Make changes to invoice #{invoice.invoiceNumber}.</p>
      </div>

      {/* 👇 Pass the sanitized invoice instead of the raw database object */}
      <EditInvoiceForm invoice={sanitizedInvoice} />
    </div>
  );
}