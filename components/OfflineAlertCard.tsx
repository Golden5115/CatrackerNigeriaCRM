'use client';

import { useState, useEffect } from 'react';
import { WifiOff, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function OfflineAlertCard() {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOffline = async () => {
      try {
        const res = await fetch('/api/tracking/offline');
        if (res.ok) {
          const data = await res.json();
          setCount(data.vehicles?.length || 0);
        }
      } catch (e) {
        // silently fail for the card
      } finally {
        setLoading(false);
      }
    };
    fetchOffline();
  }, []);

  return (
    <Link href="/dashboard/psf/offline" className="bg-white rounded-3xl p-5 shadow-sm border border-red-100 flex items-center gap-4 transition hover:shadow-md hover:border-red-200">
      <div className="bg-red-50 p-4 rounded-2xl text-red-500"><WifiOff size={20} /></div>
      <div>
        <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Offline &gt; 14 Days</p>
        <div className="flex items-center gap-2 mt-0.5">
          {loading ? (
            <Loader2 size={24} className="animate-spin text-gray-400" />
          ) : (
            <>
              <p className="text-2xl font-black text-red-600">{count}</p>
              {count !== null && count > 0 && <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">ACTION</span>}
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
