const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function fix() {
  const users = await prisma.user.findMany({ include: { travellerKycDocuments: true } });
  let count = 0;
  for (const u of users) {
    if (u.travellerKycDocuments && u.travellerKycDocuments.length > 0 && u.travellerKycDocuments.some(d => d.status === 'VERIFIED')) {
      await prisma.user.update({
        where: { id: u.id },
        data: { kycStatus: 'VERIFIED', verifiedEmail: true, verifiedPhone: true, isEmailVerified: true, isMobileVerified: true, verificationCompletedAt: new Date() }
      });
      count++;
    }
  }
  console.log('Fixed', count, 'users');
}
fix().finally(() => prisma.$disconnect());
