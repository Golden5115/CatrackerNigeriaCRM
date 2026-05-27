'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// 1. ADD TRACKER (IMEI)
export async function addDevice(formData: FormData) {
  const imei = formData.get('imei') as string
  if (!imei || imei.length < 5) return { error: "Invalid IMEI. It is too short." }

  try {
    await prisma.device.create({
      data: { imei, status: 'IN_STOCK' }
    })
    revalidatePath('/dashboard/inventory')
    return { success: true }
  } catch (e: any) {
    if (e.code === 'P2002') return { error: "This IMEI has already been used in the system." }
    return { error: "Failed to add device to database." }
  }
}

// 2. ADD SIM CARD
export async function addSimCard(formData: FormData) {
  const simNumber = formData.get('simNumber') as string
  const network = formData.get('network') as string
  
  if (!simNumber || simNumber.length < 10) return { error: "Invalid SIM Number." }

  try {
    await prisma.simCard.create({
      data: { simNumber, network, status: 'IN_STOCK' }
    })
    revalidatePath('/dashboard/inventory')
    return { success: true }
  } catch (e: any) {
    if (e.code === 'P2002') return { error: "This SIM Number has already been used in the system." }
    return { error: "Failed to add SIM to database." }
  }
}

// 3. EDIT HARDWARE (NEW)
export async function editHardware(type: 'DEVICE' | 'SIM', id: string, newValue: string) {
  try {
    if (type === 'DEVICE') {
      await prisma.device.update({ where: { id }, data: { imei: newValue } })
    } else {
      await prisma.simCard.update({ where: { id }, data: { simNumber: newValue } })
    }
    revalidatePath('/dashboard/inventory')
    revalidatePath('/dashboard/clients')
    revalidatePath('/dashboard/search')
    return { success: true }
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { error: `This ${type === 'DEVICE' ? 'IMEI' : 'SIM Number'} is already registered to another piece of hardware.` }
    }
    return { error: "Failed to update record." }
  }
}

export async function searchAvailableStock(query: string, type: 'DEVICE' | 'SIM') {
  if (query.length < 3) return []
  
  if (type === 'DEVICE') {
    return await prisma.device.findMany({
      where: { status: 'IN_STOCK', imei: { contains: query } },
      take: 5
    })
  } else {
    return await prisma.simCard.findMany({
      where: { status: 'IN_STOCK', simNumber: { contains: query } },
      take: 5
    })
  }
}