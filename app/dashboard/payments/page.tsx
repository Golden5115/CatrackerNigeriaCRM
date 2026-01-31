import { prisma } from "@/lib/prisma"
import { Phone, CheckCircle, AlertCircle } from "lucide-react";
import { markPaymentAsDone } from "@/app/actions/markPayment";
import SubmitButton from "@/components/SubmitButton";

export const dynamic = 'force-dynamic';

export default async function PaymentsPage() {
  const jobs = await prisma.job.findMany({
    where: { 
      paymentStatus: { not: 'PAID' },
      status: { in: ['INSTALLED', 'CONFIGURED', 'ACTIVE'] }
    },
    include: {
      vehicle: { include: { client: true } }
    },
    orderBy: { updatedAt: 'desc' }
  });

  return (
    <div>
      <div className="flex justify-between items-end mb-8">
        <div>
           <h2 className="text-3xl font-bold text-gray-800">Payment Collections</h2>
           <p className="text-gray-500">Track outstanding balances and record receipts.</p>
        </div>
        <div className="bg-orange-100 text-orange-800 px-4 py-2 rounded-lg font-bold text-sm">
          {jobs.length} Pending Payments
        </div>
      </div>

      <div className="grid gap-4">
        {jobs.map((job) => (
          <div key={job.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
            
            {/* Client Details */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-gray-900">{job.vehicle.client.fullName}</h3>
                {job.status === 'ACTIVE' && (
                   <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">Service Active</span>
                )}
              </div>
              
              <p className="text-gray-600 text-sm mb-2">{job.vehicle.name} {job.vehicle.year} ({job.vehicle.plateNumber})</p>
              
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1 hover:text-blue-600 cursor-pointer">
                  <Phone size={14} /> {job.vehicle.client.phoneNumber}
                </span>
                <span className="flex items-center gap-1 text-red-500 font-medium">
                  <AlertCircle size={14} /> Payment Due
                </span>
              </div>
            </div>

            {/* Action Section */}
            <div className="flex items-center gap-4">
              <div className="text-right mr-4 hidden md:block">
                <span className="block text-xs text-gray-400 uppercase">Service Status</span>
                <span className="font-medium text-gray-700">{job.status}</span>
              </div>

              <form action={markPaymentAsDone} className="flex items-end gap-2">
                <input type="hidden" name="jobId" value={job.id} />
                
                <div>
                  <label className="text-[10px] text-gray-500 uppercase font-bold block">Amount (₦)</label>
                  <input 
                    name="amount" 
                    type="number" 
                    required 
                    placeholder="0.00" 
                    className="w-24 px-2 py-1 text-sm border rounded"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-gray-500 uppercase font-bold block">Collector</label>
                  <input 
                    name="collector" 
                    required 
                    placeholder="Name" 
                    className="w-24 px-2 py-1 text-sm border rounded"
                  />
                </div>

                <SubmitButton 
                  className="bg-green-600 text-white px-3 py-1.5 rounded text-xs font-bold h-fit mb-[1px]"
                  loadingText="..."
                >
                  Confirm
                </SubmitButton>
              </form>
            </div>

          </div>
        ))}

        {jobs.length === 0 && (
          <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed">
            <CheckCircle size={48} className="text-gray-300 mb-4 mx-auto" />
            <p className="text-gray-500 font-medium">No outstanding payments.</p>
            <p className="text-sm text-gray-400">Great job collecting revenue!</p>
          </div>
        )}
      </div>
    </div>
  );
}