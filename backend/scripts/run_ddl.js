import prisma from '../server/utils/prisma.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
  console.log("Running DDL migration via Prisma Accelerate raw execution...");
  try {
    // Check if columns exist
    const columns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'SystemSettings' AND column_name IN ('requireOtpForSignup', 'updatedBy')
    `;
    console.log("Existing columns in SystemSettings:", columns);
    
    const hasRequireOtp = columns.some(c => c.column_name === 'requireOtpForSignup');
    const hasUpdatedBy = columns.some(c => c.column_name === 'updatedBy');
    
    if (!hasRequireOtp) {
      console.log("Adding column 'requireOtpForSignup'...");
      await prisma.$executeRawUnsafe(
        'ALTER TABLE "SystemSettings" ADD COLUMN "requireOtpForSignup" BOOLEAN DEFAULT true'
      );
      console.log("Column 'requireOtpForSignup' added.");
    } else {
      console.log("Column 'requireOtpForSignup' already exists.");
    }
    
    if (!hasUpdatedBy) {
      console.log("Adding column 'updatedBy'...");
      await prisma.$executeRawUnsafe(
        'ALTER TABLE "SystemSettings" ADD COLUMN "updatedBy" TEXT'
      );
      console.log("Column 'updatedBy' added.");
    } else {
      console.log("Column 'updatedBy' already exists.");
    }
    
    console.log("✅ DDL migration completed successfully!");
  } catch (err) {
    console.error("❌ DDL migration failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
