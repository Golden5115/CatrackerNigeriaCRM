'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// --- SOFT DELETE CLIENT (ARCHIVE) ---
// Releases all assigned devices and SIMs back to IN_STOCK before archiving
export async function deleteClient(clientId: string) {
  await prisma.$transaction(async (tx) => {
    // 1. Find all jobs under this client's vehicles
    const vehicles = await tx.vehicle.findMany({
      where: { clientId },
      include: { jobs: { select: { id: true, deviceId: true, simCardId: true } } }
    })

    // 2. Release all assigned devices and SIMs back to inventory
    for (const vehicle of vehicles) {
      for (const job of vehicle.jobs) {
        if (job.deviceId) {
          await tx.device.update({
            where: { id: job.deviceId },
            data: { status: 'IN_STOCK' }
          })
        }
        if (job.simCardId) {
          await tx.simCard.update({
            where: { id: job.simCardId },
            data: { status: 'IN_STOCK' }
          })
        }
      }
    }

    // 3. Archive the client (soft delete)
    await tx.client.update({
      where: { id: clientId },
      data: { isArchived: true, deletedAt: new Date() }
    })
  })

  revalidatePath('/dashboard/leads')
  revalidatePath('/dashboard/clients')
  revalidatePath('/dashboard/inventory')
  revalidatePath('/dashboard/recycle-bin')
}

// --- RESTORE CLIENT (UN-ARCHIVE) ---
export async function restoreClient(clientId: string) {
  await prisma.client.update({
    where: { id: clientId },
    data: { isArchived: false, deletedAt: null }
  });

  revalidatePath('/dashboard/leads')
  revalidatePath('/dashboard/clients')
  revalidatePath('/dashboard/recycle-bin')
}

// --- DELETE SINGLE JOB TICKET (from Sales Pipeline) ---
// Only removes the job + its vehicle, NOT the client or other jobs.
// Releases any assigned device/SIM back to IN_STOCK.
export async function deleteJobTicket(jobId: string) {
  await prisma.$transaction(async (tx) => {
    // 1. Get the job with its hardware assignments
    const job = await tx.job.findUnique({
      where: { id: jobId },
      select: { id: true, vehicleId: true, deviceId: true, simCardId: true }
    })
    if (!job) throw new Error('Job not found')

    // 2. Release device back to inventory
    if (job.deviceId) {
      await tx.device.update({
        where: { id: job.deviceId },
        data: { status: 'IN_STOCK' }
      })
    }

    // 3. Release SIM back to inventory
    if (job.simCardId) {
      await tx.simCard.update({
        where: { id: job.simCardId },
        data: { status: 'IN_STOCK' }
      })
    }

    // 4. Archive the job ticket (Soft delete) and clear hardware
    await tx.job.update({ 
      where: { id: jobId },
      data: { 
        isArchived: true, 
        deletedAt: new Date(),
        deviceId: null,
        simCardId: null
      }
    })

    // 5. Check if this vehicle has any other active jobs
    const remainingJobs = await tx.job.count({ 
      where: { vehicleId: job.vehicleId, isArchived: false } 
    })

    // 6. If no other active jobs reference this vehicle, archive it too
    if (remainingJobs === 0) {
      await tx.vehicle.update({ 
        where: { id: job.vehicleId },
        data: { isArchived: true, deletedAt: new Date() }
      })
    }
  })

  revalidatePath('/dashboard/leads')
  revalidatePath('/dashboard/clients')
  revalidatePath('/dashboard/inventory')
  revalidatePath('/dashboard/recycle-bin')
}

// --- RESTORE SINGLE JOB TICKET ---
export async function restoreJobTicket(jobId: string) {
  await prisma.$transaction(async (tx) => {
    const job = await tx.job.update({
      where: { id: jobId },
      data: { isArchived: false, deletedAt: null }
    })

    // Ensure vehicle is also un-archived if it was archived
    await tx.vehicle.update({
      where: { id: job.vehicleId },
      data: { isArchived: false, deletedAt: null }
    })
  })

  revalidatePath('/dashboard/leads')
  revalidatePath('/dashboard/clients')
  revalidatePath('/dashboard/recycle-bin')
}

// --- DELETE SINGLE VEHICLE ---
export async function deleteVehicle(vehicleId: string) {
  await prisma.vehicle.update({ 
    where: { id: vehicleId },
    data: { isArchived: true, deletedAt: new Date() }
  });
  revalidatePath('/dashboard/clients/[id]/edit'); 
  revalidatePath('/dashboard/recycle-bin'); 
}

// --- RESTORE SINGLE VEHICLE ---
export async function restoreVehicle(vehicleId: string) {
  await prisma.vehicle.update({ 
    where: { id: vehicleId },
    data: { isArchived: false, deletedAt: null }
  });
  revalidatePath('/dashboard/recycle-bin'); 
}

// --- UPDATE CLIENT & VEHICLES ---
export async function updateClient(formData: FormData) {
  const clientId = formData.get('clientId') as string;
  const vehicleCount = parseInt(formData.get('vehicleCount') as string || '0');
  
  // 1. FIX: Safe Formatting for Unique Constraints
  // If email is left blank, we force it to `null` so it doesn't crash the database
  const emailRaw = formData.get('email') as string;
  const email = emailRaw && emailRaw.trim() !== '' ? emailRaw.trim() : null;

  const dobRaw = formData.get('dob') as string;
  const dob = dobRaw ? new Date(dobRaw) : null;

  // 2. Update Client Info
  await prisma.client.update({
    where: { id: clientId },
    data: {
      fullName: formData.get('fullName') as string,
      email: email, 
      phoneNumber: formData.get('phoneNumber') as string,
      address: formData.get('address') as string || null,
      state: formData.get('state') as string || null,
      leadSource: formData.get('leadSource') as string || null,
      dob: dob,
    }
  });

  // 3. Loop Through Vehicles (Update or Create)
  for (let i = 0; i < vehicleCount; i++) {
    const vId = formData.get(`vehicleId_${i}`) as string;
    const name = formData.get(`vehicleName_${i}`) as string;
    
    const yearRaw = formData.get(`vehicleYear_${i}`) as string;
    const year = yearRaw && yearRaw.trim() !== '' ? yearRaw.trim() : null;
    
    const plateRaw = formData.get(`vehiclePlate_${i}`) as string;
    const plate = plateRaw && plateRaw.trim() !== '' ? plateRaw.trim() : null;

    // 2. FIX: Only require the Name. Plate is optional!
    if (name && name.trim() !== '') {
      if (vId && vId !== 'NEW') {
        // UPDATE Existing Vehicle
        await prisma.vehicle.update({
          where: { id: vId },
          data: { name, year, plateNumber: plate }
        });
      } else {
        // CREATE New Vehicle (Added during edit)
        const newVehicle = await prisma.vehicle.create({
          data: {
            clientId,
            name,
            year,
            plateNumber: plate // Saves safely even if empty
          }
        });
        // Auto-create a Job ticket for the new vehicle
        await prisma.job.create({
          data: { vehicleId: newVehicle.id, status: 'NEW_LEAD' }
        });
      }
    }
  }

  // Refresh all relevant views
  revalidatePath(`/dashboard/clients/${clientId}`);
  revalidatePath('/dashboard/clients');
  revalidatePath('/dashboard/leads');
  
  // 3. FIX: Redirect them to the Client's Profile Page so they can instantly see the new lead/vehicle!
  redirect(`/dashboard/clients/${clientId}`);
}