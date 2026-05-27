import 'dotenv/config';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Running raw SQL migration to add rejection reason columns...');
  try {
    // Add kycRejectionReason to users table
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "kycRejectionReason" text;`
    );
    console.log('✅ Added "kycRejectionReason" column to "users" table');

    // Add rejectionReason to guide_profiles table
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "guide_profiles" ADD COLUMN IF NOT EXISTS "rejectionReason" text;`
    );
    console.log('✅ Added "rejectionReason" column to "guide_profiles" table');

    console.log('✅ Migration succeeded.');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
