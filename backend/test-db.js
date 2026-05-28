import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({
    take: 10,
    include: { ownerProfile: true, guideProfile: true, _count: { select: { bookings: true, wishlist: true } } }
  });
  console.log(JSON.stringify(users, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
