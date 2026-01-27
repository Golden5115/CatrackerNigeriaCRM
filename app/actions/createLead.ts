'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { verifySession } from '@/lib/session'
import { cookies } from 'next/headers'



export async function createLead(formData: FormData) {
  const cookie = (await cookies()).get('session')?.value
  const session = await verifySession(cookie)

  if (!session?.userId) throw new Error("Unauthorized")

  // Client Data
  const fullName = formData.get('fullName') as string
  const phoneNumber = formData.get('phoneNumber') as string
  const email = formData.get('email') as string
  const dobRaw = formData.get('dob') as string
  const dob = dobRaw ? new Date(dobRaw) : null
  
  // Dynamic Vehicle Data
  const vehicleCount = parseInt(formData.get('vehicleCount') as string || '1');

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Create Client
      const newClient = await tx.client.create({
        data: {
          fullName,
          phoneNumber,
          email: email || null,
          address: formData.get('address') as string || null,
          state: formData.get('state') as string || null,
          leadSource: formData.get('leadSource') as string || null,
          dob,
          createdById: session.userId as string,
        }
      })

      // 2. Loop through vehicles
      for (let i = 0; i < vehicleCount; i++) {
        const name = formData.get(`vehicleName_${i}`) as string
        const year = formData.get(`vehicleYear_${i}`) as string
        const plate = formData.get(`vehiclePlate_${i}`) as string

        if (name && plate) {
          const newVehicle = await tx.vehicle.create({
            data: {
              clientId: newClient.id,
              name: name,   // "Toyota Camry"
              year: year || "Unknown",
              plateNumber: plate,
            }
          })

          await tx.job.create({
            data: {
              vehicleId: newVehicle.id,
              status: 'NEW_LEAD'
            }
          })
        }
      }
    })
  } catch (error: any) {
    if (error.code === 'P2002') {
       if (error.meta?.target.includes('phoneNumber')) redirect('/dashboard/leads/create?error=phone_taken')
       if (error.meta?.target.includes('email')) redirect('/dashboard/leads/create?error=email_taken')
    }
    throw error
  }

  revalidatePath('/dashboard/leads')
  redirect('/dashboard/leads')
}