import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runStressTest() {
  console.log("=== INVENTORY STRESS TEST START ===");
  
  // Create test user and resort owner
  const user = await prisma.user.create({
    data: {
      email: `test_stress_${Date.now()}@example.com`,
      passwordHash: 'dummy',
      name: 'Stress Test User',
      phone: `123456${Math.floor(Math.random()*10000)}`
    }
  });

  const owner = await prisma.resortOwner.create({
    data: {
      userId: user.id,
      businessName: 'Stress Test Business'
    }
  });

  const resort = await prisma.resort.create({
    data: {
      name: `Stress Test Resort ${Date.now()}`,
      slug: `stress-test-${Date.now()}`,
      tagline: 'Test Tagline',
      description: 'Test',
      locationArea: 'Test Area',
      locationLat: 15.3350,
      locationLng: 76.4600,
      type: 'RESORT',
      pricePerNight: 5000,
      status: 'APPROVED',
      ownerId: owner.id, // Must be ResortOwner ID
    }
  });

  // Create Room Type with exactly 5 available units
  const room = await prisma.room.create({
    data: {
      resortId: resort.id,
      name: 'Stress Deluxe Room',
      description: 'Test Room',
      pricePerNight: 5000,
      capacity: 2,
      availableCount: 5
    }
  });

  const runConcurrentBookings = async (numConcurrent) => {
    console.log(`\n--- Running ${numConcurrent} concurrent bookings for Inventory of 5 ---`);
    let successCount = 0;
    let failCount = 0;
    const errors = [];

    const promises = Array.from({ length: numConcurrent }).map(async (_, i) => {
      try {
        // We simulate the exact transaction logic from the route
        await prisma.$transaction(async (tx) => {
          const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
          
          const overlappingBookings = await tx.booking.findMany({
            where: {
              roomId: room.id,
              checkIn: { lt: new Date('2026-06-10') },
              checkOut: { gt: new Date('2026-06-05') },
              OR: [
                { status: { in: ['PAID', 'CONFIRMED', 'CHECKED_IN'] } },
                { status: 'PENDING', createdAt: { gt: fifteenMinsAgo } }
              ]
            },
            select: { checkIn: true, checkOut: true }
          });

          const overlappingBlockings = await tx.roomBlocking.findMany({
            where: {
              roomId: room.id,
              date: { gte: new Date('2026-06-05'), lt: new Date('2026-06-10') }
            },
            select: { date: true }
          });

          let maxDailyUsage = 0;
          let currDate = new Date('2026-06-05');
          while (currDate < new Date('2026-06-10')) {
            let dailyUsage = 0;
            
            for (const b of overlappingBookings) {
              if (new Date(b.checkIn) <= currDate && new Date(b.checkOut) > currDate) {
                dailyUsage++;
              }
            }
            
            for (const blk of overlappingBlockings) {
              if (new Date(blk.date).getTime() === currDate.getTime()) {
                dailyUsage++;
              }
            }
            
            if (dailyUsage > maxDailyUsage) maxDailyUsage = dailyUsage;
            currDate.setDate(currDate.getDate() + 1);
          }

          if (maxDailyUsage >= room.availableCount) {
            throw new Error('ROOM_UNAVAILABLE');
          }

          const refNum = `STRESS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

          await tx.booking.create({
            data: {
              userId: user.id,
              resortId: resort.id,
              roomId: room.id,
              checkIn: new Date('2026-06-05'),
              checkOut: new Date('2026-06-10'),
              guests: 2,
              totalPrice: 25000,
              referenceNumber: refNum,
              status: 'PENDING'
            }
          });
        }, {
          isolationLevel: 'Serializable',
          maxWait: 5000,
          timeout: 10000
        });
        successCount++;
      } catch (err) {
        failCount++;
        errors.push(err.message);
      }
    });

    await Promise.allSettled(promises);
    console.log(`Success: ${successCount}`);
    console.log(`Failed: ${failCount}`);
    
    // Output error types
    const errorTypes = [...new Set(errors)];
    console.log(`Errors encountered: ${errorTypes.join(', ')}`);

    // Verify DB state
    const actualBookings = await prisma.booking.count({
      where: { roomId: room.id }
    });
    console.log(`Actual bookings in DB: ${actualBookings} (Should be max 5)`);
    
    // Clean up bookings for next run
    await prisma.booking.deleteMany({ where: { roomId: room.id } });
  };

  // Run iterations
  await runConcurrentBookings(10);
  await runConcurrentBookings(25);
  await runConcurrentBookings(50);
  await runConcurrentBookings(100);

  // Clean up
  await prisma.room.delete({ where: { id: room.id } });
  await prisma.resort.delete({ where: { id: resort.id } });
  await prisma.resortOwner.delete({ where: { id: owner.id } });
  await prisma.user.delete({ where: { id: user.id } });

  console.log("\n=== STRESS TEST COMPLETE ===");
}

runStressTest()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
