'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'



export async function completeSetup(formData: FormData) {
  const jobId = formData.get('jobId') as string
  const platformId = formData.get('platformId') as string // The ID on your tracking server

  await prisma.job.update({
    where: { id: jobId },
    data: {
      status: 'CONFIGURED',
      serverConfig: true,
      platformId: platformId
    }
  })

  // Redirect back to the tech dashboard
  revalidatePath('/dashboard/tech')
  redirect('/dashboard/tech')
}