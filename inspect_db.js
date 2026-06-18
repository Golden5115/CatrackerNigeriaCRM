const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const jobs = await prisma.job.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      vehicle: { include: { client: true } }
    }
  });

  console.log("Recent Jobs:");
  jobs.forEach(j => {
    console.log(`Job: ${j.id} | Status: ${j.status} | Vehicle: ${j.vehicle.name} | Client: ${j.vehicle.client.fullName} (ID: ${j.vehicle.client.id}, ctnLeadId: ${j.vehicle.client.ctnLeadId})`);
  });
}

main().finally(() => prisma.$disconnect());
