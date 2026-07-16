import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const states = await prisma.client.groupBy({
    by: ['state'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 10
  });
  console.log("CLIENT STATES:", states);

  const jobs = await prisma.job.findMany({
    where: { installDate: { not: null } },
    select: { id: true, vehicle: { select: { client: { select: { state: true } } } } },
    take: 10
  });
  console.log("JOB CLIENT STATES:", jobs.map(j => j.vehicle.client.state));
}
main().finally(() => prisma.$disconnect());
