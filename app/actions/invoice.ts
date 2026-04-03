'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { verifySession } from "@/lib/session"

// 1. Live Search for Client Autocomplete
export async function searchClientsForInvoice(query: string) {
  if (!query || query.length < 2) return [];
  return await prisma.client.findMany({
    where: {
      OR: [
        { fullName: { contains: query, mode: 'insensitive' } },
        { phoneNumber: { contains: query } },
        { email: { contains: query, mode: 'insensitive' } }
      ]
    },
    take: 5,
    select: { id: true, fullName: true, phoneNumber: true, email: true, address: true }
  });
}

// 2. Generate Invoice Number & Save Data
export async function createInvoice(data: any) {
  try {
    const session = await verifySession();
    if (!session?.userId) throw new Error("Unauthorized");

    // Generate Invoice Number (e.g., INV-1001)
    const count = await prisma.invoice.count();
    const invoiceNumber = `INV-${String(count + 1001).padStart(4, '0')}`;

    const newInvoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        clientId: data.clientId || null,
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        clientPhone: data.clientPhone,
        clientAddress: data.clientAddress,
        subject: data.subject,
        issueDate: new Date(data.issueDate),
        dueDate: new Date(data.dueDate),
        subtotal: data.subtotal,
        discountType: data.discountType,
        discountValue: data.discountValue,
        taxPercentage: data.taxPercentage,
        total: data.total,
        notes: data.notes,
        bankName: data.bankName,
        accountName: data.accountName,
        accountNumber: data.accountNumber,
        createdById: session.userId as string,
        items: {
          create: data.items.map((item: any) => ({
            description: item.description,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            total: Number(item.quantity) * Number(item.unitPrice)
          }))
        }
      }
    });

    revalidatePath('/dashboard/invoices');
    return { success: true, invoiceId: newInvoice.id };
  } catch (error: any) {
    return { error: error.message };
  }
}

// 3. Smart Memory: Fetch defaults from the last created invoice
export async function getLastInvoiceDefaults() {
  try {
    const lastInvoice = await prisma.invoice.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { bankName: true, accountName: true, accountNumber: true, notes: true }
    });
    return lastInvoice;
  } catch (error) {
    return null;
  }
}

// 4. Mark Invoice as Paid
export async function markInvoicePaid(invoiceId: string) {
  try {
    const session = await verifySession();
    if (!session?.userId) throw new Error("Unauthorized");

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'PAID' }
    });

    revalidatePath('/dashboard/invoices');
    revalidatePath(`/dashboard/invoices/${invoiceId}`);
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

// 5. Update Existing Invoice
export async function updateInvoice(invoiceId: string, data: any) {
  try {
    const session = await verifySession();
    if (!session?.userId) throw new Error("Unauthorized");

    // The safest way to handle line items is to wipe the old ones and save the newly edited ones
    await prisma.invoiceItem.deleteMany({
      where: { invoiceId: invoiceId }
    });

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        clientId: data.clientId || null,
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        clientPhone: data.clientPhone,
        clientAddress: data.clientAddress,
        subject: data.subject,
        issueDate: new Date(data.issueDate),
        dueDate: new Date(data.dueDate),
        subtotal: data.subtotal,
        discountType: data.discountType,
        discountValue: data.discountValue,
        taxPercentage: data.taxPercentage,
        total: data.total,
        notes: data.notes,
        bankName: data.bankName,
        accountName: data.accountName,
        accountNumber: data.accountNumber,
        items: {
          create: data.items.map((item: any) => ({
            description: item.description,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            total: Number(item.quantity) * Number(item.unitPrice)
          }))
        }
      }
    });

    revalidatePath('/dashboard/invoices');
    revalidatePath(`/dashboard/invoices/${invoiceId}`);
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}