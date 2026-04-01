'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from 'next/cache'

export async function updateLeadStatus(formData: FormData) {
  const jobId = formData.get('jobId') as string
  const actionType = formData.get('actionType') as string
  
  // 1. MARK AS INSTALLED (Moves to Tech Support)
  if (actionType === 'INSTALLED') {
    await prisma.job.update({
      where: { id: jobId },
      // 👇 FIX: Use the new PENDING_QC status instead of INSTALLED
      data: { status: 'PENDING_QC' } 
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

// 1. Action to set a scheduled date
export async function scheduleInstallation(jobId: string, dateString: string) {
  try {
    await prisma.job.update({
      where: { id: jobId },
      data: { 
        status: 'SCHEDULED',
        scheduledDate: new Date(dateString),
        pendingReason: null // Clear pending reason if it is now scheduled
      }
    });
    revalidatePath('/dashboard/leads');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

// 2. Action to log a delay/pending reason
export async function logPendingReason(jobId: string, reason: string) {
  try {
    await prisma.job.update({
      where: { id: jobId },
      data: { 
        pendingReason: reason 
      }
    });
    revalidatePath('/dashboard/leads');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}