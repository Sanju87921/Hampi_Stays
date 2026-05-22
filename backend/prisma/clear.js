import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Starting full database cleanup...');

  // Delete in correct foreign-key order
  await prisma.message.deleteMany();
  console.log('✅ Cleared messages');

  await prisma.otpVerification.deleteMany();
  console.log('✅ Cleared OTP verifications');

  await prisma.notification.deleteMany();
  console.log('✅ Cleared notifications');

  await prisma.guideBooking.deleteMany();
  console.log('✅ Cleared guide bookings');

  await prisma.booking.deleteMany();
  console.log('✅ Cleared bookings');

  await prisma.wishlist.deleteMany();
  console.log('✅ Cleared wishlist');

  await prisma.review.deleteMany();
  console.log('✅ Cleared reviews');

  await prisma.roomBlocking.deleteMany();
  console.log('✅ Cleared room blockings');

  await prisma.roomPriceOverride.deleteMany();
  console.log('✅ Cleared room price overrides');

  await prisma.discountCode.deleteMany();
  console.log('✅ Cleared discount codes');

  await prisma.invitation.deleteMany();
  console.log('✅ Cleared invitations');

  await prisma.staffMember.deleteMany();
  console.log('✅ Cleared staff members');

  await prisma.experience.deleteMany();
  console.log('✅ Cleared experiences');

  await prisma.guideProfile.deleteMany();
  console.log('✅ Cleared guide profiles');

  await prisma.room.deleteMany();
  console.log('✅ Cleared rooms');

  await prisma.resort.deleteMany();
  console.log('✅ Cleared resorts');

  await prisma.resortOwner.deleteMany();
  console.log('✅ Cleared resort owners');

  await prisma.systemSettings.deleteMany();
  console.log('✅ Cleared system settings');

  await prisma.user.deleteMany();
  console.log('✅ Cleared all users');

  // Re-create system settings
  await prisma.systemSettings.create({
    data: { guideServiceEnabled: true }
  });
  console.log('✅ Re-initialized system settings');

  // Re-create one clean Admin account
  const passwordHash = await bcrypt.hash('admin123', 12);
  await prisma.user.create({
    data: {
      email: 'admin@hampistays.com',
      name: 'HampiStays Admin',
      passwordHash,
      role: 'ADMIN',
    }
  });
  console.log('✅ Created admin account: admin@hampistays.com / admin123');

  console.log('\n🎉 Database is clean and ready for real data!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
