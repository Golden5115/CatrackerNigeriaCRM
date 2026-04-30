'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function processHardwareSwap(formData: FormData) {
  const jobId = formData.get('jobId') as string
  const vehicleId = formData.get('vehicleId') as string
  const swapType = formData.get('swapType') as 'DEVICE' | 'SIM'
  const newHardwareId = formData.get('newHardwareId') as string // The ID of the new item they picked from stock

  try {
    // 1. Find the Vehicle's previous hardware by looking at its past jobs
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: { 
        jobs: { 
          orderBy: { createdAt: 'desc' },
          // We look for jobs that actually had hardware assigned to find the "old" one
          where: { OR: [{ deviceId: { not: null } }, { simCardId: { not: null } }] }
        } 
      }
    })

    const previousJob = vehicle?.jobs[0] // The most recent installation/swap

    // 2. Perform the Swap in a secure Prisma Transaction
    await prisma.$transaction(async (tx) => {
      
      if (swapType === 'DEVICE') {
        // A. Mark the old device as FAULTY (if it existed)
        if (previousJob?.deviceId) {
          await tx.device.update({
            where: { id: previousJob.deviceId },
            data: { status: 'FAULTY' }
          })
        }

        // B. Mark the new device as INSTALLED
        await tx.device.update({
          where: { id: newHardwareId },
          data: { status: 'INSTALLED' }
        })

        // C. Update the current Support Ticket to reflect the swap
        await tx.job.update({
          where: { id: jobId },
          data: { 
            deviceId: newHardwareId, 
            jobType: 'DEVICE_REPLACEMENT',
            status: 'PENDING_QC' // Send back to tech support to verify the new tracker!
          }
        })
      } 
      
      else if (swapType === 'SIM') {
        // A. Mark old SIM as FAULTY
        if (previousJob?.simCardId) {
          await tx.simCard.update({
            where: { id: previousJob.simCardId },
            data: { status: 'FAULTY' }
          })
        }

        // B. Mark new SIM as INSTALLED
        await tx.simCard.update({
          where: { id: newHardwareId },
          data: { status: 'INSTALLED' }
        })

        // C. Update Job
        await tx.job.update({
          where: { id: jobId },
          data: { 
            simCardId: newHardwareId, 
            jobType: 'SIM_REPLACEMENT',
            status: 'PENDING_QC'
          }
        })
      }
    })

    revalidatePath('/dashboard/leads')
    return { success: true }
    
  } catch (error) {
    console.error("Swap Error:", error)
    return { error: "Failed to process hardware swap. Please try again." }
  }
}

export async function createSupportTicket(formData: FormData) {
  const fullName = formData.get('fullName') as string
  const phoneNumber = formData.get('phoneNumber') as string
  const plateNumber = formData.get('plateNumber') as string
  const jobType = formData.get('jobType') as any
  const supportNotes = formData.get('supportNotes') as string

  if (!fullName || !phoneNumber || !plateNumber || !jobType) {
    return { error: "Please fill in all required fields." }
  }

  try {
    // 1. SMART LOOKUP: Find existing client or create a new one instantly
    let client = await prisma.client.findUnique({ where: { phoneNumber } })
    if (!client) {
      client = await prisma.client.create({ data: { fullName, phoneNumber } })
    }

    // 2. Find existing vehicle or create a new one for this client
    let vehicle = await prisma.vehicle.findFirst({
      where: { plateNumber, clientId: client.id }
    })
    
    if (!vehicle) {
      vehicle = await prisma.vehicle.create({
        data: { name: 'Support Vehicle', plateNumber, clientId: client.id }
      })
    }

    // 3. Create the Support Ticket and drop it into the Sales Pipeline
    await prisma.job.create({
      data: {
        vehicleId: vehicle.id,
        status: 'NEW_LEAD', // Puts it in the very first column for dispatch
        jobType: jobType,
        supportNotes: supportNotes
      }
    })

    revalidatePath('/dashboard/leads')
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: "Failed to create support ticket." }
  }
}

export async function resolveMaintenanceJob(jobId: string) {
  try {
    await prisma.job.update({
      where: { id: jobId },
      data: { status: 'PENDING_QC' } // Send to Tech Support to verify it's back online!
    })
    revalidatePath('/dashboard/leads')
    return { success: true }
  } catch (error) {
    return { error: "Failed to close ticket." }
  }
}