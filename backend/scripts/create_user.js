import prisma from '../server/utils/prisma.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
  const email = 'sanju87921@gmail.com';
  const plainPassword = 'password123';
  const name = 'Sanju';
  const role = 'TRAVELLER';

  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`✅ User already exists: ${existing.email} (ID: ${existing.id})`);
    return;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(plainPassword, 12);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: hashedPassword,
      name,
      role,
      verifiedEmail: true,
      verifiedPhone: false,
    },
  });

  console.log(`✅ User created successfully!`);
  console.log(`   ID:    ${user.id}`);
  console.log(`   Name:  ${user.name}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Role:  ${user.role}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
