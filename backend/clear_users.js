import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const usersToDelete = await prisma.user.findMany({
    where: {
      role: { in: ['TRAVELLER', 'RESORT_OWNER', 'GUIDE', 'STAFF'] }
    },
    select: { id: true }
  });
  const userIds = usersToDelete.map(u => u.id);

  if (userIds.length === 0) {
    console.log('No non-admin users found to delete.');
    return;
  }

  // Delete dependencies that block user deletion
  await prisma.booking.deleteMany();
  await prisma.message.deleteMany();
  await prisma.guideBooking.deleteMany();

  // Find owners to delete their resorts
  const owners = await prisma.resortOwner.findMany({
    where: { userId: { in: userIds } },
    select: { id: true }
  });
  const ownerIds = owners.map(o => o.id);
  
  if (ownerIds.length > 0) {
    // Delete room price overrides, room blockings, rooms, etc.
    // Rooms cascade from resort, so deleting resort should delete rooms.
    await prisma.resort.deleteMany({
      where: { ownerId: { in: ownerIds } }
    });
  }

  // Delete the users
  const result = await prisma.user.deleteMany({
    where: { id: { in: userIds } }
  });
  
  console.log(`Successfully deleted ${result.count} non-admin users and their related data (resorts, bookings, etc).`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
