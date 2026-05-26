import 'dotenv/config';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

async function migrate() {
  console.log('🚀 Running raw SQL migration to add verifiedEmail and verifiedPhone...');
  try {
    // Add verifiedEmail column to users table
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "verifiedEmail" BOOLEAN NOT NULL DEFAULT false;`
    );
    console.log('✅ Added "verifiedEmail" column to "users" table');

    // Add verifiedPhone column to users table
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "verifiedPhone" BOOLEAN NOT NULL DEFAULT false;`
    );
    console.log('✅ Added "verifiedPhone" column to "users" table');

    // Initialize existing users' verifiedEmail to true or isEmailVerified value
    await prisma.$executeRawUnsafe(
      `UPDATE "users" SET "verifiedEmail" = "isEmailVerified", "verifiedPhone" = "isMobileVerified";`
    );
    console.log('✅ Updated verified fields for existing users based on isEmailVerified/isMobileVerified');

    console.log('🎉 Verified fields migration successful!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
