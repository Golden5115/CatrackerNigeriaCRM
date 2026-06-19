import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const WEBHOOK_TOKEN = 'ctn_wh_9x8k2m5PqV1LzT4'

export async function POST(request: Request) {
  try {
    // 1. Authenticate Request
    const url = new URL(request.url)
    const token = url.searchParams.get('token')

    if (token !== WEBHOOK_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse Payload
    const payload = await request.json()

    if (!payload || typeof payload !== 'object') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // 3. Save directly to PendingLead Staging Area
    const pendingLead = await prisma.pendingLead.create({
      data: {
        payload: payload,
        status: 'PENDING',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Lead received and staged in inbox successfully.',
      id: pendingLead.id,
    }, { status: 201 })

  } catch (error: any) {
    console.error('Webhook Lead Processing Error:', error)
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
  }
}
