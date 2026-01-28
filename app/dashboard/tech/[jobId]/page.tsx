import { submitTechConfiguration } from "@/app/actions/workflow";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Save, UserCheck, AlertTriangle, Mail, Hash, Calendar } from "lucide-react";

export default async function TechConfigPage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ jobId: string }>,
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { jobId } = await params;
  const { error } = await searchParams;

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { vehicle: { include: { client: true } } }
  });

  if (!job) return <div>Job not found</div>;

  // Check what is missing
  const needsEmail = !job.vehicle.client.email;
  const needsPlate = !job.vehicle.plateNumber;
  const needsYear = !job.vehicle.year;

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Device Configuration</h2>
        <p className="text-gray-500">
          Configuring <span className="font-bold text-[#84c47c]">{job.vehicle.name}</span> 
          {' '}for {job.vehicle.client.fullName}
        </p>
      </div>

      {/* ERROR ALERTS (Keep existing ones) */}
      {error === 'imei_taken' && (
         // ... existing error UI ...
         <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
           <h3 className="font-bold text-red-800">Error: Duplicate IMEI</h3>
         </div>
      )}
      {error === 'email_taken' && (
         <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
           <h3 className="font-bold text-red-800">Error: Email Taken</h3>
           <p className="text-sm text-red-700">The email you tried to add is already in use by another client.</p>
         </div>
      )}

      <form action={submitTechConfiguration} className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 space-y-6">
        <input type="hidden" name="jobId" value={jobId} />
        <input type="hidden" name="clientId" value={job.vehicle.client.id} />
        <input type="hidden" name="vehicleId" value={job.vehicle.id} />

        {/* 0. MISSING DATA SECTION (Only shows if data is missing) */}
        {(needsEmail || needsPlate || needsYear) && (
          <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 space-y-4">
             <h3 className="text-sm font-bold text-orange-800 uppercase flex items-center gap-2">
               <AlertTriangle size={16}/> Missing Required Info
             </h3>
             <p className="text-xs text-orange-700">Please complete the client record before finalizing configuration.</p>
             
             {needsEmail && (
               <div>
                 <label className="block text-xs font-bold text-gray-700 mb-1">Client Email (Compulsory)</label>
                 <div className="relative">
                   <Mail className="absolute left-3 top-2.5 text-gray-400" size={16} />
                   <input name="clientEmail" type="email" required placeholder="client@email.com" className="w-full pl-10 p-2 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" />
                 </div>
               </div>
             )}

             <div className="grid grid-cols-2 gap-4">
               {needsPlate && (
                 <div>
                   <label className="block text-xs font-bold text-gray-700 mb-1">Plate Number</label>
                   <div className="relative">
                     <Hash className="absolute left-3 top-2.5 text-gray-400" size={16} />
                     <input name="vehiclePlate" placeholder="ABC-123-XY" className="w-full pl-10 p-2 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" />
                   </div>
                 </div>
               )}
               {needsYear && (
                 <div>
                   <label className="block text-xs font-bold text-gray-700 mb-1">Vehicle Year</label>
                   <div className="relative">
                     <Calendar className="absolute left-3 top-2.5 text-gray-400" size={16} />
                     <input name="vehicleYear" placeholder="2015" className="w-full pl-10 p-2 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" />
                   </div>
                 </div>
               )}
             </div>
          </div>
        )}

        {/* 1. Device Info (Existing inputs) */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-900 uppercase border-b pb-2">Tracker Details</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">IMEI Number</label>
            <input name="imei" required placeholder="Enter 15-digit IMEI" className="input-field w-full p-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sim Number</label>
            <input name="simNumber" required placeholder="Tracker Sim Number" className="input-field w-full p-2 border rounded-lg" />
          </div>
          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Platform ID (GPS ID)</label>
             <input name="platformId" placeholder="ID shown on Tracking Map" className="input-field w-full p-2 border rounded-lg" />
          </div>
        </div>

        {/* 2. Job Info */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-900 uppercase border-b pb-2 flex items-center gap-2">
            <UserCheck size={16} /> Job Attribution
          </h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Installer Name</label>
            <input name="installerName" required placeholder="e.g. Emeka" className="input-field w-full p-2 border rounded-lg" />
          </div>
        </div>

        {/* Actions */}
        <div className="pt-6 flex gap-4 border-t">
           <Link href="/dashboard/tech" className="px-6 py-3 border rounded-xl hover:bg-gray-50 text-gray-600 font-medium">Cancel</Link>
           <button type="submit" className="flex-1 bg-[#84c47c] text-white py-3 rounded-xl font-bold hover:bg-[#6aa663] transition shadow-lg flex justify-center items-center gap-2">
             <Save size={18} />
             Save & Send to Activation
           </button>
        </div>
      </form>
    </div>
  );
}