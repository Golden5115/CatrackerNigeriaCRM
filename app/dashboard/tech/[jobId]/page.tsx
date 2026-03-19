import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import SubmitButton from "@/components/SubmitButton"
import { CheckCircle, Car, User, ArrowLeft, ShieldCheck, Hash, Wrench } from "lucide-react"
import Link from "next/link"
import { revalidatePath } from "next/cache"

export default async function TechVerificationPage({ 
  params 
}: { 
  params: Promise<{ jobId: string }> 
}) {
  const { jobId } = await params;
  
  // 1. Fetch the Job, including the Installer and Devices
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      vehicle: { include: { client: true } },
      device: true,
      simCard: true,
      installer: true 
    }
  })

  if (!job) return notFound()

  const isMaintenance = job.jobType === 'MAINTENANCE'

  // 2. Inline Server Action: Approve the job
  async function verifyAndSaveJob(formData: FormData) {
    'use server'
    const imei = formData.get('imei') as string | null
    const simNumber = formData.get('simNumber') as string | null
    const plateNumber = formData.get('plateNumber') as string
    
    // 👇 FIX 1: Safely update Device/SIM ONLY if the fields were actually submitted
    if (job?.deviceId && imei) {
       await prisma.device.update({ where: { id: job.deviceId }, data: { imei } })
    }
    if (job?.simCardId && simNumber) {
       await prisma.simCard.update({ where: { id: job.simCardId }, data: { simNumber } })
    }
    
    // Update Vehicle Plate Number if corrected
    if (job?.vehicleId && plateNumber) {
       await prisma.vehicle.update({ where: { id: job.vehicleId }, data: { plateNumber } })
    }

    // 👇 FIX 2: Smart Routing. Maintenance goes straight to ACTIVE. Others go to Onboarding.
    const nextStatus = job?.jobType === 'MAINTENANCE' ? 'ACTIVE' : 'CONFIGURED'

    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: nextStatus,
        configurationDate: new Date(),
        serverConfig: true
      }
    })
    
    revalidatePath('/dashboard/tech')
    revalidatePath('/dashboard/activation')
    revalidatePath('/dashboard/leads')
    redirect('/dashboard/tech') 
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/tech" className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            Quality Control & Verification
            {isMaintenance && <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full uppercase tracking-wider">Maintenance</span>}
          </h2>
          <p className="text-gray-500">Verify the field data and server connection.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        {/* Read-Only Context Data */}
        <div className="bg-blue-50 p-6 border-b border-blue-100 grid grid-cols-1 md:grid-cols-2 gap-4">
           <div>
             <p className="text-xs font-bold text-blue-800 uppercase mb-1 flex items-center gap-1"><User size={14}/> Field Technician</p>
             <p className="font-medium text-gray-900 text-lg">{job.installer?.fullName || "Unknown Installer"}</p>
           </div>
           <div>
             <p className="text-xs font-bold text-blue-800 uppercase mb-1 flex items-center gap-1"><Car size={14}/> Vehicle Model</p>
             <p className="font-medium text-gray-900 text-lg">{job.vehicle.name} <span className="text-gray-500 text-sm">({job.vehicle.year || "N/A"})</span></p>
           </div>
        </div>

        {/* Verification Form */}
        <form action={verifyAndSaveJob} className="p-6 space-y-6">
           <div className="bg-orange-50 text-orange-800 p-4 rounded-xl text-sm flex items-start gap-3 border border-orange-100">
              <ShieldCheck size={24} className="shrink-0 mt-0.5 text-orange-600" />
              <p>Please confirm the vehicle is actively reporting online on the tracking server before approving this ticket.</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {/* Plate Number is ALWAYS visible */}
             <div>
               <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1">
                 <Hash size={14}/> Plate / Chassis
               </label>
               <input 
                 name="plateNumber" 
                 defaultValue={job.vehicle.plateNumber || ""} 
                 required 
                 className="w-full p-4 border rounded-xl font-mono text-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition" 
               />
             </div>

             {/* 👇 FIX 3: Hide Hardware Inputs if it is just Maintenance */}
             {!isMaintenance && (
               <>
                 <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tracker IMEI</label>
                   <input 
                     name="imei" 
                     defaultValue={job.device?.imei} 
                     required 
                     className="w-full p-4 border rounded-xl font-mono text-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition" 
                   />
                 </div>
                 
                 <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Sim Number</label>
                   <input 
                     name="simNumber" 
                     defaultValue={job.simCard?.simNumber} 
                     required 
                     className="w-full p-4 border rounded-xl font-mono text-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition" 
                   />
                 </div>
               </>
             )}
           </div>

           <div className="pt-4 mt-6">
             {isMaintenance ? (
               <SubmitButton className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-orange-600 shadow-lg flex justify-center items-center gap-2 transition">
                 <Wrench size={24} /> Verify Online & Close Maintenance Ticket
               </SubmitButton>
             ) : (
               <SubmitButton className="w-full bg-[#84c47c] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#6aa663] shadow-lg flex justify-center items-center gap-2 transition">
                 <CheckCircle size={24} /> Approve & Send to Onboarding
               </SubmitButton>
             )}
           </div>
        </form>
      </div>
    </div>
  )
}