'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import * as bcrypt from 'bcryptjs' // 👇 FIX 1: Import bcrypt

export async function createUser(formData: FormData) {
  const fullName = formData.get('fullName') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string 
  const role = formData.get('role') as any 
  
  const accessibleModules = formData.getAll('modules') as string[]

  if (!email || !password || !fullName) {
    return { error: "Please fill in all required fields." }
  }

  try {
    // 👇 FIX 2: Hash the password securely before saving it
    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.user.create({
      data: {
        fullName,
        email,
        password: hashedPassword, // 👇 FIX 3: Save the hashed version, not the plain text
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