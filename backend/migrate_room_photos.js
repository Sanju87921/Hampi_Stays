import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function migrate() {
  console.log("Starting room photo migration...");
  const rooms = await prisma.room.findMany({
    include: { photos: true }
  });

  let migratedCount = 0;

  for (const room of rooms) {
    if (room.photos.length === 0 && room.images && room.images.length > 0) {
      console.log(`Migrating ${room.images.length} photos for room ${room.id}...`);
      
      const photoPromises = room.images.map((img, index) => {
        return prisma.roomPhoto.create({
          data: {
            roomId: room.id,
            imageUrl: img,
            isCover: room.coverImage === img || index === 0,
            sortOrder: index
          }
        });
      });

      await Promise.all(photoPromises);
      migratedCount += room.images.length;
    }
  }

  console.log(`Migration complete. Migrated ${migratedCount} photos.`);
}

migrate()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
