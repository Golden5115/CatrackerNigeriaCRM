'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getSupportTickets() {
  return await prisma.support.findMany({ 
    orderBy: { date: 'desc' } 
  })
}

export async function getAvailableInventory() {
  // We fetch the data...
  const [devices, simCards, oldDevices, oldSims] = await Promise.all([
    prisma.device.findMany({ where: { status: 'IN_STOCK' } }),
    prisma.simCard.findMany({ where: { status: 'IN_STOCK' } }),
    prisma.device.findMany({ where: { status: { in: ['INSTALLED', 'FAULTY'] } } }),
    prisma.simCard.findMany({ where: { status: { in: ['INSTALLED', 'FAULTY'] } } })
  ]);
  
  // 🟢 THE FIX: Make sure we are returning oldDevices and oldSims here!
  return { 
    devices, 
    simCards, 
    oldDevices, 
    oldSims 
  };
}

export async function createSupportTicket(formData: FormData) {
  const clientName = formData.get('clientName') as string
  const address = formData.get('address') as string
  const issue = formData.get('issue') as string
  const manualDate = formData.get('date') as string 

  await prisma.support.create({
    data: {
      clientName,
      address,
      issue,
      date: new Date(manualDate), 
      status: 'PENDING'
    }
  })
  revalidatePath('/dashboard/support')
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
      installerName: formData.get('installerName') as string,
      imei: imei || null, 
      trackerSim: trackerSim || null, 
      oldImei: oldImei || null,
      oldTrackerSim: oldTrackerSim || null,
      process: formData.get('process') as string,
      status: 'RESOLVED'
    }
  })

  // 2. Mark NEW Hardware as INSTALLED
  if (imei) {
    await prisma.device.updateMany({ where: { imei }, data: { status: 'INSTALLED' } });
  }
  if (trackerSim) {
    await prisma.simCard.updateMany({ where: { simNumber: trackerSim }, data: { status: 'INSTALLED' } });
  }

  // 3. Mark OLD Hardware as FAULTY
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
  await prisma.support.delete({ where: { id } })
  revalidatePath('/dashboard/support')
}