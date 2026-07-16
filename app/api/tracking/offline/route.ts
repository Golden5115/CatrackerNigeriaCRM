import { NextResponse } from 'next/server';
import { authenticateTrackingApi, fetchAllTrackingDevices } from '@/lib/tracking';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max duration for this endpoint

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');

    const apiHash = await authenticateTrackingApi();
    const allDevices = await fetchAllTrackingDevices(apiHash);
    
    // Get all our ACTIVE jobs with hardware to map phone numbers/emails
    const dbDevices = await prisma.device.findMany({
      include: {
        job: {
          include: {
            vehicle: {
              include: {
                client: {
                  include: {
                    psfCalls: month ? {
                      where: { month }
                    } : false
                  }
                }
              }
            }
          }
        }
      }
    });

    // Create a map for quick CRM lookup
    const crmMap = new Map();
    for (const d of dbDevices) {
      if (d.imei) {
        crmMap.set(String(d.imei).trim(), d);
      }
    }

    const today = new Date();
    
    // 14 days ago
    const upperThreshold = new Date(today);
    upperThreshold.setDate(today.getDate() - 14);

    // 20 days ago
    const lowerThreshold = new Date(today);
    lowerThreshold.setDate(today.getDate() - 20);

    const offlineVehicles = [];

    for (const trackingDev of allDevices) {
      // If it's explicitly offline, ack, or unknown
      if (trackingDev.online !== 'online') {
        if (trackingDev.time) {
          const lastSeen = new Date(trackingDev.time);
          
          // Check if it's between 14 and 20 days offline
          if (lastSeen <= upperThreshold && lastSeen >= lowerThreshold) {
            const daysOffline = Math.floor((today.getTime() - lastSeen.getTime()) / (1000 * 60 * 60 * 24));
            
            const imei = String(trackingDev.imei).trim();
            const crmData = crmMap.get(imei);
            
            // Only add client phone/email if found in CRM database
            const clientPhone = crmData?.job?.vehicle?.client?.phone1 || crmData?.job?.vehicle?.client?.phoneNumber || null;
            const clientEmail = crmData?.job?.vehicle?.client?.email || null;
            const clientName = crmData?.job?.vehicle?.client?.fullName || 'Not in CRM';
            const clientId = crmData?.job?.vehicle?.client?.id || null;
            const jobId = crmData?.job?.id || null;
            const psfCalls = crmData?.job?.vehicle?.client?.psfCalls || [];
            
            offlineVehicles.push({
              imei: imei,
              jobId,
              clientId,
              clientName,
              vehicleName: trackingDev.name || 'Unknown',
              plateNumber: trackingDev.plate_number || 'N/A',
              simNumber: trackingDev.sim_number || 'N/A',
              expirationDate: trackingDev.expiration_date,
              lastSeen: trackingDev.time,
              daysOffline,
              clientPhone,
              clientEmail,
              inCrm: !!crmData,
              psfCalls
            });
          }
        }
      }
    }

    // Sort by longest offline first
    offlineVehicles.sort((a, b) => b.daysOffline - a.daysOffline);

    return NextResponse.json({ vehicles: offlineVehicles });

  } catch (error: any) {
    console.error('Error fetching offline vehicles:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
