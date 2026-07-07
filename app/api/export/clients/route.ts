import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await verifySession();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const clients = await prisma.client.findMany({
      where: { isArchived: false },
      orderBy: { createdAt: 'desc' }
    });

    // Define CSV headers
    const headers = [
      'Client ID',
      'Full Name',
      'Phone Number',
      'WhatsApp Number',
      'Email',
      'Address',
      'State',
      'Lead Source',
      'Date Added'
    ];

    // Helper to escape CSV strings
    const escapeCsv = (str: string | null | undefined) => {
      if (!str) return '""';
      const escaped = String(str).replace(/"/g, '""');
      return `"${escaped}"`;
    };

    // Format rows
    const rows = clients.map(client => {
      return [
        escapeCsv(client.id),
        escapeCsv(client.fullName),
        escapeCsv(client.phoneNumber),
        escapeCsv(client.whatsapp),
        escapeCsv(client.email),
        escapeCsv(client.address),
        escapeCsv(client.state),
        escapeCsv(client.leadSource),
        escapeCsv(new Date(client.createdAt).toLocaleDateString())
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="clients_export.csv"'
      }
    });

  } catch (error) {
    console.error("[CLIENTS_EXPORT_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
