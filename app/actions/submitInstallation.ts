'use server'

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const prisma = new PrismaClient()

export async function submitInstallation(formData: FormData) {
  const jobId = formData.get('jobId') as string
  const installerId = formData.get('installerId') as string // Captured from form
  const imei = formData.get('imei') as string
  const sim = formData.get('sim') as string
  const odometer = formData.get('odometer') as string
  const deviceType = formData.get('deviceType') as string

  // 1. Create the Device entry
  // We use 'upsert' just in case the device already exists in inventory
  const device = await prisma.device.upsert({
    where: { imei: imei },
    update: { 
      status: 'INSTALLED',
      simNumber: sim 
    },
    create: {
      imei,
      simNumber: sim,
      type: deviceType,
      status: 'INSTALLED'
    }
  })

  // 2. Update the Job
  await prisma.job.update({
    where: { id: jobId },
    data: {
      status: 'INSTALLED',
      assignedToId: installerId, // Assigning the installer here!
      installDate: new Date(),
      odometer: parseInt(odometer) || 0,
      // Link the device we just created/found
      device: {
        connect: { id: device.id }
      }
    }
  })

  // 3. Redirect back to list
  revalidatePath('/dashboard/installer')
  redirect('/dashboard/installer')
}