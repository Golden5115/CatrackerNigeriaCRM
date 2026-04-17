'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function fixHistoricalPaymentDates() {
  // 1. Find every paid job that doesn't have a dedicated payment date yet
  const oldPaidJobs = await prisma.job.findMany({
    where: {
      paymentStatus: 'PAID',
      paymentDate: null
    }
  });

  // 2. Loop through them and fix them one by one
  for (const job of oldPaidJobs) {
    // We assume they paid on the day of installation. If no install date exists, we use the day the lead was created.
    const accurateHistoricalDate = job.installDate || job.createdAt;

    await prisma.job.update({
      where: { id: job.id },
      data: { paymentDate: accurateHistoricalDate }
    });
  }

  // 3. Refresh the revenue page so the chart updates instantly
  revalidatePath('/dashboard/revenue');
}