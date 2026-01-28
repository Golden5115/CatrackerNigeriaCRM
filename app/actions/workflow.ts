'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function submitTechConfiguration(formData: FormData) {
  const jobId = formData.get('jobId') as string
  const clientId = formData.get('clientId') as string
  const vehicleId = formData.get('vehicleId') as string
  
  // Standard Tech Info
  const imei = formData.get('imei') as string
  const simNumber = formData.get('simNumber') as string
  const installerName = formData.get('installerName') as string 
  const platformId = formData.get('platformId') as string

  // Missing Info Capture
  const clientEmail = formData.get('clientEmail') as string
  const vehiclePlate = formData.get('vehiclePlate') as string
  const vehicleYear = formData.get('vehicleYear') as string

  try {
    // 1. If Email was provided (because it was missing), update Client
    if (clientEmail) {
      await prisma.client.update({
        where: { id: clientId },
        data: { email: clientEmail }
      })
    }

    // 2. If Vehicle info was provided, update Vehicle
    if (vehiclePlate || vehicleYear) {
      await prisma.vehicle.update({
        where: { id: vehicleId },
        data: {
          ...(vehiclePlate && { plateNumber: vehiclePlate }),
          ...(vehicleYear && { year: vehicleYear })
        }
      })
    }

    // 3. Create Device
    await prisma.device.create({
      data: {
        imei,
        simNumber,
        type: "GPS_TRACKER",
        status: "ACTIVE",
        jobId: jobId
      }
    })

    // 4. Update Job
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'CONFIGURED', 
        installerName: installerName,
        platformId: platformId,
        serverConfig: true,
        configurationDate: new Date() 
      }
    })

  } catch (error: any) {
    if (error.code === 'P2002') {
      const target = error.meta?.target || [];
      if (target.includes('imei')) redirect(`/dashboard/tech/${jobId}?error=imei_taken`)
      if (target.includes('simNumber')) redirect(`/dashboard/tech/${jobId}?error=sim_taken`)
      // Handle email collision
      if (target.includes('email')) redirect(`/dashboard/tech/${jobId}?error=email_taken`)
    }
    throw error
  }

  revalidatePath('/dashboard/tech')
  redirect('/dashboard/tech')
}