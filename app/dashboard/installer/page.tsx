import { PrismaClient } from "@prisma/client";
import Link from "next/link";
import { MapPin, User, Car } from "lucide-react";

const prisma = new PrismaClient();

export default async function InstallerJobList() {
  // Fetch ALL jobs that are waiting for installation (NEW_LEAD)
  const jobs = await prisma.job.findMany({
    where: { status: 'NEW_LEAD' },
    include: {
      vehicle: { include: { client: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="max-w-md mx-auto pb-20">
      <div className="bg-blue-600 p-6 text-white mb-4 rounded-b-xl shadow-md">
        <h1 className="text-2xl font-bold">Field Jobs</h1>
        <p className="opacity-80">Select a client to start installation</p>
      </div>

      <div className="px-4 space-y-4">
        {jobs.map((job) => (
          <Link 
            href={`/dashboard/installer/submit/${job.id}`} 
            key={job.id}
            className="block bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:border-blue-500 transition"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-lg text-gray-800">
                {job.vehicle.make} {job.vehicle.model}
              </h3>
              <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full font-bold">
                PENDING
              </span>
            </div>
            
            <div className="space-y-2 text-gray-600 text-sm">
              <div className="flex items-center gap-2">
                <Car size={16} className="text-blue-500"/>
                {job.vehicle.plateNumber}
              </div>
              <div className="flex items-center gap-2">
                <User size={16} className="text-blue-500"/>
                {job.vehicle.client.fullName}
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-blue-500"/>
                {job.vehicle.client.address}
              </div>
            </div>
          </Link>
        ))}

        {jobs.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No pending jobs found. Good work!
          </div>
        )}
      </div>
    </div>
  );
}