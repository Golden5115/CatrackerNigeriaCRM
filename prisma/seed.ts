import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // 1. Hash the password securely
  const hashedPassword = await bcrypt.hash('admin123', 10)

  // 2. Create the Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@trackmaster.com' },
    update: { password: hashedPassword }, // Update password if exists
    create: {
      email: 'admin@trackmaster.com',
      fullName: 'System Administrator',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  console.log('✅ Default Admin created: admin@trackmaster.com / admin123')
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