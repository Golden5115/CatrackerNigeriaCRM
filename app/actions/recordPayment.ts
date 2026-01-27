'use server'

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'

const prisma = new PrismaClient()

export async function recordPayment(formData: FormData) {
  const jobId = formData.get('jobId') as string
  
  // Update status to PAID
  await prisma.job.update({
    where: { id: jobId },
    data: {
      paymentStatus: 'PAID'
    }
  })

  // In a future version, you would create a "Subscription" record here 
  // to track when their renewal is due (e.g., 1 year from today).

  revalidatePath('/dashboard/payments')
}