'use server'

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const prisma = new PrismaClient()

export async function activateJob(formData: FormData) {
  const jobId = formData.get('jobId') as string
  
  // Optional: You can capture the username/password here if you want to save it
  // const username = formData.get('username') as string
  
  await prisma.job.update({
    where: { id: jobId },
    data: {
      status: 'ACTIVE',   // Job is fully live
      onboarded: true,    // Login details have been sent
      // You could save username/password to a 'notes' field if you wanted
    }
  })

  revalidatePath('/dashboard/activation')
  revalidatePath('/dashboard/clients')
  redirect('/dashboard/activation') // Go back to list
}