'use server'

import { prisma } from "@/lib/prisma"
import { verifySession } from "@/lib/session"
import { revalidatePath } from "next/cache"

export async function claimJob(jobId: string) {
  try {
    const session = await verifySession()
    if (!session?.userId) {
      return { error: "You are not logged in or session expired." }
    }

    const job = await prisma.job.findUnique({ where: { id: jobId } })
    
    if (job?.status === 'IN_PROGRESS' && job.installerId !== session.userId) {
      return { error: "This job was already claimed by someone else!" }
    }

    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'IN_PROGRESS',
        installerId: session.userId,
      }
    })

    revalidatePath('/dashboard/leads')
    return { success: true }
    
  } catch (error: any) {
    console.error("CLAIM JOB ERROR:", error)
    return { error: error.message || "Failed to connect to database." }
  }
}


export async function unclaimJob(jobId: string) {
  try {
    const session = await verifySession()
    
    // 👇 FIX: Strictly check for ADMIN role
    if (!session?.userId || session.role !== 'ADMIN') { 
      return { error: "Unauthorized. Only Admins can reassign or return jobs." } 
    }

    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'SCHEDULED',
        installerId: null,   
      }
    })

    revalidatePath('/dashboard/leads')
    return { success: true }
  } catch (error: any) {
    console.error("UNCLAIM JOB ERROR:", error)
    return { error: "Failed to release the job." }
  }
}

// 2. SUBMIT INSTALLATION (DONE)
export async function submitInstallation(formData: FormData) {
  const jobId = formData.get('jobId') as string
  const deviceId = formData.get('deviceId') as string // <--- Now expects the ID
  const simCardId = formData.get('simCardId') as string // <--- Now expects the ID
  const plateNumber = formData.get('plateNumber') as string
  const vehicleName = formData.get('vehicleName') as string

  if (!deviceId || !simCardId) {
    return { error: "You must search and select an IMEI and SIM Card from the inventory." }
  }

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Lock the Tracker & SIM as 'INSTALLED'
      await tx.device.update({ where: { id: deviceId }, data: { status: 'INSTALLED' } })
      await tx.simCard.update({ where: { id: simCardId }, data: { status: 'INSTALLED' } })

      // 2. Update the Job
      await tx.job.update({
        where: { id: jobId },
        data: {
          status: 'PENDING_QC',
          device: { connect: { id: deviceId } },
          simCard: { connect: { id: simCardId } },
          vehicle: {
            update: {
              name: vehicleName,
              plateNumber: plateNumber
            }
          }
        }
      })
    })

    revalidatePath('/dashboard/leads')
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: "System Error. The items might have already been used." }
  }
}