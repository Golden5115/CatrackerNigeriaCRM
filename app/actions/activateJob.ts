'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function activateJob(formData: FormData) {
  const jobId = formData.get('jobId') as string;
  
  if (!jobId) {
    throw new Error("Job ID is missing");
  }

  try {
    // 🟢 FIXED: Restored 'onboarded: true' so the job flows instantly into Payments & Accounts
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'ACTIVE',
        onboarded: true 
      }
    });
  } catch (error) {
    console.error("Error activating job:", error);
    throw new Error("Failed to activate job");
  }

  // Refresh all connected financial modules
  revalidatePath('/dashboard/activation');
  revalidatePath('/dashboard/clients');
  revalidatePath('/dashboard/payments');
  revalidatePath('/dashboard/accounts');
  revalidatePath('/dashboard');
  
  redirect('/dashboard/activation');
}