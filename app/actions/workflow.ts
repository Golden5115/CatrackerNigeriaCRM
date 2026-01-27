'use server'

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const prisma = new PrismaClient()

// ... keep markInstallationDone as is ...

// 2. TECH SUPPORT: Save details and move to Activation
export async function submitTechConfiguration(formData: FormData) {
  const jobId = formData.get('jobId') as string
  const imei = formData.get('imei') as string
  const simNumber = formData.get('simNumber') as string
  const installerName = formData.get('installerName') as string 
  const platformId = formData.get('platformId') as string

  try {
    // A. Create the Device Entry
    await prisma.device.create({
      data: {
        imei,
        simNumber,
        type: "GPS_TRACKER",
        status: "ACTIVE",
        jobId: jobId
      }
    })

    // B. Update Job (NOW INCLUDES configurationDate)
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'CONFIGURED', 
        installerName: installerName,
        platformId: platformId,
        serverConfig: true,
        // ✅ NEW: Capture the exact timestamp of configuration
        configurationDate: new Date() 
      }
    })

  } catch (error: any) {
    if (error.code === 'P2002') {
      const target = error.meta?.target || [];
      if (target.includes('imei')) redirect(`/dashboard/tech/${jobId}?error=imei_taken`)
      if (target.includes('simNumber')) redirect(`/dashboard/tech/${jobId}?error=sim_taken`)
    }
    throw error
  }

  revalidatePath('/dashboard/tech')
  redirect('/dashboard/tech')
}