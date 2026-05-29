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

// 3. EDIT HARDWARE
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

// 4. ASSIGN HARDWARE TO TECHNICIAN
export async function assignHardware(
  type: 'DEVICE' | 'SIM', 
  ids: string[], 
  installerName: string | null 
) {
  try {
    const targetName = installerName?.trim() || null;
    
    if (type === 'DEVICE') {
      await prisma.device.updateMany({
        where: { id: { in: ids } },
        data: { assignedToName: targetName }
      });
    } else {
      await prisma.simCard.updateMany({
        where: { id: { in: ids } },
        data: { assignedToName: targetName }
      });
    }
    
    revalidatePath('/dashboard/inventory');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Failed to assign hardware." };
  }
}

// 5. SEARCH WAREHOUSE INVENTORY
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

/// 6. UPDATE JOB HARDWARE (SMART SWAP)
export async function updateJobHardware(jobId: string, type: 'DEVICE' | 'SIM', newValue: string) {
  if (!newValue.trim()) return { error: "Value cannot be empty." }

  try {
    const job = await prisma.job.findUnique({ where: { id: jobId }, include: { device: true, simCard: true } });
    if (!job) return { error: "Job not found." }

    if (type === 'DEVICE') {
      const existingDevice = await prisma.device.findUnique({ where: { imei: newValue }, include: { job: true } });
      
      // 🟢 STRICT CHECK 1: Does it exist in the warehouse?
      if (!existingDevice) {
        return { error: "This IMEI does not exist in your inventory. Please add it to stock first." }
      }
      
      // 🟢 STRICT CHECK 2: Is it already installed in another vehicle?
      if (existingDevice.job && existingDevice.job.id !== jobId) {
        return { error: `IMEI ${newValue} is already assigned to another vehicle.` }
      }
      
      if (existingDevice.id === job.deviceId) return { success: true }

      // Safe swap: Return old to IN_STOCK, set new to INSTALLED
      if (job.deviceId) {
        await prisma.device.update({ where: { id: job.deviceId }, data: { status: 'IN_STOCK' } })
      }
      
      await prisma.job.update({ where: { id: jobId }, data: { deviceId: existingDevice.id } })
      await prisma.device.update({ where: { id: existingDevice.id }, data: { status: 'INSTALLED' } })
      
    } else {
      const existingSim = await prisma.simCard.findUnique({ where: { simNumber: newValue }, include: { job: true } });
      
      // 🟢 STRICT CHECK 1: Does it exist in the warehouse?
      if (!existingSim) {
        return { error: "This SIM Number does not exist in your inventory. Please add it to stock first." }
      }
      
      // 🟢 STRICT CHECK 2: Is it already installed in another vehicle?
      if (existingSim.job && existingSim.job.id !== jobId) {
        return { error: `SIM ${newValue} is already assigned to another vehicle.` }
      }
      
      if (existingSim.id === job.simCardId) return { success: true }

      // Safe swap: Return old to IN_STOCK, set new to INSTALLED
      if (job.simCardId) {
        await prisma.simCard.update({ where: { id: job.simCardId }, data: { status: 'IN_STOCK' } })
      }
      
      await prisma.job.update({ where: { id: jobId }, data: { simCardId: existingSim.id } })
      await prisma.simCard.update({ where: { id: existingSim.id }, data: { status: 'INSTALLED' } })
    }

    revalidatePath('/dashboard/clients')
    revalidatePath('/dashboard/tech')
    return { success: true }

  } catch (error) {
    return { error: "An unexpected error occurred while updating hardware." }
  }
}