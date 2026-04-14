'use server'

import { prisma } from "@/lib/prisma"
import { verifySession } from "@/lib/session"
import { revalidatePath } from "next/cache"

// 1. CLAIM JOB (Now supports manually typing the installer's name)
export async function claimJob(jobId: string, manualInstallerName?: string) {
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
        installerName: manualInstallerName || null // 👇 Saves the manual name!
      }
    })

    revalidatePath('/dashboard/leads')
    return { success: true }
    
  } catch (error: any) {
    console.error("CLAIM JOB ERROR:", error)
    return { error: error.message || "Failed to connect to database." }
  }
}

// 2. UNCLAIM JOB (Fixed permissions)
export async function unclaimJob(jobId: string) {
  try {
    const session = await verifySession()
    if (!session?.userId) return { error: "Unauthorized." }

    const job = await prisma.job.findUnique({ where: { id: jobId } })
    
    // 👇 FIX: Allow Admins, Operations, OR the user who originally claimed it
    const canUnclaim = session.role === 'ADMIN' || session.role === 'OPERATIONS' || job?.installerId === session.userId

    if (!canUnclaim) { 
      return { error: "Unauthorized. You cannot return a job you didn't claim." } 
    }

    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'SCHEDULED',
        installerId: null,   
        installerName: null // Clear the manual name too
      }
    })

    revalidatePath('/dashboard/leads')
    return { success: true }
  } catch (error: any) {
    console.error("UNCLAIM JOB ERROR:", error)
    return { error: "Failed to release the job." }
  }
}

// 3. SUBMIT INSTALLATION
export async function submitInstallation(formData: FormData) {
  const jobId = formData.get('jobId') as string
  const deviceId = formData.get('deviceId') as string 
  const simCardId = formData.get('simCardId') as string 
  const plateNumber = formData.get('plateNumber') as string
  const vehicleName = formData.get('vehicleName') as string
  const manualInstallDate = formData.get('installDate') as string
  
  // 👇 Look for the new email input
  const clientEmail = formData.get('clientEmail') as string | null

  if (!deviceId || !simCardId) {
    return { error: "You must search and select an IMEI and SIM Card from the inventory." }
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.device.update({ where: { id: deviceId }, data: { status: 'INSTALLED' } })
      await tx.simCard.update({ where: { id: simCardId }, data: { status: 'INSTALLED' } })

      // Update the Job, but also retrieve the Vehicle so we know which Client owns it!
      const updatedJob = await tx.job.update({
        where: { id: jobId },
        data: {
          status: 'PENDING_QC',
          installDate: new Date(manualInstallDate),
          device: { connect: { id: deviceId } },
          simCard: { connect: { id: simCardId } },
          vehicle: {
            update: { name: vehicleName, plateNumber: plateNumber }
          }
        },
        include: { vehicle: true } 
      })

      // 👇 If they typed an email, save it straight to the Client Database!
      if (clientEmail && updatedJob.vehicle.clientId) {
        await tx.client.update({
          where: { id: updatedJob.vehicle.clientId },
          data: { email: clientEmail }
        })
      }
    })

    revalidatePath('/dashboard/leads')
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: "System Error. The items might have already been used, or that email is already registered to someone else." }
  }
}

// 4. MARK AS LOST
export async function markJobAsLost(formData: FormData) {
  const jobId = formData.get('jobId') as string
  const lostReason = formData.get('lostReason') as string

  try {
    await prisma.job.update({
      where: { id: jobId },
      data: { 
        status: 'LEAD_LOST',
        lostReason: lostReason 
      }
    })
    
    const { revalidatePath } = await import('next/cache')
    revalidatePath('/dashboard/leads')
    revalidatePath('/dashboard/clients')
    return { success: true }
  } catch (error) {
    return { error: "Failed to mark lead as lost." }
  }
}