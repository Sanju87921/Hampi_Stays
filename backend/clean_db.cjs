const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanDB() {
  try {
    const nonAdmins = await prisma.user.findMany({
      where: { role: { not: 'ADMIN' } },
      select: { id: true }
    });
    
    const userIds = nonAdmins.map(u => u.id);
    console.log(`Found ${userIds.length} non-admin users to delete.`);

    if (userIds.length === 0) {
      console.log('No users to delete.');
      return;
    }

    // Delete dependent entities that might not have cascade delete
    console.log('Deleting dependent entities...');
    await prisma.message.deleteMany({ where: { senderId: { in: userIds } } });
    await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.otpVerification.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.wishlist.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.review.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.adminSession.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.auditLog.deleteMany({ where: { adminId: { in: userIds } } });
    
    // Booking relations
    const bookings = await prisma.booking.findMany({ where: { userId: { in: userIds } } });
    const bookingIds = bookings.map(b => b.id);
    await prisma.couponRedemption.deleteMany({ where: { bookingId: { in: bookingIds } } });
    await prisma.resortOwnerPayout.deleteMany({ where: { bookingId: { in: bookingIds } } });
    await prisma.refundRequest.deleteMany({ where: { bookingId: { in: bookingIds } } });
    await prisma.guideBooking.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.booking.deleteMany({ where: { userId: { in: userIds } } });

    const owners = await prisma.resortOwner.findMany({ where: { userId: { in: userIds } } });
    const ownerIds = owners.map(o => o.id);

    const resorts = await prisma.resort.findMany({ where: { ownerId: { in: ownerIds } }});
    const resortIds = resorts.map(r => r.id);
    await prisma.discountCode.deleteMany({ where: { resortId: { in: resortIds } } });
    await prisma.invitation.deleteMany({ where: { resortId: { in: resortIds } } });
    await prisma.resortAmenity.deleteMany({ where: { resortId: { in: resortIds } } });
    await prisma.coupon.deleteMany({ where: { resortId: { in: resortIds } } });
    await prisma.room.deleteMany({ where: { resortId: { in: resortIds } } });
    await prisma.resort.deleteMany({ where: { ownerId: { in: ownerIds } } });
    await prisma.kycDocument.deleteMany({ where: { ownerId: { in: ownerIds } } });
    await prisma.bankAccount.deleteMany({ where: { ownerId: { in: ownerIds } } });
    await prisma.settlementLedger.deleteMany({ where: { ownerId: { in: ownerIds } } });
    await prisma.resortOwnerPayout.deleteMany({ where: { ownerId: { in: ownerIds } } });
    await prisma.resortOwner.deleteMany({ where: { userId: { in: userIds } } });
    
    const guides = await prisma.guideProfile.findMany({ where: { userId: { in: userIds } } });
    const guideIds = guides.map(g => g.id);
    await prisma.experience.deleteMany({ where: { guideId: { in: guideIds } } });
    await prisma.guideKYC.deleteMany({ where: { guideProfileId: { in: guideIds } } });
    await prisma.guideReview.deleteMany({ where: { guideProfileId: { in: guideIds } } });
    await prisma.guidePayout.deleteMany({ where: { guideProfileId: { in: guideIds } } });
    await prisma.guideBooking.deleteMany({ where: { guideId: { in: guideIds } } });
    await prisma.guideProfile.deleteMany({ where: { userId: { in: userIds } } });
    
    await prisma.staffMember.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.travellerKYC.deleteMany({ where: { userId: { in: userIds } } });

    // Finally delete users
    const result = await prisma.user.deleteMany({
      where: { role: { not: 'ADMIN' } }
    });

    console.log(`Successfully deleted ${result.count} users.`);
  } catch (error) {
    console.error('Error cleaning database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanDB();
