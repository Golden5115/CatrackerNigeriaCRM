'use server'

import { PrismaClient } from '@prisma/client'
import { createSession, deleteSession } from '@/lib/session'
import * as bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'

const prisma = new PrismaClient()

export async function login(prevState: any, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // 1. Find User
  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    return { error: 'User not found.' }
  }

  // 2. Check Password (Hash comparison)
  const isPasswordValid = await bcrypt.compare(password, user.password)

  if (!isPasswordValid) {
    return { error: 'Invalid credentials.' }
  }

  // 3. Create Session Cookie
  await createSession(user.id, user.role)

  // 4. Redirect
  redirect('/dashboard')
}

export async function logout() {
  await deleteSession()
  redirect('/login')
}