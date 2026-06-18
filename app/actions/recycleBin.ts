'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// 1. Auto Cleanup (Deletes anything archived > 30 days ago)
export async function runAutoCleanup() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // We have to delete Jobs and Vehicles first due to foreign key constraints, 
  // or we can rely on onDelete: Cascade. 
  // However, Jobs have hardware relationships that are just Strings, no cascade needed.
  // Vehicles cascade delete Jobs, Clients cascade delete Vehicles.

  try {
    // Delete old support tickets
    await prisma.support.deleteMany({
      where: { isArchived: true, deletedAt: { lt: thirtyDaysAgo } }
    })

    // Delete old invoices
    await prisma.invoice.deleteMany({
      where: { isArchived: true, deletedAt: { lt: thirtyDaysAgo } }
    })

    // Delete old jobs
    await prisma.job.deleteMany({
      where: { isArchived: true, deletedAt: { lt: thirtyDaysAgo } }
    })

    // Delete old vehicles
    await prisma.vehicle.deleteMany({
      where: { isArchived: true, deletedAt: { lt: thirtyDaysAgo } }
    })

    // Delete old clients
    await prisma.client.deleteMany({
      where: { isArchived: true, deletedAt: { lt: thirtyDaysAgo } }
    })

    return { success: true }
  } catch (err: any) {
    console.error("Auto-cleanup failed:", err.message);
    return { success: false, error: err.message }
  }
}

// 2. Permanent Delete Individual Items
export async function permanentlyDelete(id: string, type: 'client' | 'job' | 'vehicle' | 'invoice' | 'support') {
  try {
    if (type === 'client') await prisma.client.delete({ where: { id } })
    if (type === 'job') await prisma.job.delete({ where: { id } })
    if (type === 'vehicle') await prisma.vehicle.delete({ where: { id } })
    if (type === 'invoice') await prisma.invoice.delete({ where: { id } })
    if (type === 'support') await prisma.support.delete({ where: { id } })

    revalidatePath('/dashboard/recycle-bin')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}
