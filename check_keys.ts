import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const keys = await prisma.apiKey.findMany();
  console.log("All keys in DB:", keys.map(k => k.key));
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
