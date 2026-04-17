'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from 'next/cache'

export async function markPaymentAsDone(formData: FormData) {
  const jobId = formData.get('jobId') as string
  const amount = formData.get('amount') as string
  const collector = formData.get('collector') as string

  await prisma.job.update({
    where: { id: jobId },
    data: {
      paymentStatus: 'PAID',
      amountPaid: parseFloat(amount), 
      paymentCollector: collector, 
      paymentDate: new Date(), // 👈 NEW: Records the exact moment payment was confirmed   
    }
  })

  revalidatePath('/dashboard/payments')
  revalidatePath('/dashboard/clients')
  revalidatePath('/dashboard/revenue')
  revalidatePath('/dashboard')
}