'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getSupportTickets() {
  return await prisma.support.findMany({ 
    where: { isArchived: false },
    orderBy: { date: 'desc' } 
  })
}

export async function getAvailableInventory() {
  const [devices, simCards, oldDevices, oldSims] = await Promise.all([
    // 1. New Hardware Search: STRICTLY limit to 'IN_STOCK'
    prisma.device.findMany({ where: { status: 'IN_STOCK' } }),
    prisma.simCard.findMany({ where: { status: 'IN_STOCK' } }),
    
    // 2. Old Hardware Search: NO LIMITS. Fetch everything so they can find it.
    prisma.device.findMany(),
    prisma.simCard.findMany()
  ]);
  
  return { devices, simCards, oldDevices, oldSims };
}

export async function createSupportTicket(formData: FormData) {
  try {
    const clientName = formData.get('clientName') as string
    const phoneNumber = formData.get('phoneNumber') as string
    const address = formData.get('address') as string
    const issue = formData.get('issue') as string
    
    // 🟢 NEW: Capture manual date and payment status
    const manualDate = formData.get('date') as string
    const paymentStatus = formData.get('paymentStatus') as string

    await prisma.support.create({
      data: {
        clientName,
        phoneNumber,
        address,
        issue,
        date: new Date(manualDate), // Converts your manual input to a Database Date
        paymentStatus,
        status: 'PENDING'
      }
    })
    revalidatePath('/dashboard/support')
    return { success: true }
  } catch (error) {
    return { error: "Failed to create support ticket." }
  }
}

export async function resolveSupportTicket(formData: FormData) {
  const id = formData.get('id') as string
  
  const imei = formData.get('imei') as string
  const trackerSim = formData.get('trackerSim') as string
  const oldImei = formData.get('oldImei') as string
  const oldTrackerSim = formData.get('oldTrackerSim') as string

  // 1. Update the Support Ticket
  await prisma.support.update({
    where: { id },
    data: {
      vehicleName: formData.get('vehicleName') as string,
      imei: imei || null, 
      trackerSim: trackerSim || null, 
      oldImei: oldImei || null,
      oldTrackerSim: oldTrackerSim || null,
      process: formData.get('process') as string,
      status: 'RESOLVED'
    }
  })

  // 2. Mark NEW Hardware as INSTALLED in Inventory
  if (imei) {
    await prisma.device.updateMany({ where: { imei }, data: { status: 'INSTALLED' } });
  }
  if (trackerSim) {
    await prisma.simCard.updateMany({ where: { simNumber: trackerSim }, data: { status: 'INSTALLED' } });
  }

  // 3. Mark OLD Hardware as FAULTY in Inventory
  if (oldImei) {
    await prisma.device.updateMany({ where: { imei: oldImei }, data: { status: 'FAULTY' } });
  }
  if (oldTrackerSim) {
    await prisma.simCard.updateMany({ where: { simNumber: oldTrackerSim }, data: { status: 'FAULTY' } });
  }

  revalidatePath('/dashboard/support')
  revalidatePath('/dashboard/inventory')
}

export async function deleteSupportTicket(formData: FormData) {
  const id = formData.get('id') as string
  await prisma.support.update({ 
    where: { id },
    data: { isArchived: true, deletedAt: new Date() }
  })
  revalidatePath('/dashboard/support')
  revalidatePath('/dashboard/recycle-bin')
}

export async function restoreSupportTicket(id: string) {
  await prisma.support.update({ 
    where: { id },
    data: { isArchived: false, deletedAt: null }
  })
  revalidatePath('/dashboard/support')
  revalidatePath('/dashboard/recycle-bin')
}

// Legacy imports to protect other files from build errors
export async function resolveMaintenanceJob(jobId: string) { return { success: true } }
export async function processHardwareSwap(formData: FormData) { return { success: true } }