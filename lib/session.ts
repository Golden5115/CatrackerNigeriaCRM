import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const secretKey = process.env.SESSION_SECRET || 'default-secret-key-change-this'
const encodedKey = new TextEncoder().encode(secretKey)

// 1. CREATE SESSION (Login)
export async function createSession(userId: string, role: string) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  const session = await new SignJWT({ userId, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedKey)
 
  const cookieStore = await cookies()
  cookieStore.set('session', session, {
    httpOnly: true,
    secure: true,
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  })
}

// 2. VERIFY SESSION (Middleware & Action check)
// 👇 UPDATED: Automatically grabs the cookie if no token is passed
export async function verifySession(token?: string) {
  try {
    const cookieStore = await cookies()
    const sessionToken = token || cookieStore.get('session')?.value

    if (!sessionToken) return null

    const { payload } = await jwtVerify(sessionToken, encodedKey, {
      algorithms: ['HS256'],
    })
    return payload
  } catch (error) {
    return null
  }
}

// 3. DELETE SESSION (Logout)
export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
}