import { submitTechConfiguration } from "@/app/actions/workflow";
import { PrismaClient } from "@prisma/client";
import Link from "next/link";
import { Save, UserCheck, AlertTriangle } from "lucide-react";

const prisma = new PrismaClient();

// Update component to accept searchParams
export default async function TechConfigPage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ jobId: string }>,
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { jobId } = await params;
  const { error } = await searchParams; // <--- Get the error from URL

  // Get Job Details
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { vehicle: { include: { client: true } } }
  });

  if (!job) return <div>Job not found</div>;

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Device Configuration</h2>
        <p className="text-gray-500">
          Configuring <span className="font-bold text-[#84c47c]">{job.vehicle.name} {job.vehicle.year}</span> 
          {' '}for {job.vehicle.client.fullName}
        </p>
      </div>

      {/* 🔴 ERROR ALERT BOX */}
      {error === 'imei_taken' && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex items-start gap-3">
          <AlertTriangle className="text-red-500 shrink-0" />
          <div>
            <h3 className="font-bold text-red-800">Error: Duplicate IMEI</h3>
            <p className="text-sm text-red-700">The IMEI you entered already exists in the database. Please check the number and try again.</p>
          </div>
        </div>
      )}

      {error === 'sim_taken' && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex items-start gap-3">
          <AlertTriangle className="text-red-500 shrink-0" />
          <div>
            <h3 className="font-bold text-red-800">Error: Duplicate Sim</h3>
            <p className="text-sm text-red-700">This Sim Number is already in use.</p>
          </div>
        </div>
      )}

      <form action={submitTechConfiguration} className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 space-y-6">
        <input type="hidden" name="jobId" value={jobId} />

        {/* 1. Device Info */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-900 uppercase border-b pb-2">Tracker Details</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">IMEI Number</label>
            <input 
              name="imei" 
              required 
              placeholder="Enter 15-digit IMEI" 
              className={`input-field ${error === 'imei_taken' ? 'border-red-500 ring-2 ring-red-200' : ''}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sim Number</label>
            <input name="simNumber" required placeholder="Tracker Sim Number" className="input-field" />
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Platform ID (GPS ID)</label>
             <input name="platformId" placeholder="ID shown on Tracking Map" className="input-field" />
          </div>
        </div>

        {/* 2. Job Info */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-900 uppercase border-b pb-2 flex items-center gap-2">
            <UserCheck size={16} /> Job Attribution
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Installer Name</label>
            <input 
              name="installerName" 
              required 
              placeholder="e.g. Emeka (Freelancer)" 
              className="input-field" 
            />
            <p className="text-xs text-gray-500 mt-1">Type the name of the technician who performed the installation.</p>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-6 flex gap-4 border-t">
           <Link href="/dashboard/tech" className="px-6 py-3 border rounded-xl hover:bg-gray-50 text-gray-600 font-medium">
             Cancel
           </Link>
           <button type="submit" className="flex-1 bg-[#84c47c] text-white py-3 rounded-xl font-bold hover:bg-[#6aa663] transition shadow-lg flex justify-center items-center gap-2">
             <Save size={18} />
             Save & Send to Activation
           </button>
        </div>

      </form>
    </div>
  );
}