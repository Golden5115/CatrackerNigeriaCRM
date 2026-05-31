'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getAccountsAnalytics() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  startOfWeek.setHours(0,0,0,0);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  // 1. PULL REVENUE PURELY FROM PAYMENTS (JOBS)
  const paidJobs = await prisma.job.findMany({ 
    where: { amountPaid: { gt: 0 } },
    include: { vehicle: { include: { client: true } } }, // 🟢 NEW: Fetch client details for the ledger
    orderBy: { updatedAt: 'desc' }
  })

  const pendingPaymentJobs = await prisma.job.count({
    where: { paymentStatus: { not: 'PAID' }, onboarded: true }
  })

  let totalRevenue = 0;
  let revenueThisMonth = 0;
  let revenueThisWeek = 0;

  const monthlyTrend = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { month: d.getMonth(), year: d.getFullYear(), name: d.toLocaleString('default', { month: 'short' }), revenue: 0, debits: 0 };
  });

  // 🟢 NEW: Create a clean array for the Revenue Ledger
  const revenueList = paidJobs.map(job => {
    const amt = Number(job.amountPaid || 0);
    const date = job.installDate ? new Date(job.installDate) : (job.paymentDate ? new Date(job.paymentDate) : new Date(job.updatedAt));
    
    totalRevenue += amt;
    if (date >= startOfMonth) revenueThisMonth += amt;
    if (date >= startOfWeek) revenueThisWeek += amt;

    if (date >= sixMonthsAgo) {
      const bucket = monthlyTrend.find(b => b.month === date.getMonth() && b.year === date.getFullYear());
      if (bucket) bucket.revenue += amt;
    }

    return {
      id: job.id,
      clientName: job.vehicle?.client?.fullName || 'Unknown Client',
      vehicleName: `${job.vehicle?.name} (${job.vehicle?.plateNumber || 'No Plate'})`,
      amount: amt,
      date: date.toISOString(),
      collector: job.paymentCollector || 'System'
    }
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // 2. PULL DEBIT/EXPENSE DATA
  const debits = await prisma.debit.findMany({
    where: { status: 'COMPLETED' },
    orderBy: { date: 'desc' }
  })

  let totalDebits = 0;
  let debitsThisMonth = 0;
  const debitCategoryTotals: Record<string, number> = {};

  // 🟢 NEW: Create a clean array for the Debit Ledger
  const debitList = debits.map(debit => {
    const amt = Number(debit.amount);
    const date = new Date(debit.date);
    
    totalDebits += amt;
    if (date >= startOfMonth) debitsThisMonth += amt;
    debitCategoryTotals[debit.category] = (debitCategoryTotals[debit.category] || 0) + amt;

    if (date >= sixMonthsAgo) {
      const bucket = monthlyTrend.find(b => b.month === date.getMonth() && b.year === date.getFullYear());
      if (bucket) bucket.debits += amt;
    }

    return {
      id: debit.id,
      category: debit.category,
      recipient: debit.recipientName || 'Not Specified',
      amount: amt,
      date: date.toISOString(),
      reason: debit.reason,
      note: debit.note
    }
  });

  return {
    revenue: { total: totalRevenue, thisMonth: revenueThisMonth, thisWeek: revenueThisWeek },
    debits: { total: totalDebits, thisMonth: debitsThisMonth, byCategory: Object.entries(debitCategoryTotals).map(([name, value]) => ({ name, value })) },
    pendingPaymentJobs,
    netCashflow: totalRevenue - totalDebits,
    monthlyTrend,
    revenueList, // 🟢 Passed to frontend
    debitList    // 🟢 Passed to frontend
  }
}

export async function addDebit(formData: FormData) {
  try {
    const amount = parseFloat(formData.get('amount') as string);
    const category = formData.get('category') as string;
    const reason = formData.get('reason') as string;
    const recipientName = formData.get('recipientName') as string;
    const note = formData.get('note') as string;
    const date = formData.get('date') as string;

    await prisma.debit.create({
      data: { amount, category, reason: reason || null, recipientName: recipientName || null, note: note || null, date: new Date(date), status: 'COMPLETED' }
    });

    revalidatePath('/dashboard/accounts')
    return { success: true }
  } catch (error) {
    console.error("=== DEBIT CREATION ERROR ===", error);
    return { error: "Failed to record debit. Check server console." }
  }
}