import { NextResponse } from 'next/server'
import { syncCtnLeads } from '@/lib/ctnSync'

/**
 * GET /api/ctn-sync
 *
 * Triggers the CTN lead feed sync. Protected by:
 *  1. Vercel Cron's CRON_SECRET (sent as `Authorization: Bearer <secret>`)
 *  2. Or a custom `x-ctn-secret` header for manual triggers
 *
 * This route is NEVER called from the browser — only from cron or server actions.
 */
export async function GET(req: Request) {
  // ── Auth: Verify the request is from Vercel Cron or an authorized caller ──
  const authHeader = req.headers.get('authorization')
  const ctnSecret = req.headers.get('x-ctn-secret')

  const cronSecret = process.env.CRON_SECRET
  const syncSecret = process.env.CTN_SYNC_SECRET

  const isVercelCron = cronSecret && authHeader === `Bearer ${cronSecret}`
  const isManualTrigger = syncSecret && ctnSecret === syncSecret

  if (!isVercelCron && !isManualTrigger) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Run the sync ──
  try {
    const result = await syncCtnLeads()
    return NextResponse.json(result, { status: result.success ? 200 : 500 })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message, success: false },
      { status: 500 }
    )
  }
}
