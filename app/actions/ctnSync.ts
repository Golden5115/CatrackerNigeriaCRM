'use server'

import { syncCtnLeads } from '@/lib/ctnSync'
import { verifySession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

/**
 * Server action to trigger CTN sync manually from the dashboard.
 * Admin-only.
 */
export async function triggerCtnSync() {
  const session = await verifySession()
  const userId = typeof session?.userId === 'string' ? session.userId : null
  if (!userId) return { error: 'Unauthorized' }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (user?.role !== 'ADMIN') return { error: 'Admin access required' }

  try {
    const result = await syncCtnLeads()
    revalidatePath('/dashboard/leads')
    revalidatePath('/dashboard/leads/sync')
    return result
  } catch (err: any) {
    return { success: false, imported: 0, skipped: 0, errors: [err.message], lastId: 0 }
  }
}
