import { PrismaClient } from "@prisma/client";
import Link from "next/link";
import { Smartphone, CheckCircle, Clock, Car, ArrowRight } from "lucide-react";

const prisma = new PrismaClient();

export default async function ActivationPage() {
  // Fetch jobs that are CONFIGURED but not yet Onboarded
  const jobs = await prisma.job.findMany({
    where: { 
      status: 'CONFIGURED',
      onboarded: false 
    },
    include: {
      vehicle: { include: { client: true } },
      device: true
    }
  });

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Activation & Onboarding</h2>
        <p className="text-gray-500">Create tracking accounts and send login details to clients.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {jobs.map((job) => (
          <div key={job.id} className="bg-white border rounded-xl p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between">
            
            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-xl text-gray-900">{job.vehicle.client.fullName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                     <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded font-bold">
                       Ready for Login
                     </span>
                     <span className="text-xs text-gray-400">
                       {job.vehicle.client.phoneNumber}
                     </span>
                  </div>
                </div>
                <div className="bg-blue-50 p-3 rounded-full text-blue-600">
                  <Smartphone size={24} />
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg space-y-2 mb-6 border border-gray-100">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Vehicle:</span>
                  <span className="font-medium">{job.vehicle.name} {job.vehicle.year}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Plate Number:</span>
                  <span className="font-mono font-bold">{job.vehicle.plateNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">IMEI:</span>
                  <span className="font-mono text-gray-700">{job.device?.imei || "N/A"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Sim Number:</span>
                  <span className="font-mono text-gray-700">{job.device?.simNumber || "N/A"}</span>
                </div>
              </div>
            </div>

            <Link 
              href={`/dashboard/activation/${job.id}`}
              className="w-full bg-black text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition"
            >
              Generate Login <ArrowRight size={18} />
            </Link>

          </div>
        ))}

        {jobs.length === 0 && (
          <div className="col-span-full py-16 text-center bg-gray-50 border border-dashed rounded-xl">
             <CheckCircle className="mx-auto h-12 w-12 text-gray-300 mb-3" />
             <h3 className="text-lg font-medium text-gray-900">All caught up!</h3>
             <p className="text-gray-500">No pending activations.</p>
          </div>
        )}
      </div>
    </div>
  );
}