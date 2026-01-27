import { PrismaClient } from "@prisma/client";
import { submitInstallation } from "@/app/actions/submitInstallation";
import { Camera, Save } from "lucide-react";

const prisma = new PrismaClient();

// FIX: Define params as a Promise
export default async function SubmitJobPage({ 
  params 
}: { 
  params: Promise<{ jobId: string }> 
}) {
  // FIX: Await the params before using them
  const { jobId } = await params;

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { vehicle: { include: { client: true } } }
  });

  // Get list of installers for the dropdown
  const installers = await prisma.user.findMany({
    where: { role: 'INSTALLER' }
  });

  if (!job) return <div className="p-8">Job not found.</div>;

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen pb-20">
      {/* Header */}
      <div className="bg-white p-4 border-b sticky top-0 z-10">
        <h2 className="text-lg font-bold text-gray-800">Complete Installation</h2>
        <p className="text-sm text-gray-500">{job.vehicle.client.fullName}</p>
      </div>

      <form action={submitInstallation} className="p-4 space-y-6">
        <input type="hidden" name="jobId" value={job.id} />

      {/* Installer Dropdown Section */}
<div className="bg-white p-4 rounded-xl shadow-sm border">
  <label className="block text-sm font-bold text-gray-700 mb-2">Installer Name</label>
  
  {installers.length === 0 ? (
    <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">
      ⚠️ No Installers found in database. 
      <br/>
      Please run the SQL script to add users with role 'INSTALLER'.
    </div>
  ) : (
    <select name="installerId" required className="w-full p-3 bg-gray-50 border rounded-lg">
      <option value="">Select Installer...</option>
      {installers.map(inst => (
        <option key={inst.id} value={inst.id}>{inst.fullName}</option>
      ))}
    </select>
  )}
</div>

        {/* 2. Device Details */}
        <div className="bg-white p-4 rounded-xl shadow-sm border space-y-4">
          <h3 className="font-semibold text-gray-800 border-b pb-2">Device Details</h3>
          
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tracker IMEI (15 Digits)</label>
            <input name="imei" type="text" placeholder="86543..." required className="w-full p-3 border rounded-lg font-mono text-lg" />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Sim Number</label>
            <input name="sim" type="text" placeholder="080..." required className="w-full p-3 border rounded-lg" />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Device Type</label>
            <select name="deviceType" className="w-full p-3 border rounded-lg bg-white">
              <option value="Relay">Relay Tracker</option>
              <option value="OBD">OBD Tracker</option>
              <option value="Asset">Asset Tracker</option>
            </select>
          </div>
        </div>

        {/* 3. Vehicle Stats */}
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Odometer (Current Mileage)</label>
          <input name="odometer" type="number" placeholder="e.g. 54000" className="w-full p-3 border rounded-lg" />
        </div>

        {/* 4. Photos (Mock button) */}
        <button type="button" className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50">
          <Camera size={24} className="mb-2" />
          <span>Upload Installation Photo</span>
        </button>

        {/* Submit Button */}
        <button type="submit" className="w-full bg-green-600 text-white font-bold py-4 rounded-xl shadow-lg flex justify-center items-center gap-2 hover:bg-green-700">
          <Save size={20} />
          Submit Job
        </button>
      </form>
    </div>
  );
}