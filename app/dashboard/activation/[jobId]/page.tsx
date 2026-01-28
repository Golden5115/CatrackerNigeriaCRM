import { activateJob } from "@/app/actions/activateJob";
import { prisma } from "@/lib/prisma"
import Link from "next/link";
import { Send, Copy } from "lucide-react";



export default async function ActivationDetailsPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      vehicle: { include: { client: true } },
      device: true
    }
  });

  if (!job) return <div>Job not found</div>;

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Finalize Activation</h2>
        <p className="text-gray-500">
          Create account for <span className="font-bold">{job.vehicle.client.fullName}</span>
        </p>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 space-y-6">
        
        {/* Helper Data Block */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800 space-y-1">
          <p className="font-bold uppercase text-xs mb-2">Data for Tracking Platform:</p>
          <div className="flex justify-between">
            <span>IMEI:</span> <span className="font-mono font-bold select-all">{job.device?.imei}</span>
          </div>
          <div className="flex justify-between">
            <span>Sim:</span> <span className="font-mono font-bold select-all">{job.device?.simNumber}</span>
          </div>
          <div className="flex justify-between">
             <span>Plate:</span> <span className="font-mono font-bold select-all">{job.vehicle.plateNumber}</span>
          </div>
        </div>

        <form action={activateJob} className="space-y-6">
          <input type="hidden" name="jobId" value={jobId} />

          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Generated Username (Optional)</label>
             <input name="username" placeholder="e.g. client_name01" className="input-field" />
             <p className="text-xs text-gray-500 mt-1">Record the username created on the tracking platform.</p>
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Generated Password (Optional)</label>
             <input name="password" placeholder="e.g. Track2024!" className="input-field" />
          </div>

          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
             <input type="checkbox" required id="confirm" className="mt-1 w-4 h-4 text-green-600 rounded" />
             <label htmlFor="confirm" className="text-sm text-gray-600">
               I confirm that I have created the account on the tracking server and sent the login credentials to the client via SMS/WhatsApp/Email.
             </label>
          </div>

          <div className="pt-2 flex gap-4">
             <Link href="/dashboard/activation" className="px-6 py-3 border rounded-xl hover:bg-gray-50 text-gray-600 font-medium">
               Cancel
             </Link>
             <button type="submit" className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition shadow-lg flex justify-center items-center gap-2">
               <Send size={18} />
               Mark as Active & Sent
             </button>
          </div>
        </form>

      </div>
    </div>
  );
}