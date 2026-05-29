'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function activateJob(formData: FormData) {
  try {
    const jobId = formData.get('jobId') as string;
    const imei = formData.get('imei') as string;
    const simNumber = formData.get('simNumber') as string;
    const installerName = formData.get('installerName') as string;
    const installPhoto = formData.get('installPhoto') as string;

    let deviceId = null;
    let simCardId = null;

    if (imei) {
      const existingDevice = await prisma.device.findUnique({ where: { imei }, include: { job: true } });
      if (!existingDevice) {
        return { error: `IMEI ${imei} is not in your inventory. Please add to stock first.` }
      }
      if (existingDevice.job && existingDevice.job.id !== jobId) {
        return { error: `IMEI ${imei} is already installed in another vehicle.` }
      }
      deviceId = existingDevice.id;
    }

    if (simNumber) {
      const existingSim = await prisma.simCard.findUnique({ where: { simNumber }, include: { job: true } });
      if (!existingSim) {
        return { error: `SIM ${simNumber} is not in your inventory. Please add to stock first.` }
      }
      if (existingSim.job && existingSim.job.id !== jobId) {
        return { error: `SIM ${simNumber} is already active in another vehicle.` }
      }
      simCardId = existingSim.id;
    }

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) return { error: "Job not found." }

    // Safe swap: Return old hardware to warehouse if it was changed during activation
    if (job.deviceId && job.deviceId !== deviceId) {
       await prisma.device.update({ where: { id: job.deviceId }, data: { status: 'IN_STOCK' } })
    }
    if (job.simCardId && job.simCardId !== simCardId) {
       await prisma.simCard.update({ where: { id: job.simCardId }, data: { status: 'IN_STOCK' } })
    }

    // Assign new hardware
    if (deviceId) await prisma.device.update({ where: { id: deviceId }, data: { status: 'INSTALLED' } })
    if (simCardId) await prisma.simCard.update({ where: { id: simCardId }, data: { status: 'INSTALLED' } })

    await prisma.job.update({
      where: { id: jobId },
      data: {
        deviceId,
        simCardId,
        installerName,
        installPhoto: installPhoto || null,
        status: 'CONFIGURED',
        onboarded: true,
        configurationDate: new Date()
      }
    })

    revalidatePath('/dashboard/tech');
    return { success: true };

  } catch (error) {
    console.error(error);
    return { error: "Failed to activate job due to a system error." };
  }
}