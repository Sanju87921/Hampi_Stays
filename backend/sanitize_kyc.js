import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const settings = await prisma.verificationSettings.findFirst();
  if (settings) {
    const cleanOwnerReqs = settings.resortOwnerRequirements.filter(r => !['BUSINESS_REG', 'BANK_DETAILS'].includes(r));
    await prisma.verificationSettings.update({
      where: { id: settings.id },
      data: {
        resortOwnerRequirements: cleanOwnerReqs
      }
    });
    console.log("Database sanitized successfully!");
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
