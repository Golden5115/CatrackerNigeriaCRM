export const API_BASE_URL = 'https://app.cartracker.com.ng/api';

export interface TrackingDevice {
  id: number;
  imei: string;
  name: string;
  online: string; // usually "online" or "offline" or "ack" etc
  time: string; // last connect timestamp e.g. "2026-07-15 12:00:00"
  expiration_date: string; // e.g. "2026-07-15 12:00:00"
  // ... other fields
}

export async function authenticateTrackingApi(): Promise<string> {
  const EMAIL = process.env.TRACKING_SERVER_EMAIL;
  const PASSWORD = process.env.TRACKING_SERVER_PASSWORD;

  if (!EMAIL || !PASSWORD) {
    throw new Error('Missing TRACKING_SERVER_EMAIL or TRACKING_SERVER_PASSWORD in .env');
  }

  const formData = new URLSearchParams();
  formData.append('email', EMAIL);
  formData.append('password', PASSWORD);

  const response = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });

  const data = await response.json();
  if (data.status === 1 && data.user_api_hash) {
    return data.user_api_hash;
  } else {
    throw new Error(`Authentication failed: ${JSON.stringify(data)}`);
  }
}

export async function fetchAllTrackingDevices(apiHash: string): Promise<TrackingDevice[]> {
  let devices: TrackingDevice[] = [];
  let page = 1;
  let lastPage = 1;

  do {
    const response = await fetch(`${API_BASE_URL}/admin/devices?user_api_hash=${apiHash}&limit=500&page=${page}`);
    const data = await response.json();
    
    if (data.data && Array.isArray(data.data)) {
      devices = devices.concat(data.data);
    }
    
    if (data.pagination) {
      lastPage = data.pagination.last_page;
    } else {
      break; // No pagination object found
    }
    page++;
  } while (page <= lastPage);

  return devices;
}
