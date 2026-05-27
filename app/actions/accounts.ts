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
    select: { amountPaid: true, installDate: true, paymentDate: true, updatedAt: true }
  })

  // Pending Payments from the Payment/Job module
  const pendingPaymentJobs = await prisma.job.count({
    where: { paymentStatus: { not: 'PAID' }, onboarded: true }
  })

  let totalRevenue = 0;
  let revenueThisMonth = 0;
  let revenueThisWeek = 0;

  // Initialize a 6-month array for the chart
  const monthlyTrend = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { 
      month: d.getMonth(), 
      year: d.getFullYear(), 
      name: d.toLocaleString('default', { month: 'short' }), 
      revenue: 0,
      debits: 0
    };
  });

  paidJobs.forEach(job => {
    const amt = Number(job.amountPaid || 0);
    const date = job.installDate ? new Date(job.installDate) : (job.paymentDate ? new Date(job.paymentDate) : new Date(job.updatedAt));
    
    totalRevenue += amt;
    if (date >= startOfMonth) revenueThisMonth += amt;
    if (date >= startOfWeek) revenueThisWeek += amt;

    if (date >= sixMonthsAgo) {
      const bucket = monthlyTrend.find(b => b.month === date.getMonth() && b.year === date.getFullYear());
      if (bucket) bucket.revenue += amt;
    }
  });

  // 2. PULL DEBIT/EXPENSE DATA
  const debits = await prisma.debit.findMany({
    where: { status: 'COMPLETED' },
    select: { amount: true, category: true, date: true }
  })

  let totalDebits = 0;
  let debitsThisMonth = 0;
  const debitCategoryTotals: Record<string, number> = {};

  debits.forEach(debit => {
    const amt = Number(debit.amount);
    const date = new Date(debit.date);
    
    totalDebits += amt;
    if (date >= startOfMonth) debitsThisMonth += amt;

    // Category aggregation
    debitCategoryTotals[debit.category] = (debitCategoryTotals[debit.category] || 0) + amt;

    // Add to monthly trend
    if (date >= sixMonthsAgo) {
      const bucket = monthlyTrend.find(b => b.month === date.getMonth() && b.year === date.getFullYear());
      if (bucket) bucket.debits += amt;
    }
  });

  return {
    revenue: {
      total: totalRevenue,
      thisMonth: revenueThisMonth,
      thisWeek: revenueThisWeek,
    },
    pendingPaymentJobs,
    debits: {
      total: totalDebits,
      thisMonth: debitsThisMonth,
      byCategory: Object.entries(debitCategoryTotals).map(([name, value]) => ({ name, value })),
    },
    netCashflow: totalRevenue - totalDebits,
    monthlyTrend
  }
}

export async function addDebit(formData: FormData) {
  try {
    const amount = parseFloat(formData.get('amount') as string);
    const category = formData.get('category') as string;
    const reason = formData.get('reason') as string;
    const note = formData.get('note') as string;
    const date = formData.get('date') as string;

    await prisma.debit.create({
      data: {
        amount,
        category,
        reason: reason || null,
        note: note || null,
        date: new Date(date),
        status: 'COMPLETED'
      }
    });

    revalidatePath('/dashboard/accounts')
    return { success: true }
  } catch (error) {
    return { error: "Failed to record debit." }
  }
}