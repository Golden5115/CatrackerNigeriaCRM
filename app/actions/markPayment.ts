'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'



export async function markPaymentAsDone(formData: FormData) {
  const jobId = formData.get('jobId') as string
  const amount = formData.get('amount') as string
  const collector = formData.get('collector') as string

  await prisma.job.update({
    where: { id: jobId },
    data: {
      paymentStatus: 'PAID',
      amountPaid: parseFloat(amount), // Save the money
      paymentCollector: collector,    // Save who took it
      status: 'ACTIVE' // Move to Active status if payment was the last step
    }
  })

  revalidatePath('/dashboard/payments')
  revalidatePath('/dashboard/clients')
}