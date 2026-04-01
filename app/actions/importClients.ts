'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { verifySession } from "@/lib/session"

// Helper to standardise phone numbers
function normalizePhone(phone: string | null): string {
  if (!phone) return "";
  let cleaned = phone.replace(/\D/g, ''); 
  if (cleaned.startsWith('234')) {
    cleaned = '0' + cleaned.substring(3);
  }
  return cleaned;
}

// 🛑 NEW: Accepts a raw text chunk and a pre-generated batchId
export async function processCSVChunk(chunkText: string, mapping: any, batchId: string) {
  try {
    const session = await verifySession();
    if (!session?.userId) throw new Error("Unauthorized");

    const rows = chunkText.split('\n').filter(row => row.trim().length > 0);
    if (rows.length < 2) return { success: true, inserted: 0, skipped: 0, batchId }; 

    const headers = rows[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

    const nameIdx = headers.indexOf(mapping.fullName);
    const phoneIdx = headers.indexOf(mapping.phoneNumber);
    const emailIdx = mapping.email ? headers.indexOf(mapping.email) : -1;
    const addressIdx = mapping.address ? headers.indexOf(mapping.address) : -1;
    const dateIdx = mapping.createdAt ? headers.indexOf(mapping.createdAt) : -1; 

    if (nameIdx === -1 || phoneIdx === -1) {
      throw new Error("Name and Phone mapping are required.");
    }

    // Fetch existing phones to prevent duplicates
    const existingClients = await prisma.client.findMany({ select: { phoneNumber: true } });
    const existingPhones = new Set(existingClients.map(c => normalizePhone(c.phoneNumber)));

    const clientsToInsert = [];
    let skippedCount = 0;

    for (let i = 1; i < rows.length; i++) {
      const columns = rows[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(col => col.trim().replace(/^"|"$/g, ''));
      
      const rawPhone = columns[phoneIdx];
      const cleanPhone = normalizePhone(rawPhone);

      // Skip Duplicates
      if (cleanPhone && existingPhones.has(cleanPhone)) {
        skippedCount++;
        continue; 
      }

      if (columns[nameIdx] && cleanPhone) {
        
        let creationDate = new Date();
        if (dateIdx !== -1 && columns[dateIdx]) {
          const parsedDate = new Date(columns[dateIdx]);
          if (!isNaN(parsedDate.getTime())) {
            creationDate = parsedDate;
          }
        }

        clientsToInsert.push({
          fullName: columns[nameIdx],
          phoneNumber: cleanPhone,
          email: emailIdx !== -1 ? (columns[emailIdx] || null) : null,
          address: addressIdx !== -1 ? (columns[addressIdx] || null) : null,
          createdAt: creationDate, 
          createdById: session.userId as string,
          importBatchId: batchId,
        });

        existingPhones.add(cleanPhone);
      }
    }

    if (clientsToInsert.length > 0) {
      await prisma.client.createMany({
        data: clientsToInsert,
        skipDuplicates: true 
      });
    }

    revalidatePath('/dashboard/clients');
    
    return { 
      success: true, 
      inserted: clientsToInsert.length, 
      skipped: skippedCount,
      batchId: batchId 
    };

  } catch (error: any) {
    return { error: error.message };
  }
}

// Rollback stays the same
export async function rollbackImport(batchId: string) {
  try {
    const session = await verifySession();
    if (!session?.userId) throw new Error("Unauthorized");

    const result = await prisma.client.deleteMany({
      where: { importBatchId: batchId }
    });

    revalidatePath('/dashboard/clients');
    return { success: true, deleted: result.count };
  } catch (error: any) {
    return { error: error.message };
  }
}

// --- 3. EMERGENCY UNDO (Finds the last batch and deletes it) ---
export async function undoLastImport() {
  try {
    const session = await verifySession();
    if (!session?.userId) throw new Error("Unauthorized");

    // Find the most recently imported client to grab their batch ID
    const lastImport = await prisma.client.findFirst({
      where: { importBatchId: { not: null } },
      orderBy: { createdAt: 'desc' },
      select: { importBatchId: true }
    });

    if (!lastImport || !lastImport.importBatchId) {
      throw new Error("No imported clients found in the database to undo.");
    }

    // Wipe all clients that share that batch ID
    const result = await prisma.client.deleteMany({
      where: { importBatchId: lastImport.importBatchId }
    });

    revalidatePath('/dashboard/clients');
    return { success: true, deleted: result.count };
  } catch (error: any) {
    return { error: error.message };
  }
}