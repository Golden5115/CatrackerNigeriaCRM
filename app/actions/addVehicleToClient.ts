'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function addVehicleToClient(formData: FormData) {
  const clientId = formData.get('clientId') as string
  const make = formData.get('make') as string
  const model = formData.get('model') as string
  const plate = formData.get('plate') as string

  if (!clientId || !plate) {
    throw new Error("Missing Data")
  }

  // 1. Create Vehicle linked to EXISTING Client
  const newVehicle = await prisma.vehicle.create({
    data: {
      clientId: clientId,
      // FIX: Combine Make/Model into 'name' and add a default year
      name: `${make} ${model}`.trim(), 
      year: "Unknown", // Default since the simple form doesn't ask for year
      plateNumber: plate,
    }
  })

  // 2. Start a Job Ticket
  await prisma.job.create({
    data: {
      vehicleId: newVehicle.id,
      status: 'NEW_LEAD'
    }
  })

  // 3. Refresh and Redirect
  revalidatePath(`/dashboard/clients/${clientId}`)
  redirect(`/dashboard/clients/${clientId}`)
}