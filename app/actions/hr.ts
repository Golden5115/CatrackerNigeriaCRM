'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import * as bcrypt from 'bcryptjs'

// 1. CHANGE ACCOUNT STATUS (Deactivate / Reactivate)
export async function updateEmployeeStatus(userId: string, newStatus: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE') {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { status: newStatus }
    })
    revalidatePath('/dashboard/users')
    return { success: true }
  } catch (error) {
    return { error: "Failed to update status." }
  }
}

// 2. RESET PASSWORD INSTANTLY
export async function resetEmployeePassword(formData: FormData) {
  const userId = formData.get('userId') as string
  const newPassword = formData.get('newPassword') as string

  if (newPassword.length < 6) return { error: "Password must be at least 6 characters." }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    })
    revalidatePath('/dashboard/users')
    return { success: true }
  } catch (error) {
    return { error: "Failed to reset password." }
  }
}

// 3. UPDATE PERSONNEL FILE (HR Details & Permissions)
export async function updatePersonnelFile(formData: FormData) {
  const userId = formData.get('userId') as string
  
  // 👇 Capture the new permissions (only if they are checked)
  const canEdit = formData.get('canEdit') === 'on'
  const canDelete = formData.get('canDelete') === 'on'
  
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        phoneNumber: formData.get('phoneNumber') as string,
        address: formData.get('address') as string,
        qualifications: formData.get('qualifications') as string,
        guarantorName: formData.get('guarantorName') as string,
        guarantorPhone: formData.get('guarantorPhone') as string,
        guarantorAddress: formData.get('guarantorAddress') as string,
        
        // 👇 Save the updated permissions
        canEdit: canEdit,
        canDelete: canDelete,
      }
    })
    revalidatePath('/dashboard/users')
    return { success: true }
  } catch (error) {
    return { error: "Failed to update personnel file." }
  }
}