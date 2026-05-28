import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

async function clearNonAdminUsers() {
  console.log('🔍 Fetching all non-ADMIN users...');

  const nonAdminUsers = await prisma.user.findMany({
    where: { role: { not: 'ADMIN' } },
    select: { id: true, email: true, role: true },
  });

  console.log(`Found ${nonAdminUsers.length} non-admin user(s) to delete:`);
  nonAdminUsers.forEach(u => console.log(`  - [${u.role}] ${u.email} (${u.id})`));

  if (nonAdminUsers.length === 0) {
    console.log('✅ Nothing to delete — only admin users exist.');
    await prisma.$disconnect();
    return;
  }

  const userIds = nonAdminUsers.map(u => u.id);

  // Pre-fetch resort owner IDs for these users
  const ownerRows = await prisma.resortOwner.findMany({
    where: { userId: { in: userIds } },
    select: { id: true },
  });
  const ownerIds = ownerRows.map(r => r.id);
  console.log(`\nFound ${ownerIds.length} resort owner profile(s) linked to these users.`);

  console.log('\n🗑️  Deleting related data in cascade order...\n');

  const del = async (label, fn) => {
    try {
      const result = await fn();
      console.log(`  ✅ ${label}: ${result.count} row(s) deleted`);
    } catch (err) {
      if (err.code === 'P2021' || err.message?.includes('does not exist in the current database')) {
        console.log(`  ⏭️  ${label}: table not found in DB, skipping`);
      } else {
        console.log(`  ⚠️  ${label}: ${err.message.split('\n')[0]}`);
      }
    }
  };

  // OTP / Auth
  await del('OTP Verifications',     () => prisma.otpVerification.deleteMany({ where: { userId: { in: userIds } } }));
  await del('Pending Verifications', () => prisma.pendingVerification.deleteMany({ where: { email: { in: nonAdminUsers.map(u => u.email) } } }));

  // Notifications / Activity
  await del('Notifications',         () => prisma.notification.deleteMany({ where: { userId: { in: userIds } } }));
  await del('Reward Credits',        () => prisma.rewardCredit.deleteMany({ where: { userId: { in: userIds } } }));
  await del('Verification Audits',   () => prisma.verificationAudit.deleteMany({
    where: { OR: [{ targetUserId: { in: userIds } }, { adminId: { in: userIds } }] }
  }));

  // User content
  await del('Wishlist',              () => prisma.wishlist.deleteMany({ where: { userId: { in: userIds } } }));
  await del('Reviews',               () => prisma.review.deleteMany({ where: { userId: { in: userIds } } }));
  await del('Bookings',              () => prisma.booking.deleteMany({ where: { userId: { in: userIds } } }));
  await del('Guide Bookings',        () => prisma.guideBooking.deleteMany({ where: { userId: { in: userIds } } }));
  await del('Guide Profiles',        () => prisma.guideProfile.deleteMany({ where: { userId: { in: userIds } } }));

  // Resort cascade (children → parent → owner)
  if (ownerIds.length > 0) {
    await del('Coupon-Resort Links',   () => prisma.coupon.deleteMany({ where: { resortId: { not: null }, resort: { ownerId: { in: ownerIds } } } }));
    await del('Discount Codes',        () => prisma.discountCode.deleteMany({ where: { resort: { ownerId: { in: ownerIds } } } }));
    await del('Staff Members',         () => prisma.staffMember.deleteMany({ where: { resort: { ownerId: { in: ownerIds } } } }));
    await del('Resort Amenities',      () => prisma.resortAmenity.deleteMany({ where: { resort: { ownerId: { in: ownerIds } } } }));
    await del('Room Types',            () => prisma.room.deleteMany({ where: { resort: { ownerId: { in: ownerIds } } } }));
    await del('Invitations',           () => prisma.invitation.deleteMany({ where: { resort: { ownerId: { in: ownerIds } } } }));
    await del('Resorts',               () => prisma.resort.deleteMany({ where: { ownerId: { in: ownerIds } } }));
    await del('Resort Owners',         () => prisma.resortOwner.deleteMany({ where: { userId: { in: userIds } } }));
  }

  // Finally delete users
  await del('Users',                 () => prisma.user.deleteMany({ where: { id: { in: userIds } } }));

  console.log('\n📋 Verifying remaining users in database...');
  const remaining = await prisma.user.findMany({ select: { id: true, email: true, role: true } });
  if (remaining.length === 0) {
    console.log('  ⚠️  No users remain! Check admin account.');
  } else {
    remaining.forEach(u => console.log(`  ✔  [${u.role}] ${u.email}`));
  }

  console.log('\n✅ Cleanup complete.');
  await prisma.$disconnect();
}

clearNonAdminUsers().catch(async (err) => {
  console.error('❌ Script failed:', err.message);
  await prisma.$disconnect();
  process.exit(1);
});
