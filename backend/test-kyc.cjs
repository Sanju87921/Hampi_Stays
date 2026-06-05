const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const settings = await prisma.verificationSettings.findFirst();
  console.log('Verification Settings:', settings);
  const docs = await prisma.travellerKYC.findMany({ orderBy: { updatedAt: 'desc' }, take: 5, include: { user: true } });
  for (const doc of docs) {
    console.log('\nUser:', doc.user.email, '| verifiedEmail:', doc.user.verifiedEmail, '| verifiedPhone:', doc.user.verifiedPhone);
    console.log('Doc Type:', doc.type, '| Status:', doc.status);
    const allDocs = await prisma.travellerKYC.findMany({ where: { userId: doc.userId } });
    console.log('All Docs for user:', allDocs.map(d => d.type + '=' + d.status).join(', '));
  }
}
main().finally(() => prisma.$disconnect());
