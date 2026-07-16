'use client';

import { useState, useEffect } from 'react';
import { RefreshCcw, WifiOff, Car, Phone, User, Calendar, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import PsfCallClient from '../PsfCallClient';

export default function OfflineTabClient({ 
  selectedMonth,
  statusFilter 
}: { 
  selectedMonth: string,
  statusFilter: string 
}) {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchOfflineVehicles = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/tracking/offline?month=${selectedMonth}`);
      if (res.ok) {
        const data = await res.json();
        setVehicles(data.vehicles || []);
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
    fetchOfflineVehicles();
  }, [selectedMonth]);

  // Apply Status Filter
  const filteredVehicles = vehicles.filter(v => {
    if (statusFilter === 'ALL') return true;
    const callStatus = v.psfCalls?.[0]?.status || 'PENDING';
    return callStatus === statusFilter;
  });

  // Calculate Metrics
  const metrics = {
    total: vehicles.length,
    pending: 0,
    called: 0,
    noAnswer: 0,
    unreachable: 0
  };

  vehicles.forEach(v => {
    const status = v.psfCalls?.[0]?.status || 'PENDING';
    if (status === 'CALLED') metrics.called++;
    else if (status === 'NO_ANSWER') metrics.noAnswer++;
    else if (status === 'UNREACHABLE') metrics.unreachable++;
    else metrics.pending++;
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white border rounded-lg p-3 text-center shadow-sm">
           <div className="text-xs text-gray-500 font-bold uppercase mb-1">Total Offline</div>
           <div className="text-xl font-black text-gray-800">{loading ? '-' : metrics.total}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-3 text-center shadow-sm">
           <div className="text-xs text-gray-500 font-bold uppercase mb-1">Pending</div>
           <div className="text-xl font-black text-gray-600">{loading ? '-' : metrics.pending}</div>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-center shadow-sm">
           <div className="text-xs text-green-600 font-bold uppercase mb-1">Called</div>
           <div className="text-xl font-black text-green-700">{loading ? '-' : metrics.called}</div>
        </div>
        <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 text-center shadow-sm">
           <div className="text-xs text-orange-600 font-bold uppercase mb-1">No Answer</div>
           <div className="text-xl font-black text-orange-700">{loading ? '-' : metrics.noAnswer}</div>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-center shadow-sm">
           <div className="text-xs text-red-600 font-bold uppercase mb-1">Unreachable</div>
           <div className="text-xl font-black text-red-700">{loading ? '-' : metrics.unreachable}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center text-gray-400">
          <RefreshCcw size={32} className="animate-spin text-red-400 mb-4" />
          <p className="font-bold">Scanning fleet for offline vehicles...</p>
          <p className="text-xs mt-2">This may take up to 2 minutes as it queries the tracking server.</p>
        </div>
      ) : error ? (
        <div className="p-16 flex flex-col items-center justify-center text-gray-400">
           <WifiOff size={32} className="text-gray-300 mb-4" />
           <p className="font-bold text-gray-600">Failed to load offline vehicles</p>
           <button onClick={fetchOfflineVehicles} className="mt-4 text-blue-600 font-bold text-sm hover:underline">Try Again</button>
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="p-16 flex flex-col items-center justify-center text-gray-400">
           <Car size={32} className="text-gray-300 mb-4" />
           <p className="font-bold text-gray-600">No matching vehicles found.</p>
           <p className="text-sm">There are no offline vehicles for this criteria.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-500 uppercase whitespace-nowrap">Client</th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-500 uppercase whitespace-nowrap">Vehicle</th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-500 uppercase whitespace-nowrap">Last Online</th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-500 uppercase whitespace-nowrap">Call Status</th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-500 uppercase whitespace-nowrap">Feedback</th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-500 uppercase whitespace-nowrap text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredVehicles.map((v, i) => {
                const callRecord = v.psfCalls?.[0];
                const status = callRecord?.status || 'PENDING';
                
                let statusBadge = "bg-gray-100 text-gray-600";
                if (status === 'CALLED') statusBadge = "bg-green-100 text-green-700 border-green-200";
                if (status === 'NO_ANSWER') statusBadge = "bg-orange-100 text-orange-700 border-orange-200";
                if (status === 'UNREACHABLE') statusBadge = "bg-red-100 text-red-700 border-red-200";

                return (
                  <tr key={i} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      {v.inCrm ? (
                        <>
                          <Link href={`/dashboard/clients/${v.clientId}`} className="font-bold text-sm text-gray-900 hover:text-blue-600 flex items-center gap-1.5">
                            <User size={14}/> {v.clientName}
                          </Link>
                          {v.clientPhone && (
                            <div className="text-xs text-gray-500 flex items-center gap-1 mt-1"><Phone size={12}/> {v.clientPhone}</div>
                          )}
                          {v.clientEmail && (
                            <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">@ {v.clientEmail}</div>
                          )}
                        </>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-sm text-gray-500">Not in CRM</span>
                          <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded w-max">Tracking Server Only</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                       <div className="font-bold text-sm text-gray-900">{v.vehicleName}</div>
                       <div className="text-xs text-gray-500 font-mono mt-1">{v.plateNumber} | IMEI: {v.imei}</div>
                       <div className="text-xs text-blue-500 font-mono mt-1 font-bold">SIM: {v.simNumber}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                        <Calendar size={14} className="text-gray-400" />
                        {new Date(v.lastSeen).toLocaleString()}
                      </div>
                      <div className="mt-1.5">
                        <span className="bg-red-100 text-red-700 font-bold px-3 py-1 rounded-full text-xs">
                          {v.daysOffline} Days Offline
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${statusBadge}`}>
                        {status.replace('_', ' ')}
                      </span>
                      {callRecord?.calledAt && (
                        <div className="text-[10px] text-gray-400 mt-1">
                          {new Date(callRecord.calledAt).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 max-w-xs truncate">
                        {callRecord?.feedback || <span className="text-gray-400 italic">No feedback</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       {v.inCrm ? (
                         <PsfCallClient 
                           client={{ 
                             id: v.clientId, 
                             fullName: v.clientName, 
                             psfCalls: v.psfCalls || [] 
                           }} 
                           currentMonth={selectedMonth} 
                         />
                       ) : (
                         <span className="text-xs text-gray-400 italic">No Profile</span>
                       )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      </div>
    </div>
  );
}
