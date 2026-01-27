'use server'

import { PrismaClient, Role } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import * as bcrypt from 'bcryptjs' // <--- Import this

const prisma = new PrismaClient()

export async function createUser(formData: FormData) {
  const fullName = formData.get('fullName') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const role = formData.get('role') as Role

  if (!email || !password || !role) {
    throw new Error("Missing required fields")
  }

  // HASH THE PASSWORD
  const hashedPassword = await bcrypt.hash(password, 10) // <--- Add this line

  await prisma.user.create({
    data: {
      fullName,
      email,
      password: hashedPassword, // <--- Save hashed version
      role: role
    }
  })

  revalidatePath('/dashboard/users')
  redirect('/dashboard/users')
}