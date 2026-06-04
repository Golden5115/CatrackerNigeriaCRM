'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function addVehicleToClient(formData: FormData) {
  const clientId = formData.get('clientId') as string
  const vehiclesJson = formData.get('vehiclesData') as string

  if (!clientId || !vehiclesJson) {
    throw new Error("Missing required data")
  }

  // Parse the array of vehicles from the frontend
  const vehicles = JSON.parse(vehiclesJson)

  // Run everything inside a transaction to ensure all or nothing is saved
  await prisma.$transaction(async (tx) => {
    
    // Promise.all runs all the insertions concurrently, making it lightning-fast
    await Promise.all(vehicles.map(async (v: any) => {
      if (!v.name) return; // Skip any empty rows
      
      const newVehicle = await tx.vehicle.create({
        data: {
          clientId: clientId,
          name: v.name, 
          year: v.year || null, 
          plateNumber: v.plateNumber || null,
        }
      })

      await tx.job.create({
        data: {
          vehicleId: newVehicle.id,
          status: 'NEW_LEAD',
          jobType: 'NEW_INSTALL' 
        }
      })
    }))

  }, {
    maxWait: 5000, 
    timeout: 10000 // 🟢 FIXED: Lowered to 10 seconds to strictly obey Prisma Accelerate's 15000ms limit!
  })

  // Refresh data and send user back to the pipeline
  revalidatePath(`/dashboard/clients/${clientId}`)
  revalidatePath('/dashboard/leads')
  redirect('/dashboard/leads')
}