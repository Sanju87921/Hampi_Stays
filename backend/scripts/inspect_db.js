import { PrismaClient } from '@prisma/client';
import { decrypt } from '../server/utils/crypto.js';

const prisma = new PrismaClient();

async function main() {
  console.log("=== Inspecting Users ===");
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { idImage: { not: null } },
        { idNumber: { not: null } }
      ]
    }
  });

  for (const user of users) {
    console.log(`User ID: ${user.id}`);
    console.log(`  Name: ${user.name}`);
    console.log(`  idType: ${user.idType}`);
    console.log(`  idNumber (raw): ${user.idNumber}`);
    try {
      console.log(`  idNumber (decrypted): ${decrypt(user.idNumber)}`);
    } catch (e) {
      console.log(`  idNumber decryption failed: ${e.message}`);
    }
    console.log(`  idImage (raw): ${user.idImage}`);
    try {
      console.log(`  idImage (decrypted): ${decrypt(user.idImage)}`);
    } catch (e) {
      console.log(`  idImage decryption failed: ${e.message}`);
    }
    console.log(`  kycStatus: ${user.kycStatus}`);
  }

  console.log("\n=== Inspecting Guide Profiles ===");
  const guides = await prisma.guideProfile.findMany({});
  for (const guide of guides) {
    console.log(`Guide ID: ${guide.id}`);
    console.log(`  userId: ${guide.userId}`);
    console.log(`  idType: ${guide.idType}`);
    console.log(`  idNumber (raw): ${guide.idNumber}`);
    try {
      console.log(`  idNumber (decrypted): ${decrypt(guide.idNumber)}`);
    } catch (e) {
      console.log(`  idNumber decryption failed: ${e.message}`);
    }
    console.log(`  idImage (raw): ${guide.idImage}`);
    try {
      console.log(`  idImage (decrypted): ${decrypt(guide.idImage)}`);
    } catch (e) {
      console.log(`  idImage decryption failed: ${e.message}`);
    }
    console.log(`  status: ${guide.status}`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
