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
    // 1. Move the Job strictly to ACTIVE status
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'ACTIVE',
      }
    });
  } catch (error) {
    console.error("Error activating job:", error);
    throw new Error("Failed to activate job");
  }

  // 2. Refresh the relevant dashboard pages
  revalidatePath('/dashboard/activation');
  revalidatePath('/dashboard/clients');
  revalidatePath('/dashboard');
  
  // 3. Redirect the staff member back to the activation queue
  // (Using redirect() satisfies TypeScript's Promise<void> requirement!)
  redirect('/dashboard/activation');
}