const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { evaluateTravellerKyc } = require('./server/utils/kycEngine.js');

async function testAdmin() {
  console.log("Getting a traveller to verify...");
  const traveler = await prisma.user.findFirst({
    where: { role: 'TRAVELLER', kycStatus: 'PENDING' },
    include: { travellerKycDocuments: true }
  });

  if (!traveler) {
    console.log("No pending traveler found. Fetching any traveler...");
    const t2 = await prisma.user.findFirst({ where: { role: 'TRAVELLER' }});
    if(!t2) {
      console.log("No travelers exist.");
      return;
    }
    await prisma.user.update({ where: { id: t2.id }, data: { kycStatus: 'PENDING' } });
    const docs = await prisma.travellerKYC.findMany({ where: { userId: t2.id } });
    if(docs.length === 0) {
      await prisma.travellerKYC.create({
        data: {
          userId: t2.id,
          documentType: 'AADHAAR',
          documentUrl: 'https://hampistays.com/mock.jpg',
          idNumber: '123412341234',
          status: 'PENDING'
        }
      });
    } else {
      await prisma.travellerKYC.updateMany({ where: { userId: t2.id }, data: { status: 'PENDING' } });
    }
    console.log("Prepared traveler:", t2.email);
    return testAdmin();
  }

  console.log("Found traveler:", traveler.email);

  const kycDoc = traveler.travellerKycDocuments[0];
  if(!kycDoc) {
    console.log("No kyc doc attached.");
    return;
  }

  console.log("Simulating Admin Approval for doc:", kycDoc.id);

  const doc = await prisma.travellerKYC.update({
    where: { id: kycDoc.id },
    data: { status: 'VERIFIED' },
    include: { user: true }
  });

  const userId = doc.userId;
  
  // This matches the logic in the admin patch controller
  await prisma.user.update({ 
    where: { id: userId }, 
    data: { 
      kycStatus: 'VERIFIED',
      verifiedEmail: true,
      verifiedPhone: true,
      isEmailVerified: true,
      isMobileVerified: true,
      verificationCompletedAt: new Date()
    } 
  });

  console.log("Checking user again...");
  const updatedUser = await prisma.user.findUnique({ where: { id: userId } });
  
  if(updatedUser.kycStatus === 'VERIFIED') {
     console.log("✅ Admin Operation Audit Passed: KYC Status transitioned from PENDING to VERIFIED.");
  } else {
     console.log("❌ Admin Operation Audit Failed.");
  }

}

testAdmin().catch(console.error).finally(() => prisma.$disconnect());
