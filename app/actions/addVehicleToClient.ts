'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function addVehicleToClient(formData: FormData) {
  const clientId = formData.get('clientId') as string
  const vehicleName = formData.get('vehicleName') as string
  const year = formData.get('year') as string
  const plate = formData.get('plate') as string

  if (!clientId || !vehicleName) {
    throw new Error("Missing required data")
  }

  // 1. Create Vehicle linked to EXISTING Client
  const newVehicle = await prisma.vehicle.create({
    data: {
      clientId: clientId,
      name: vehicleName, 
      year: year || null, 
      plateNumber: plate || null,
    }
  })

  // 2. Start a Job Ticket for the new vehicle
  await prisma.job.create({
    data: {
      vehicleId: newVehicle.id,
      status: 'NEW_LEAD'
    }
  })

  // 3. Refresh Pipeline & Client DB, then send user to Pipeline!
  revalidatePath(`/dashboard/clients/${clientId}`)
  revalidatePath('/dashboard/leads')
  
  // Redirect back to the Pipeline so they can dispatch it immediately
  redirect('/dashboard/leads')
}