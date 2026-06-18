import { prisma } from './prisma'

// ─── Types ──────────────────────────────────────────────────────────
interface CtnLead {
  id: number
  received: string
  owner: string
  phone: string
  whatsapp: string
  car: string
  year: string
  state: string
  address: string
  vehicles: string
  remarks: string
  proxy: string
  p_name: string
  p_phone: string
  p_address: string
}

interface CtnFeedResponse {
  count: number
  leads: CtnLead[]
}

interface SyncResult {
  success: boolean
  imported: number
  skipped: number
  errors: string[]
  lastId: number
}

// ─── Helpers ────────────────────────────────────────────────────────

/**
 * Normalize a Nigerian phone number to the `0XXXXXXXXXX` format
 * used by the CRM's unique constraint.
 */
function normalizePhone(raw: string): string {
  if (!raw) return ''
  let digits = raw.replace(/\D/g, '')
  // +234 or 234 prefix → 0
  if (digits.startsWith('234') && digits.length > 10) {
    digits = '0' + digits.substring(3)
  }
  return digits
}

/**
 * Parse the `vehicles` field from the CTN feed.
 * Format: "Make (Year); Make (Year)"
 * Returns an array of { name, year } objects.
 */
function parseExtraVehicles(vehiclesStr: string): { name: string; year: string }[] {
  if (!vehiclesStr || !vehiclesStr.trim()) return []

  return vehiclesStr
    .split(';')
    .map(v => v.trim())
    .filter(Boolean)
    .map(v => {
      // Match "make (year)" pattern
      const match = v.match(/^(.+?)\s*\((\d{4})\)\s*$/)
      if (match) {
        return { name: match[1].trim(), year: match[2] }
      }
      // No year in parens — treat the whole string as the name
      return { name: v, year: '' }
    })
}

// ─── Main Sync Function ─────────────────────────────────────────────

export async function syncCtnLeads(): Promise<SyncResult> {
  const feedUrl = process.env.CTN_FEED_URL
  if (!feedUrl) {
    return { success: false, imported: 0, skipped: 0, errors: ['CTN_FEED_URL not configured'], lastId: 0 }
  }

  // 1. Read the current cursor
  let meta = await prisma.ctnSyncMeta.findUnique({ where: { id: 'singleton' } })
  if (!meta) {
    meta = await prisma.ctnSyncMeta.create({ data: { id: 'singleton', lastId: 0 } })
  }

  const lastId = meta.lastId

  // 2. Fetch the feed
  const url = `${feedUrl}&format=json&since=${lastId}`
  let data: CtnFeedResponse

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'CRM-CTN-Sync/1.0' },
      cache: 'no-store',
    })
    if (!res.ok) {
      const errorMsg = `CTN feed returned HTTP ${res.status}`
      await prisma.ctnSyncMeta.update({
        where: { id: 'singleton' },
        data: { lastRunAt: new Date(), lastError: errorMsg },
      })
      return { success: false, imported: 0, skipped: 0, errors: [errorMsg], lastId }
    }
    data = await res.json()
  } catch (err: any) {
    const errorMsg = `CTN feed fetch failed: ${err.message}`
    await prisma.ctnSyncMeta.update({
      where: { id: 'singleton' },
      data: { lastRunAt: new Date(), lastError: errorMsg },
    })
    return { success: false, imported: 0, skipped: 0, errors: [errorMsg], lastId }
  }

  const leads = data.leads || []
  if (leads.length === 0) {
    await prisma.ctnSyncMeta.update({
      where: { id: 'singleton' },
      data: { lastRunAt: new Date(), lastCount: 0, lastError: null },
    })
    return { success: true, imported: 0, skipped: 0, errors: [], lastId }
  }

  // 3. Filter out spam double-clicks (identical lead within 5 minutes)
  const sortedLeads = [...leads].reverse() // Oldest first
  const uniqueLeads: CtnLead[] = []

  for (const current of sortedLeads) {
    const isDuplicate = uniqueLeads.some(prev => {
      // Must match phone and exact car combinations
      if (prev.phone !== current.phone || prev.car !== current.car || prev.vehicles !== current.vehicles) {
        return false
      }
      // Check if submitted within 5 minutes of each other
      const timeDiff = Math.abs(new Date(current.received).getTime() - new Date(prev.received).getTime())
      return timeDiff < 5 * 60 * 1000 // 5 minutes in milliseconds
    })

    if (!isDuplicate) {
      uniqueLeads.push(current)
    }
  }

  // 4. Process the filtered leads
  let imported = 0
  let skipped = 0
  let maxId = lastId
  const errors: string[] = []

  for (const lead of uniqueLeads) {
    try {
      await processOneLead(lead)
      imported++
    } catch (err: any) {
      // Log the error but continue processing other leads
      errors.push(`Lead ${lead.id} (${lead.owner}): ${err.message}`)
      skipped++
    }
    if (lead.id > maxId) maxId = lead.id
  }

  // 4. Update the cursor
  await prisma.ctnSyncMeta.update({
    where: { id: 'singleton' },
    data: {
      lastId: maxId,
      lastRunAt: new Date(),
      lastCount: imported,
      lastError: errors.length > 0 ? errors.join('; ') : null,
    },
  })

  return { success: true, imported, skipped, errors, lastId: maxId }
}

// ─── Process a Single Lead ──────────────────────────────────────────

async function processOneLead(lead: CtnLead) {
  const normalizedPhone = normalizePhone(lead.phone)

  if (!normalizedPhone) {
    throw new Error('No phone number provided')
  }

  // Build on-site contact string
  let onsiteContact = ''
  if (lead.proxy === 'Yes' && (lead.p_name || lead.p_phone || lead.p_address)) {
    onsiteContact = [lead.p_name, lead.p_phone, lead.p_address]
      .filter(Boolean)
      .join(' / ')
  }

  // Use a transaction to ensure atomicity
  await prisma.$transaction(async (tx) => {
    // ── Step 1: Upsert the Client ─────────────────────────
    // Strategy:
    //   1. If a client with this ctnLeadId exists → update it
    //   2. If a client with this phone exists → link the ctnLeadId
    //   3. Otherwise → create a new client

    let client = await tx.client.findUnique({ where: { ctnLeadId: lead.id } })

    if (client) {
      // Already imported this exact lead — update fields
      client = await tx.client.update({
        where: { id: client.id },
        data: {
          fullName: lead.owner || client.fullName,
          phoneNumber: normalizedPhone,
          whatsapp: lead.whatsapp || null,
          state: lead.state || client.state,
          address: lead.address || client.address,
          notes: lead.remarks || client.notes,
        },
      })
      return // Already processed — skip vehicle/job creation
    }

    // Check if phone already exists
    const existingByPhone = await tx.client.findFirst({
      where: { phoneNumber: normalizedPhone },
    })

    if (existingByPhone) {
      // Link existing client to this CTN lead
      client = await tx.client.update({
        where: { id: existingByPhone.id },
        data: {
          ctnLeadId: lead.id,
          whatsapp: lead.whatsapp || existingByPhone.whatsapp,
          state: lead.state || existingByPhone.state,
          address: lead.address || existingByPhone.address,
          notes: lead.remarks
            ? (existingByPhone.notes ? `${existingByPhone.notes}\n---\nCTN: ${lead.remarks}` : lead.remarks)
            : existingByPhone.notes,
        },
      })
    } else {
      // Create new client
      client = await tx.client.create({
        data: {
          fullName: lead.owner || 'Unknown',
          phoneNumber: normalizedPhone,
          whatsapp: lead.whatsapp || null,
          state: lead.state || null,
          address: lead.address || null,
          notes: lead.remarks || null,
          leadSource: 'CTN Website',
          ctnLeadId: lead.id,
        },
      })
    }

    // ── Step 2: Create the primary vehicle + job ───────────
    if (lead.car) {
      const vehicle = await tx.vehicle.create({
        data: {
          clientId: client.id,
          name: lead.car,
          year: lead.year || null,
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

    // ── Step 3: Parse and create extra vehicles ───────────
    const extras = parseExtraVehicles(lead.vehicles)
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
  })
}
