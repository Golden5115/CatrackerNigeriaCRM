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

    const vehicles = await prisma.vehicle.findMany({
      where: { isArchived: false, client: { isArchived: false } },
      include: {
        client: true,
        jobs: {
          include: {
            device: true,
            simCard: true
          },
          orderBy: {
            installDate: 'desc'
          },
          take: 1
        }
      },
      orderBy: { id: 'desc' }
    });

    // Define CSV headers
    const headers = [
      'Vehicle ID',
      'Vehicle Name',
      'Year',
      'Plate Number',
      'IMEI',
      'Tracker SIM',
      'Client Name',
      'Client Phone',
      'Client Lead Source'
    ];

    // Helper to escape CSV strings
    const escapeCsv = (str: string | null | undefined) => {
      if (!str) return '""';
      const escaped = String(str).replace(/"/g, '""');
      return `"${escaped}"`;
    };

    // Format rows
    const rows = vehicles.map(vehicle => {
      const imei = vehicle.jobs[0]?.device?.imei || vehicle.jobs[0]?.deviceId || '';
      const trackerSim = vehicle.jobs[0]?.simCard?.simNumber || vehicle.jobs[0]?.simCardId || '';
      
      return [
        escapeCsv(vehicle.id),
        escapeCsv(vehicle.name),
        escapeCsv(vehicle.year),
        escapeCsv(vehicle.plateNumber),
        escapeCsv(imei),
        escapeCsv(trackerSim),
        escapeCsv(vehicle.client?.fullName),
        escapeCsv(vehicle.client?.phoneNumber),
        escapeCsv(vehicle.client?.leadSource)
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="vehicles_export.csv"'
      }
    });

  } catch (error) {
    console.error("[VEHICLES_EXPORT_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
