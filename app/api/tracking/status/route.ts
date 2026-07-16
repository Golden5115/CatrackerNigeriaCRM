import { NextRequest, NextResponse } from 'next/server';
import { authenticateTrackingApi, API_BASE_URL } from '@/lib/tracking';

export async function GET(req: NextRequest) {
  try {
    const imei = req.nextUrl.searchParams.get('imei');
    if (!imei) {
      return NextResponse.json({ error: 'IMEI is required' }, { status: 400 });
    }

    const apiHash = await authenticateTrackingApi();
    
    // Using the search endpoint to find the specific device
    const response = await fetch(`${API_BASE_URL}/admin/devices?user_api_hash=${apiHash}&s=${imei}&limit=1`);
    const data = await response.json();
    
    if (data.data && Array.isArray(data.data) && data.data.length > 0) {
      const device = data.data[0];
      // verify it's the exact match
      if (String(device.imei).trim() === imei) {
        return NextResponse.json({
          imei: device.imei,
          online: device.online,
          time: device.time,
          expiration_date: device.expiration_date
        });
      }
    }

    return NextResponse.json({ error: 'Device not found on tracking server' }, { status: 404 });
  } catch (error: any) {
    console.error('Error fetching device status:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
