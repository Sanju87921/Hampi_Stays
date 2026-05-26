import 'dotenv/config';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

async function migrate() {
  console.log('🚀 Running raw SQL migration to create pending_verifications...');
  try {
    // 1. Add verificationCompletedAt column to users table
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "verificationCompletedAt" TIMESTAMP(3);`
    );
    console.log('✅ Added "verificationCompletedAt" column to "users" table');

    // 2. Create pending_verifications table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "pending_verifications" (
        "id" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "phone" TEXT NOT NULL,
        "passwordHash" TEXT NOT NULL,
        "role" "Role" NOT NULL DEFAULT 'TRAVELLER',
        "otpHash" TEXT NOT NULL,
        "otpType" TEXT NOT NULL,
        "expiresAt" TIMESTAMP(3) NOT NULL,
        "attempts" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "pending_verifications_pkey" PRIMARY KEY ("id")
      );
    `);
    console.log('✅ Created "pending_verifications" table');

    // 3. Create unique index on email
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "pending_verifications_email_key" ON "pending_verifications"("email");
    `);
    console.log('✅ Created unique index on email for "pending_verifications" table');

    console.log('🎉 Migration successful!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
