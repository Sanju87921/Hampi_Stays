import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      role: 'RESORT_OWNER'
    },
    include: {
      ownerProfile: {
        include: {
          resorts: true
        }
      }
    }
  });

  console.dir(users, { depth: null });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
