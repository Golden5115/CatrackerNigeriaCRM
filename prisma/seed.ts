import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // 👇 CHANGE THESE TWO LINES TO YOUR PREFERRED LOGIN 👇
  const MY_EMAIL = 'admin@cartrackernigeria.com' 
  const MY_PASSWORD = 'MySecretPassword2026!'

  // 1. Hash the password securely
  const hashedPassword = await bcrypt.hash(MY_PASSWORD, 10)

  // 2. Create or Update the Admin User
  const admin = await prisma.user.upsert({
    where: { email: MY_EMAIL },
    update: { 
      password: hashedPassword,
      fullName: 'System Administrator' 
    },
    create: {
      email: MY_EMAIL,
      fullName: 'System Administrator',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  console.log(`✅ Admin account ready: ${MY_EMAIL}`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })