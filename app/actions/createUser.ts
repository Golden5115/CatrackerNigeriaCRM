'use server'

import { Role } from '@prisma/client'
import { prisma } from "@/lib/prisma"
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import * as bcrypt from 'bcryptjs' 

export async function createUser(formData: FormData) {
  const fullName = formData.get('fullName') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const role = formData.get('role') as Role
  
  // 👇 Capture both checkboxes
  const canEdit = formData.get('canEdit') === 'on'
  const canDelete = formData.get('canDelete') === 'on'

  if (!email || !password || !role) {
    throw new Error("Missing required fields")
  }

  const hashedPassword = await bcrypt.hash(password, 10) 

  await prisma.user.create({
    data: {
      fullName,
      email,
      password: hashedPassword, 
      role: role,
      canEdit: canEdit,     // 👇 Save Edit status
      canDelete: canDelete  // 👇 Save Delete status
    }
  })

  revalidatePath('/dashboard/users')
  redirect('/dashboard/users')
}