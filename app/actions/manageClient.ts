'use server'

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const prisma = new PrismaClient()

// --- DELETE CLIENT ---
export async function deleteClient(clientId: string) {
  // 1. Delete related data first (Jobs -> Vehicles -> Client)
  // Note: If you configured "Cascade Delete" in schema, this happens automatically. 
  // But doing it manually is safer here.
  
  // Find all vehicles for this client
  const vehicles = await prisma.vehicle.findMany({ where: { clientId } });
  const vehicleIds = vehicles.map(v => v.id);

  // Delete all jobs for these vehicles
  await prisma.job.deleteMany({ where: { vehicleId: { in: vehicleIds } } });

  // Delete the vehicles
  await prisma.vehicle.deleteMany({ where: { clientId } });

  // Finally, delete the client
  await prisma.client.delete({ where: { id: clientId } });

  revalidatePath('/dashboard/leads')
  revalidatePath('/dashboard/clients')
}

// --- NEW: DELETE SINGLE VEHICLE ---
export async function deleteVehicle(vehicleId: string) {
  await prisma.vehicle.delete({ where: { id: vehicleId } });
  revalidatePath('/dashboard/clients/[id]/edit'); 
}

// --- UPDATE CLIENT & VEHICLES ---
export async function updateClient(formData: FormData) {
  const clientId = formData.get('clientId') as string;
  const vehicleCount = parseInt(formData.get('vehicleCount') as string || '0');
  
  // 1. Update Client Info
  await prisma.client.update({
    where: { id: clientId },
    data: {
      fullName: formData.get('fullName') as string,
      email: formData.get('email') as string,
      phoneNumber: formData.get('phoneNumber') as string,
      address: formData.get('address') as string,
      state: formData.get('state') as string,
      leadSource: formData.get('leadSource') as string,
      dob: formData.get('dob') ? new Date(formData.get('dob') as string) : null,
    }
  });

  // 2. Loop Through Vehicles (Update or Create)
  for (let i = 0; i < vehicleCount; i++) {
    const vId = formData.get(`vehicleId_${i}`) as string;
    const name = formData.get(`vehicleName_${i}`) as string;
    const year = formData.get(`vehicleYear_${i}`) as string;
    const plate = formData.get(`vehiclePlate_${i}`) as string;

    if (name && plate) {
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
            plateNumber: plate
          }
        });
        // Auto-create a Job ticket for the new vehicle
        await prisma.job.create({
          data: { vehicleId: newVehicle.id, status: 'NEW_LEAD' }
        });
      }
    }
  }

  revalidatePath(`/dashboard/clients/${clientId}`);
  revalidatePath('/dashboard/clients');
  revalidatePath('/dashboard/leads');
  
  redirect('/dashboard/clients');
}