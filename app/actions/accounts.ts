
'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers" // 🟢 NEW: The ultimate cache buster

export async function getAccountsAnalytics() {
  // 🟢 FIXED: By calling headers(), Next.js is FORCED to run this fresh every single time.
  // It completely destroys the frozen Vercel build cache.
  await headers(); 
  
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  startOfWeek.setHours(0,0,0,0);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  // 1. PULL REVENUE PURELY FROM PAYMENTS
  const paidJobs = await prisma.job.findMany({ where: { isArchived: false,  amountPaid: { gt: 0 } },
    include: { vehicle: { include: { client: true } } },
    orderBy: { updatedAt: 'desc' }
  })

  const pendingPaymentJobs = await prisma.job.count({
    where: { paymentStatus: { not: 'PAID' }, onboarded: true }
  })

  let totalRevenue = 0;
  let revenueThisMonth = 0;
  let revenueThisWeek = 0;

  // 🟢 FIXED: Explicitly naming months to prevent Node.js timezone/locale bugs
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const monthlyTrend = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { 
      month: d.getMonth(), 
      year: d.getFullYear(), 
      name: `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`, // e.g., "Jun 26"
      revenue: 0,
      debits: 0
    };
  });

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
      vehicleName: `${job.vehicle?.name || 'Unknown Vehicle'} (${job.vehicle?.plateNumber || 'No Plate'})`,
      amount: amt,
      date: date.toISOString(),
      collector: job.paymentCollector || 'System'
    }
  });

  // 2. PULL DEBIT/EXPENSE DATA
  const debits = await prisma.debit.findMany({
    where: { status: 'COMPLETED' },
    orderBy: { date: 'desc' }
  })

  let totalDebits = 0;
  let debitsThisMonth = 0;
  
  // 🟢 FIXED: We will ONLY aggregate categories for the current month now!
  const debitCategoryTotalsThisMonth: Record<string, number> = {};

  const debitList = debits.map(debit => {
    const amt = Number(debit.amount);
    const date = new Date(debit.date);
    
    totalDebits += amt;

    // Add to monthly totals & Pie Chart categories
    if (date >= startOfMonth) {
       debitsThisMonth += amt;
       debitCategoryTotalsThisMonth[debit.category] = (debitCategoryTotalsThisMonth[debit.category] || 0) + amt;
    }

    // Add to 6-month trend chart
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
    pendingPaymentJobs,
    debits: {
      total: totalDebits,
      thisMonth: debitsThisMonth,
      byCategoryThisMonth: Object.entries(debitCategoryTotalsThisMonth).map(([name, value]) => ({ name, value })), // 🟢 Passed to Pie Chart
    },
    netCashflow: totalRevenue - totalDebits,
    monthlyTrend,
    revenueList,
    debitList
  }
}

// ... Keep your addDebit function exactly the same below this!

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