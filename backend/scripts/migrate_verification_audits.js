import 'dotenv/config';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Running raw SQL migration to add soft delete, fraud detection columns, and verification_audits table...');
  try {
    // Add deletedAt, fraudScore, fraudFlags to users
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deletedAt" timestamp with time zone;`
    );
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "fraudScore" integer DEFAULT 0 NOT NULL;`
    );
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "fraudFlags" text[];`
    );
    console.log('✅ Updated "users" table with deletedAt, fraudScore, and fraudFlags.');

    // Add deletedAt, fraudScore, fraudFlags to guide_profiles
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "guide_profiles" ADD COLUMN IF NOT EXISTS "deletedAt" timestamp with time zone;`
    );
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "guide_profiles" ADD COLUMN IF NOT EXISTS "fraudScore" integer DEFAULT 0 NOT NULL;`
    );
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "guide_profiles" ADD COLUMN IF NOT EXISTS "fraudFlags" text[];`
    );
    console.log('✅ Updated "guide_profiles" table with deletedAt, fraudScore, and fraudFlags.');

    // Add deletedAt to resorts
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "resorts" ADD COLUMN IF NOT EXISTS "deletedAt" timestamp with time zone;`
    );
    console.log('✅ Updated "resorts" table with deletedAt.');

    // Create verification_audits table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "verification_audits" (
        "id" TEXT PRIMARY KEY,
        "adminId" TEXT NOT NULL,
        "adminName" TEXT,
        "targetUserId" TEXT NOT NULL,
        "targetName" TEXT,
        "targetType" TEXT NOT NULL,
        "action" TEXT NOT NULL,
        "rejectionReason" TEXT,
        "previousStatus" TEXT,
        "newStatus" TEXT NOT NULL,
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);
    console.log('✅ Created "verification_audits" table.');

    console.log('✅ Database migration succeeded.');
  } catch (err) {
    console.error('❌ Database migration failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
