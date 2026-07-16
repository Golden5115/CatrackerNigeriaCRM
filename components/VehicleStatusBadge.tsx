'use client';

import { useState, useEffect } from 'react';
import { RefreshCcw, Wifi, WifiOff } from 'lucide-react';

interface VehicleStatusBadgeProps {
  imei: string;
}

export function VehicleStatusBadge({ imei }: VehicleStatusBadgeProps) {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/tracking/status?imei=${encodeURIComponent(imei)}`);
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      } else {
        setError(true);
      }
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (imei) {
      fetchStatus();
    }
  }, [imei]);

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
        <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
        Checking status...
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
        <span className="w-2 h-2 rounded-full bg-gray-300"></span>
        Unknown Status
        <button onClick={fetchStatus} className="ml-1 hover:text-gray-700">
          <RefreshCcw className="w-3 h-3" />
        </button>
      </div>
    );
  }

  const isOnline = status.online === 'online' || status.online === 'ack';

  return (
    <div className="flex items-center gap-3">
      <div className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${
        isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
      }`}>
        {isOnline ? (
          <>
            <Wifi className="w-3.5 h-3.5" />
            Online
          </>
        ) : (
          <>
            <WifiOff className="w-3.5 h-3.5" />
            Offline
          </>
        )}
      </div>
      {!isOnline && status.time && (
        <span className="text-xs text-gray-500">
          Last seen: {new Date(status.time).toLocaleString()}
        </span>
      )}
    </div>
  );
}
