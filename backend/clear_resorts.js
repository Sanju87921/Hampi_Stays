/**
 * clear_resorts.js
 * Safely deletes all resort data in cascade order.
 * Run: node clear_resorts.js
 * 
 * Use --owner <email> to delete resorts for a specific owner only.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const ownerIdx = args.indexOf('--owner');
  const ownerEmail = ownerIdx !== -1 ? args[ownerIdx + 1] : null;

  console.log('\n🗑️  HampiStays Resort Data Cleanup');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  let resortWhere = {};

  if (ownerEmail) {
    const user = await prisma.user.findUnique({ where: { email: ownerEmail } });
    if (!user) {
      console.error(`❌ No user found with email: ${ownerEmail}`);
      return;
    }
    const ownerProfile = await prisma.resortOwner.findUnique({ where: { userId: user.id } });
    if (!ownerProfile) {
      console.error(`❌ No resort owner profile for: ${ownerEmail}`);
      return;
    }
    resortWhere = { ownerId: ownerProfile.id };
    console.log(`👤 Targeting resorts for owner: ${ownerEmail} (ownerId: ${ownerProfile.id})`);
  } else {
    console.log('⚠️  No --owner flag. Deleting ALL resort data in the database.\n');
  }

  // 1. Count what we're about to delete
  const resorts = await prisma.resort.findMany({
    where: resortWhere,
    select: { id: true, name: true, status: true }
  });

  if (resorts.length === 0) {
    console.log('✅ No resorts found. Database is already clean.');
    return;
  }

  console.log(`📋 Found ${resorts.length} resort(s) to delete:\n`);
  resorts.forEach(r => console.log(`   • [${r.status}] ${r.name} (${r.id})`));
  console.log('');

  const resortIds = resorts.map(r => r.id);

  // 2. Delete child records first (in case cascade is not set on all)
  console.log('🔄 Deleting bookings...');
  const bookings = await prisma.booking.deleteMany({ where: { resortId: { in: resortIds } } });
  console.log(`   ✅ Deleted ${bookings.count} booking(s)`);

  console.log('🔄 Deleting reviews...');
  const reviews = await prisma.review.deleteMany({ where: { resortId: { in: resortIds } } });
  console.log(`   ✅ Deleted ${reviews.count} review(s)`);

  console.log('🔄 Deleting staff members...');
  const staff = await prisma.staffMember.deleteMany({ where: { resortId: { in: resortIds } } });
  console.log(`   ✅ Deleted ${staff.count} staff member(s)`);

  console.log('🔄 Deleting discount codes...');
  const discounts = await prisma.discountCode.deleteMany({ where: { resortId: { in: resortIds } } });
  console.log(`   ✅ Deleted ${discounts.count} discount code(s)`);

  console.log('🔄 Deleting wishlists...');
  const wishlists = await prisma.wishlist.deleteMany({ where: { resortId: { in: resortIds } } });
  console.log(`   ✅ Deleted ${wishlists.count} wishlist entry/entries`);

  console.log('🔄 Deleting invitations...');
  const invitations = await prisma.invitation.deleteMany({ where: { resortId: { in: resortIds } } });
  console.log(`   ✅ Deleted ${invitations.count} invitation(s)`);

  console.log('🔄 Deleting resort amenities...');
  const amenities = await prisma.resortAmenity.deleteMany({ where: { resortId: { in: resortIds } } });
  console.log(`   ✅ Deleted ${amenities.count} amenity records`);

  // 3. Delete rooms and their children (cascade handles room_photos, room_price_overrides, room_blockings)
  console.log('🔄 Deleting rooms (+ photos, price overrides, blockings via cascade)...');
  const rooms = await prisma.room.deleteMany({ where: { resortId: { in: resortIds } } });
  console.log(`   ✅ Deleted ${rooms.count} room(s)`);

  // 4. Finally delete the resorts
  console.log('🔄 Deleting resorts...');
  const deleted = await prisma.resort.deleteMany({ where: { id: { in: resortIds } } });
  console.log(`   ✅ Deleted ${deleted.count} resort(s)\n`);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Done! Resort database is now clean.`);
  console.log('   Owner profiles and user accounts are preserved.\n');
}

main()
  .catch(e => {
    console.error('❌ Error:', e.message);
    process.exit(1);
  })
  .finally(async () => await prisma.$disconnect());
