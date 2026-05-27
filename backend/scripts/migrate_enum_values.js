import 'dotenv/config';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Running raw SQL migration to add ResortStatus enum values...');
  try {
    // ALTER TYPE ADD VALUE statements cannot run inside a transaction block in Postgres.
    // So we run them individually.
    const values = ['NOT_SUBMITTED', 'UNDER_REVIEW', 'RESUBMITTED', 'VERIFIED'];
    for (const val of values) {
      try {
        await prisma.$executeRawUnsafe(
          `ALTER TYPE "ResortStatus" ADD VALUE '${val}';`
        );
        console.log(`✅ Added value ${val} to ResortStatus enum.`);
      } catch (err) {
        if (err.message.includes('already exists') || err.message.includes('duplicate')) {
          console.log(`ℹ️ Value ${val} already exists in ResortStatus enum.`);
        } else {
          throw err;
        }
      }
    }
    console.log('✅ Enum migration completed successfully.');
  } catch (err) {
    console.error('❌ Enum migration failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
