'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
// If you use bcrypt for passwords, import it here: import bcrypt from 'bcryptjs'

export async function createUser(formData: FormData) {
  const fullName = formData.get('fullName') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string 
  const role = formData.get('role') as any // "ADMIN", "CSR", "INSTALLER", "TECH_SUPPORT"
  
  // This grabs all the checkboxes the Admin ticked
  const accessibleModules = formData.getAll('modules') as string[]

  if (!email || !password || !fullName) {
    return { error: "Please fill in all required fields." }
  }

  try {
    // SECURITY NOTE: In a live production app, you should hash this password before saving!
    // const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.user.create({
      data: {
        fullName,
        email,
        password, // Save hashedPassword here if using bcrypt
        role,
        accessibleModules
      }
    })

    revalidatePath('/dashboard/users')
    return { success: true }
  } catch (error: any) {
    if (error.code === 'P2002') return { error: "A user with this email already exists." }
    return { error: "Failed to create user." }
  }
}