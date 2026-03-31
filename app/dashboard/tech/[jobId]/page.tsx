import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import SubmitButton from "@/components/SubmitButton"
import { CheckCircle, Car, User, ArrowLeft, ShieldCheck, Hash, Wrench, XCircle, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { revalidatePath } from "next/cache"

export default async function TechVerificationPage({ 
  params 
}: { 
  params: Promise<{ jobId: string }> 
}) {
  const { jobId } = await params;
  
  // 1. Fetch the Job
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

  // ==========================================
  // ACTION 1: APPROVE JOB
  // ==========================================
  async function verifyAndSaveJob(formData: FormData) {
    'use server'
    const imei = formData.get('imei') as string | null
    const simNumber = formData.get('simNumber') as string | null
    const plateNumber = formData.get('plateNumber') as string
    
    if (job?.deviceId && imei) {
       await prisma.device.update({ where: { id: job.deviceId }, data: { imei } })
    }
    if (job?.simCardId && simNumber) {
       await prisma.simCard.update({ where: { id: job.simCardId }, data: { simNumber } })
    }
    
    if (job?.vehicleId && plateNumber) {
       await prisma.vehicle.update({ where: { id: job.vehicleId }, data: { plateNumber } })
    }

    const nextStatus = job?.jobType === 'MAINTENANCE' ? 'ACTIVE' : 'CONFIGURED'

    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: nextStatus,
        configurationDate: new Date(),
        serverConfig: true,
        supportNotes: null // Clear any previous rejection notes!
      }
    })
    
    revalidatePath('/dashboard/tech')
    revalidatePath('/dashboard/activation')
    revalidatePath('/dashboard/leads')
    redirect('/dashboard/tech') 
  }

  // ==========================================
  // ACTION 2: REJECT JOB (NEW!)
  // ==========================================
  async function rejectJob(formData: FormData) {
    'use server'
    const reason = formData.get('reason') as string

    await prisma.$transaction(async (tx) => {
      // A. Free the hardware back to inventory
      if (job?.deviceId) {
        await tx.device.update({ where: { id: job.deviceId }, data: { status: 'IN_STOCK' } })
      }
      if (job?.simCardId) {
        await tx.simCard.update({ where: { id: job.simCardId }, data: { status: 'IN_STOCK' } })
      }

      // B. Send job back to Installer and wipe the hardware links
      await tx.job.update({
        where: { id: jobId },
        data: {
          status: 'IN_PROGRESS', // Back to the pipeline!
          deviceId: null,        // Unlink the wrong device
          simCardId: null,       // Unlink the wrong SIM
          supportNotes: `TECH REJECTION: ${reason}` // Tell them why
        }
      })
    })

    revalidatePath('/dashboard/tech')
    revalidatePath('/dashboard/leads')
    revalidatePath('/dashboard/inventory')
    redirect('/dashboard/tech') 
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
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
           <div className="bg-green-50 text-green-800 p-4 rounded-xl text-sm flex items-start gap-3 border border-green-100">
              <ShieldCheck size={24} className="shrink-0 mt-0.5 text-green-600" />
              <p>Please confirm the vehicle is actively reporting online on the tracking server before approving this ticket.</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div>
               <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1">
                 <Hash size={14}/> Plate / Chassis
               </label>
               <input 
                 name="plateNumber" 
                 defaultValue={job.vehicle.plateNumber || ""} 
                 required 
                 className="w-full p-4 border rounded-xl font-mono text-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500 outline-none transition" 
               />
             </div>

             {!isMaintenance && (
               <>
                 <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tracker IMEI</label>
                   <input 
                     name="imei" 
                     defaultValue={job.device?.imei} 
                     required 
                     className="w-full p-4 border rounded-xl font-mono text-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500 outline-none transition" 
                   />
                 </div>
                 
                 <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Sim Number</label>
                   <input 
                     name="simNumber" 
                     defaultValue={job.simCard?.simNumber} 
                     required 
                     className="w-full p-4 border rounded-xl font-mono text-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500 outline-none transition" 
                   />
                 </div>
               </>
             )}
           </div>

           <div className="pt-4 mt-6 border-b pb-8">
             {isMaintenance ? (
               <SubmitButton className="w-full bg-[#84c47c] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#6aa663] shadow-lg flex justify-center items-center gap-2 transition">
                 <Wrench size={24} /> Verify Online & Close Maintenance Ticket
               </SubmitButton>
             ) : (
               <SubmitButton className="w-full bg-[#84c47c] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#6aa663] shadow-lg flex justify-center items-center gap-2 transition">
                 <CheckCircle size={24} /> Approve & Send to Onboarding
               </SubmitButton>
             )}
           </div>
        </form>

        {/* REJECTION FORM */}
        <form action={rejectJob} className="p-6 bg-red-50/50">
           <h3 className="text-red-800 font-bold flex items-center gap-2 mb-4">
             <AlertTriangle size={20} /> Hardware Issue?
           </h3>
           <p className="text-sm text-red-600 mb-4">
             If the IMEI or SIM card is incorrect and the device is not coming online, reject this ticket. The hardware will be returned to inventory, and the installer will be forced to rescan the correct items.
           </p>

           <div className="flex flex-col md:flex-row gap-4">
             <input 
               name="reason" 
               required 
               placeholder="Reason for rejection (e.g., 'Device offline, check IMEI')" 
               className="flex-1 p-3 border border-red-200 rounded-xl bg-white focus:ring-2 focus:ring-red-500 outline-none transition"
             />
             <SubmitButton 
                className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700 transition shadow-md whitespace-nowrap"
                loadingText="Rejecting..."
             >
                <XCircle size={18} className="inline mr-2" /> Reject to Installer
             </SubmitButton>
           </div>
        </form>

      </div>
    </div>
  )
}