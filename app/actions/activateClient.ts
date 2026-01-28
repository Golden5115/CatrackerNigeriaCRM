'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from 'next/cache'



export async function activateClient(formData: FormData) {
  const jobId = formData.get('jobId') as string
  
  // In a real app, you might trigger an automatic email here using Resend or SendGrid
  
  await prisma.job.update({
    where: { id: jobId },
    data: {
      status: 'ACTIVE',      // The client is now live
      onboarded: true,       // Mark as onboarded
      paymentStatus: 'DUE'   // Now we chase for payment
    }
  })

  revalidatePath('/dashboard/activation')
}