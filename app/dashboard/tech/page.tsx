import { prisma } from "@/lib/prisma"
import { Server, Car, ArrowRight } from "lucide-react";
import LoadingLink from "@/components/LoadingLink";

export const dynamic = 'force-dynamic';

export default async function TechSupportPage() {
  // Fetch jobs waiting for Tech Configuration (Status: INSTALLED)
  const jobs = await prisma.job.findMany({
    where: { status: 'INSTALLED' },
    include: {
      vehicle: { include: { client: true } }
    }
  });

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Tech Support Queue</h2>
        <p className="text-gray-500">Configure devices for installed vehicles.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs.map((job) => (
          <div key={job.id} className="bg-white border border-l-4 border-l-[#84c47c] rounded-xl p-6 shadow-sm hover:shadow-md transition">
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg text-gray-900">{job.vehicle.client.fullName}</h3>
                <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Waiting for Config</span>
              </div>
              <div className="bg-green-50 p-2 rounded-lg text-[#84c47c]">
                <Server size={20} />
              </div>
            </div>

            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Car size={16} />
                {job.vehicle.name} {job.vehicle.year}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 font-mono bg-gray-50 px-2 py-1 rounded w-fit">
                {job.vehicle.plateNumber}
              </div>
            </div>

            <LoadingLink 
              href={`/dashboard/tech/${job.id}`}
              className="w-full flex items-center justify-center gap-2 bg-[#84c47c] text-white py-2 rounded-lg font-bold hover:bg-[#6aa663] transition"
            >
              Start Configuration <ArrowRight size={16} />
            </LoadingLink>

          </div>
        ))}

        {jobs.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-400 bg-gray-50 rounded-xl border border-dashed">
            No installations pending configuration.
          </div>
        )}
      </div>
    </div>
  );
}