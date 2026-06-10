import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const exps = await prisma.experience.findMany();
  const curated = await prisma.curatedExperience.findMany();
  console.log("Experiences:", exps.length, exps);
  console.log("CuratedExperiences:", curated.length, curated);
}
main().catch(console.error).finally(() => prisma.$disconnect());
