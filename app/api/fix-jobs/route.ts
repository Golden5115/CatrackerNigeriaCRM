import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Find all jobs that are ACTIVE but got stuck because onboarded is false
    const result = await prisma.job.updateMany({
      where: {
        status: 'ACTIVE',
        onboarded: false 
      },
      data: {
        onboarded: true
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Database fixed successfully!", 
      jobsFixedCount: result.count 
    });

  } catch (error) {
    console.error("Fix script error:", error);
    return NextResponse.json({ error: "Failed to fix jobs." }, { status: 500 });
  }
}