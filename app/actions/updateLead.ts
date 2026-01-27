'use server'

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'

const prisma = new PrismaClient()

export async function updateLeadStatus(formData: FormData) {
  const jobId = formData.get('jobId') as string
  const actionType = formData.get('actionType') as string
  
  // 1. MARK AS INSTALLED (Moves to Tech Support)
  if (actionType === 'INSTALLED') {
    await prisma.job.update({
      where: { id: jobId },
      data: { status: 'INSTALLED' }
    })
  }

  // 2. MARK AS LOST (Removes from pipeline)
  if (actionType === 'LEAD_LOST') {
    const reason = formData.get('lostReason') as string
    await prisma.job.update({
      where: { id: jobId },
      data: { 
        status: 'LEAD_LOST',
        lostReason: reason
      }
    })
  }

  // 3. SCHEDULE DATE (Keeps in pipeline, updates time)
  if (actionType === 'SCHEDULED') {
    const dateStr = formData.get('scheduleDate') as string
    if (dateStr) {
      await prisma.job.update({
        where: { id: jobId },
        data: { 
          status: 'SCHEDULED',
          installDate: new Date(dateStr)
        }
      })
    }
  }

  revalidatePath('/dashboard/leads')
}