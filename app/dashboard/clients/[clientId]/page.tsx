import { prisma } from "@/lib/prisma"
import { verifySession } from "@/lib/session"
import Link from "next/link";
import { 
  ArrowLeft, Car, Smartphone, User, Calendar, CreditCard, 
  MapPin, Edit, AlertCircle
} from "lucide-react";
import AssignJobHardwareModal from "@/components/AssignJobHardwareModal"; // 🟢 FIXED: Using the Smart Link Modal
import { VehicleStatusBadge } from "@/components/VehicleStatusBadge";

export default async function ClientDetailsPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  
  const session = await verifySession();
  const canEdit: boolean = Boolean(session?.canEdit === true || session?.role === 'ADMIN' || session?.role === 'OPERATIONS');

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      vehicles: { include: { jobs: { include: { device: true, simCard: true, installer: true } } } },
      createdBy: true 
    }
  });

  if (!client) return <div className="p-8 text-center text-gray-500">Client not found</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      
      {/* 1. HEADER & CLIENT PROFILE */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div className="flex items-start gap-4">
            <Link href="/dashboard/clients" className="mt-1 p-2 hover:bg-gray-100 rounded-full transition">
              <ArrowLeft size={20} className="text-gray-500" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{client.fullName}</h1>
              <div className="flex items-center gap-3 text-gray-500 mt-1">
                <span className="flex items-center gap-1 text-sm"><Smartphone size={14} /> {client.phoneNumber}</span>
                <span className="text-gray-300">|</span>
                <span className="text-sm">{client.email || "No Email"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400 mt-2">
                <MapPin size={14} /> {client.address || "No Address"}, {client.state}
              </div>
            </div>
          </div>
          <div className="text-right flex flex-col items-end gap-3">
             {canEdit && (
               <Link href={`/dashboard/clients/${client.id}/edit`} className="bg-blue-50 text-blue-600 border border-blue-200 px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-100 transition shadow-sm flex items-center gap-2">
                 <Edit size={16}/> Edit Profile
               </Link>
             )}
             <div>
               <div className="text-sm text-gray-500 mb-1">Customer ID</div>
               <div className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{client.id.split('-')[0]}</div>
             </div>
          </div>
        </div>
      </div>

      {/* 2. VEHICLE FLEET CARDS */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Car className="text-[#2d4a2a]" /> Vehicle Fleet & Configuration
          </h2>
          <Link href={`/dashboard/clients/${client.id}/add-vehicle`} className="bg-gray-50 border text-gray-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-100 transition shadow-sm flex items-center gap-2">
            <Car size={16} /> Add New Vehicle
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {client.vehicles.map((vehicle) => {
              const job = vehicle.jobs[0];

              return (
                <div key={vehicle.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-lg text-gray-800">{vehicle.name}</h3>
                      <p className="text-xs text-gray-500 font-medium">Year: {vehicle.year || "N/A"}</p>
                    </div>
                    <div className="text-right">
                      <span className="block font-mono text-xs font-bold bg-white border px-2 py-1 rounded text-gray-700">
                        {vehicle.plateNumber || "NO PLATE"}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {job ? (
                      <>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide">Technical Configuration</h4>
                            {job.device?.imei && (
                              <VehicleStatusBadge imei={job.device.imei} />
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                              <span className="text-blue-600 text-xs block mb-1 font-bold">IMEI Number</span>
                              {/* 🟢 FIXED: Safely links to existing warehouse stock using the Smart Modal */}
                              <AssignJobHardwareModal 
                                jobId={job.id} 
                                type="DEVICE" 
                                currentValue={job.device?.imei} 
                                canEdit={canEdit} 
                              />
                            </div>
                            <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                              <span className="text-purple-600 text-xs block mb-1 font-bold">Sim Number</span>
                              {/* 🟢 FIXED: Safely links to existing warehouse stock using the Smart Modal */}
                              <AssignJobHardwareModal 
                                jobId={job.id} 
                                type="SIM" 
                                currentValue={job.simCard?.simNumber} 
                                canEdit={canEdit} 
                              />
                            </div>
                          </div>

                          <div className="flex justify-between items-center text-sm pt-2">
                            <span className="text-gray-500 flex items-center gap-2"><Calendar size={14}/> Config Date:</span>
                            <span className="font-medium text-gray-900">
                              {job.configurationDate ? new Date(job.configurationDate).toLocaleDateString() : "Pending"}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500 flex items-center gap-2"><User size={14}/> Installed By:</span>
                            <span className="font-medium text-gray-900">
                              {job.installerName || job.installer?.fullName || "System Admin"}
                            </span>
                          </div>
                        </div>

                        <hr className="border-gray-100" />

                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide">Payment Information</h4>
                          <div className="flex justify-between items-center bg-green-50 p-4 rounded-lg border border-green-100">
                            <div className="flex items-center gap-3">
                               <div className="bg-[#e0f2de] p-2 rounded-full text-[#2d4a2a]">
                                 <CreditCard size={18} />
                               </div>
                               <div>
                                 <p className="text-xs text-green-800 font-bold uppercase">Amount Paid</p>
                                 <p className="text-xs text-green-600">Collector: {job.paymentCollector || "System"}</p>
                               </div>
                            </div>
                            <div className="text-xl font-bold text-[#2d4a2a]">
                              ₦{job.amountPaid ? Number(job.amountPaid).toLocaleString() : "0"}
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="py-8 text-center text-gray-500 flex flex-col items-center gap-2">
                        <AlertCircle size={24} className="text-gray-400"/>
                        <p className="text-sm font-bold">No active job found.</p>
                      </div>
                    )}
                  </div>
                </div>
              )
           })}
        </div>
      </div>
    </div>
  );
}