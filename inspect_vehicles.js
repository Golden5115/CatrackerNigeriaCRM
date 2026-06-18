const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const jobs = await prisma.job.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      vehicle: true
    }
  });

  console.log("Recent Jobs:");
  jobs.forEach(j => {
    console.log(`Job: ${j.id} | VehicleID: ${j.vehicle.id} | VehicleName: ${j.vehicle.name}`);
  });
}

main().finally(() => prisma.$disconnect());
