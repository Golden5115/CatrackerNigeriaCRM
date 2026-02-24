import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import SubmitButton from "@/components/SubmitButton"
import { CheckCircle, Car, User, ArrowLeft, ShieldCheck, Hash } from "lucide-react"
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
      installer: true // Grabs the name of who claimed it
    }
  })

  if (!job) return notFound()

  // 2. Inline Server Action: Approve the job
  async function verifyAndSaveJob(formData: FormData) {
    'use server'
    const imei = formData.get('imei') as string
    const simNumber = formData.get('simNumber') as string
    const plateNumber = formData.get('plateNumber') as string
    
    // Update Device/SIM just in case the Tech corrected a typo
    if (job?.deviceId) {
       await prisma.device.update({ where: { id: job.deviceId }, data: { imei } })
    }
    if (job?.simCardId) {
       await prisma.simCard.update({ where: { id: job.simCardId }, data: { simNumber } })
    }
    
    // Update Vehicle Plate Number if corrected
    if (job?.vehicleId) {
       await prisma.vehicle.update({ where: { id: job.vehicleId }, data: { plateNumber } })
    }

    // Mark Job as Configured
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'CONFIGURED',
        configurationDate: new Date(),
        serverConfig: true
      }
    })
    
    revalidatePath('/dashboard/tech')
    revalidatePath('/dashboard/activation')
    redirect('/dashboard/tech') // Send them back to their queue
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/tech" className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Quality Control & Verification</h2>
          <p className="text-gray-500">Verify the field data before sending to onboarding.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        {/* Read-Only Context Data */}
        <div className="bg-blue-50 p-6 border-b border-blue-100 grid grid-cols-1 md:grid-cols-2 gap-4">
           <div>
             <p className="text-xs font-bold text-blue-800 uppercase mb-1 flex items-center gap-1"><User size={14}/> Installed By</p>
             <p className="font-medium text-gray-900 text-lg">{job.installer?.fullName || "Unknown Installer"}</p>
           </div>
           <div>
             <p className="text-xs font-bold text-blue-800 uppercase mb-1 flex items-center gap-1"><Car size={14}/> Vehicle Model</p>
             <p className="font-medium text-gray-900 text-lg">{job.vehicle.name} <span className="text-gray-500 text-sm">({job.vehicle.year || "N/A"})</span></p>
           </div>
        </div>

        {/* Verification Form */}
        <form action={verifyAndSaveJob} className="p-6 space-y-6">
           <div className="bg-orange-50 text-orange-800 p-4 rounded-xl text-sm flex items-start gap-3">
              <ShieldCheck size={24} className="shrink-0 mt-0.5 text-orange-600" />
              <p>Please confirm the device is reporting online on the tracking server. You can correct any typos in the Plate Number, IMEI, or SIM below before approving.</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {/* Added Plate Number Field */}
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
           </div>

           <div className="pt-4 mt-6">
             <SubmitButton className="w-full bg-[#84c47c] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#6aa663] shadow-lg flex justify-center items-center gap-2">
               <CheckCircle size={24} /> Approve & Send to Onboarding
             </SubmitButton>
           </div>
        </form>
      </div>
    </div>
  )
}