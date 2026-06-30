import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const payload = {
    fullName: "John Doe (Test)",
    phoneNumber: "08011223344",
    whatsapp: "08011223344",
    car: "Primary Car",
    year: "2020",
    state: "Abuja",
    address: "123 Test Avenue",
    proxy: "Yes",
    remarks: "This is an automated test from the AI assistant.",
    extraCar_1: "Dynamic Vehicle 1",
    extraYear_1: "2021",
    extraCar_2: "Dynamic Vehicle 2",
    extraYear_2: "2022"
  }

  const pendingLead = await prisma.pendingLead.create({
    data: {
      payload: payload,
      status: 'PENDING',
    },
  })

  console.log("Successfully created test pending lead! ID:", pendingLead.id)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
