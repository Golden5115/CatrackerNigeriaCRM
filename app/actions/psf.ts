'use server';

import { prisma } from "@/lib/prisma"
import { verifySession } from "@/lib/session"
import { revalidatePath } from "next/cache"

export async function logPsfCall(clientId: string, month: string, status: string, feedback: string) {
  const session = await verifySession();
  if (!session) throw new Error("Unauthorized");
  
  await prisma.psfCall.upsert({
    where: {
      clientId_month: {
        clientId,
        month,
      }
    },
    update: {
      status,
      feedback,
      calledAt: new Date(),
      calledById: session.userId as string,
    },
    create: {
      clientId,
      month,
      status,
      feedback,
      calledAt: new Date(),
      calledById: session.userId as string,
    }
  });

  revalidatePath('/dashboard/psf');
}
