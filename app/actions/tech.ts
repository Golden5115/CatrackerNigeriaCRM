'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function verifyAndSaveJob(formData: FormData) {
  let shouldRedirect = false;
  
  try {
    const jobId = formData.get('jobId') as string;
    const imei = formData.get('imei') as string | null;
    const simNumber = formData.get('simNumber') as string | null;
    const plateNumber = formData.get('plateNumber') as string;

    const job = await prisma.job.findUnique({ 
      where: { id: jobId },
      include: { device: true, simCard: true }
    });
    if (!job) return { error: "Job not found." }

    let deviceId = job.deviceId;
    let simCardId = job.simCardId;

    // 1. Process Device (Strict IN_STOCK Check)
    if (imei && imei !== job.device?.imei) {
       const existingDevice = await prisma.device.findUnique({ where: { imei }, include: { job: true } });
       if (!existingDevice) return { error: `IMEI ${imei} is not in your inventory. Please add to stock first.` }
       if (existingDevice.job && existingDevice.job.id !== jobId) return { error: `IMEI ${imei} is already installed in another vehicle.` }
       deviceId = existingDevice.id;
    }

    // 2. Process SIM (Strict IN_STOCK Check)
    if (simNumber && simNumber !== job.simCard?.simNumber) {
       const existingSim = await prisma.simCard.findUnique({ where: { simNumber }, include: { job: true } });
       if (!existingSim) return { error: `SIM ${simNumber} is not in your inventory. Please add to stock first.` }
       if (existingSim.job && existingSim.job.id !== jobId) return { error: `SIM ${simNumber} is already active in another vehicle.` }
       simCardId = existingSim.id;
    }

    // 3. Safe Hardware Swap (Frees up the old hardware to the warehouse)
    if (job.deviceId && job.deviceId !== deviceId) {
       await prisma.device.update({ where: { id: job.deviceId }, data: { status: 'IN_STOCK' } })
    }
    if (job.simCardId && job.simCardId !== simCardId) {
       await prisma.simCard.update({ where: { id: job.simCardId }, data: { status: 'IN_STOCK' } })
    }

    if (deviceId) await prisma.device.update({ where: { id: deviceId }, data: { status: 'INSTALLED' } })
    if (simCardId) await prisma.simCard.update({ where: { id: simCardId }, data: { status: 'INSTALLED' } })

    // 4. Update Vehicle Plate Number
    if (job.vehicleId && plateNumber) {
       await prisma.vehicle.update({ where: { id: job.vehicleId }, data: { plateNumber } })
    }

    const nextStatus = job.jobType === 'MAINTENANCE' ? 'ACTIVE' : 'CONFIGURED'

    // 5. Finalize Verification
    await prisma.job.update({
      where: { id: jobId },
      data: {
        deviceId,
        simCardId,
        status: nextStatus,
        configurationDate: new Date(),
        serverConfig: true,
        supportNotes: null // Wipes out previous rejection notes upon approval
      }
    })

    shouldRedirect = true;

  } catch (error) {
    console.error(error);
    return { error: "Failed to verify job due to a system error." };
  }
  
  // Safe Redirect outside of Try/Catch
  if (shouldRedirect) {
    revalidatePath('/dashboard/tech');
    revalidatePath('/dashboard/activation');
    revalidatePath('/dashboard/leads');
    redirect('/dashboard/tech');
  }
}