'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from 'next/cache'

export async function recordPayment(formData: FormData) {
  const jobId = formData.get('jobId') as string
  
  await prisma.job.update({
    where: { id: jobId },
    data: {
      paymentStatus: 'PAID',
      paymentDate: new Date(), // 👈 NEW: Records the exact moment payment was confirmed 
    }
  })

  revalidatePath('/dashboard/payments')
}