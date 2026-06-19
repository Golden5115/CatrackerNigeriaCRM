'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// Helper for parsing phones
function normalizePhone(raw: string): string {
  if (!raw) return ''
  let digits = raw.replace(/\D/g, '')
  if (digits.startsWith('234') && digits.length > 10) {
    digits = '0' + digits.substring(3)
  }
  return digits
}

// Helper for parsing extra vehicles "Make (Year); Make (Year)"
function parseExtraVehicles(vehiclesStr: string): { name: string; year: string }[] {
  if (!vehiclesStr || !vehiclesStr.trim()) return []

  return vehiclesStr
    .split(';')
    .map(v => v.trim())
    .filter(Boolean)
    .map(v => {
      const match = v.match(/^(.+?)\s*\((\d{4})\)\s*$/)
      if (match) return { name: match[1].trim(), year: match[2] }
      return { name: v, year: '' }
    })
}

export async function approveLead(id: string) {
  const pendingLead = await prisma.pendingLead.findUnique({
    where: { id },
  })

  if (!pendingLead || pendingLead.status !== 'PENDING') {
    throw new Error('Lead not found or already processed.')
  }

  const payload: any = pendingLead.payload
  
  // Field mapping (Supports standard WordPress form names)
  const fullName = payload.fullName || payload.owner || payload.name || 'Unknown Web Lead'
  const rawPhone = payload.phoneNumber || payload.phone || ''
  const email = payload.email || null
  const address = payload.address || null
  const state = payload.state || null
  const whatsapp = payload.whatsapp || null
  const remarks = payload.remarks || payload.notes || payload.message || null
  
  const car = payload.vehicleName || payload.car || null
  const year = payload.vehicleYear || payload.year || null
  const extraVehiclesStr = payload.extraVehicles || payload.vehicles || ''
  
  const proxy = payload.proxy || 'No'
  const p_name = payload.p_name || payload.proxyName || ''
  const p_phone = payload.p_phone || payload.proxyPhone || ''
  const p_address = payload.p_address || payload.proxyAddress || ''

  const normalizedPhone = normalizePhone(rawPhone)
  if (!normalizedPhone) {
    throw new Error('A valid phone number is required to process this lead.')
  }

  let onsiteContact = ''
  if ((proxy === 'Yes' || proxy === 'true' || proxy === true) && (p_name || p_phone || p_address)) {
    onsiteContact = [p_name, p_phone, p_address].filter(Boolean).join(' / ')
  }

  await prisma.$transaction(async (tx) => {
    // 1. Client Creation/Update
    let client = await tx.client.findFirst({
      where: { phoneNumber: normalizedPhone },
    })

    if (client) {
      client = await tx.client.update({
        where: { id: client.id },
        data: {
          whatsapp: whatsapp || client.whatsapp,
          state: state || client.state,
          address: address || client.address,
          email: email || client.email,
          notes: remarks ? (client.notes ? `${client.notes}\n---\nWebhook: ${remarks}` : remarks) : client.notes,
        },
      })
    } else {
      client = await tx.client.create({
        data: {
          fullName,
          phoneNumber: normalizedPhone,
          whatsapp,
          state,
          address,
          email,
          notes: remarks,
          leadSource: 'Webhook Form',
        },
      })
    }

    // 2. Primary Vehicle + Job
    if (car) {
      const vehicle = await tx.vehicle.create({
        data: {
          clientId: client.id,
          name: car,
          year: year ? String(year) : null,
        },
      })

      await tx.job.create({
        data: {
          vehicleId: vehicle.id,
          status: 'NEW_LEAD',
          jobType: 'NEW_INSTALL',
          onsiteContact: onsiteContact || null,
        },
      })
    } else if (!car && !extraVehiclesStr) {
        // If no car was specified at all, still create a dummy vehicle so they show up in the pipeline
        const vehicle = await tx.vehicle.create({
            data: {
              clientId: client.id,
              name: "Pending Vehicle Info",
            },
          })
    
          await tx.job.create({
            data: {
              vehicleId: vehicle.id,
              status: 'NEW_LEAD',
              jobType: 'NEW_INSTALL',
              onsiteContact: onsiteContact || null,
            },
          })
    }

    // 3. Extra Vehicles
    if (extraVehiclesStr) {
      const extras = parseExtraVehicles(extraVehiclesStr)
      for (const extra of extras) {
        const extraVehicle = await tx.vehicle.create({
          data: {
            clientId: client.id,
            name: extra.name,
            year: extra.year || null,
          },
        })

        await tx.job.create({
          data: {
            vehicleId: extraVehicle.id,
            status: 'NEW_LEAD',
            jobType: 'NEW_INSTALL',
            onsiteContact: onsiteContact || null,
          },
        })
      }
    }

    // 4. Mark Pending Lead as Approved
    await tx.pendingLead.update({
      where: { id },
      data: { status: 'APPROVED' },
    })
  })

  revalidatePath('/dashboard/leads/inbox')
  revalidatePath('/dashboard/leads')
}

export async function rejectLead(id: string) {
  await prisma.pendingLead.update({
    where: { id },
    data: { status: 'REJECTED' },
  })
  revalidatePath('/dashboard/leads/inbox')
}

export async function deletePendingLead(id: string) {
  await prisma.pendingLead.delete({
    where: { id },
  })
  revalidatePath('/dashboard/leads/inbox')
}
