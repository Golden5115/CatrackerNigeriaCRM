'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// --- DELETE CLIENT ---
export async function deleteClient(clientId: string) {
  const vehicles = await prisma.vehicle.findMany({ where: { clientId } });
  const vehicleIds = vehicles.map(v => v.id);

  await prisma.job.deleteMany({ where: { vehicleId: { in: vehicleIds } } });
  await prisma.vehicle.deleteMany({ where: { clientId } });
  await prisma.client.delete({ where: { id: clientId } });

  revalidatePath('/dashboard/leads')
  revalidatePath('/dashboard/clients')
}

// --- DELETE SINGLE VEHICLE ---
export async function deleteVehicle(vehicleId: string) {
  await prisma.vehicle.delete({ where: { id: vehicleId } });
  revalidatePath('/dashboard/clients/[id]/edit'); 
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