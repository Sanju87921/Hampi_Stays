import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Starting database cleanup...');

  try {
    // 1. Delete transactional data first (due to foreign key constraints)
    console.log('- Cleaning bookings, messages, reviews...');
    await prisma.message.deleteMany({});
    await prisma.booking.deleteMany({});
    await prisma.guideBooking.deleteMany({});
    await prisma.review.deleteMany({});
    await prisma.wishlist.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.invitation.deleteMany({});

    // 2. Clean Guide and Staff profiles
    console.log('- Cleaning guide and staff profiles...');
    await prisma.experience.deleteMany({});
    await prisma.guideProfile.deleteMany({});
    await prisma.staffMember.deleteMany({});

    // 3. Clean Resort data
    console.log('- Cleaning resorts, rooms, and rules...');
    await prisma.roomPriceOverride.deleteMany({});
    await prisma.roomBlocking.deleteMany({});
    await prisma.room.deleteMany({});
    await prisma.discountCode.deleteMany({});
    await prisma.resort.deleteMany({});
    await prisma.resortOwner.deleteMany({});

    // 4. Clean Users (Keeping ADMINS)
    console.log('- Cleaning users (Preserving ADMINS)...');
    const deleteUsersResult = await prisma.user.deleteMany({
      where: {
        role: {
          not: 'ADMIN'
        }
      }
    });
    
    console.log(`✅ Cleaned up ${deleteUsersResult.count} non-admin users.`);
    
    // 5. Clean OTPs
    await prisma.otpVerification.deleteMany({});

    console.log('\n✨ Database is now clean and ready for production!');
    console.log('Note: Admin accounts were preserved.');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
