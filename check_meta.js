const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const meta = await prisma.ctnSyncMeta.findUnique({where: {id: 'singleton'}});
  console.log(meta);
}
main().finally(() => prisma.$disconnect());
