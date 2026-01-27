'use server'

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const prisma = new PrismaClient()

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
      make,
      model,
      plateNumber: plate,
    }
  })

  // 2. Start a Job Ticket (Status: NEW_LEAD) so installers can see it
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