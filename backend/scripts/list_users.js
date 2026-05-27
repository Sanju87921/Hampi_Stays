import prisma from '../server/utils/prisma.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true
    }
  });

  console.log('=== DATABASE USERS ===');
  users.forEach(u => {
    console.log(`ID: ${u.id} | Name: ${u.name} | Email: ${u.email} | Phone: ${u.phone} | Role: ${u.role}`);
  });

  // Query raw database directly using queryRaw to see what is ACTUALLY in the database column (bypass compute getters)
  const rawUsers = await prisma.$queryRaw`SELECT "id", "name", "email", "phone" FROM "users"`;
  console.log('\n=== RAW DATABASE USERS (BYPASSING GETTERS) ===');
  rawUsers.forEach(u => {
    console.log(`ID: ${u.id} | Name: ${u.name} | Email: ${u.email} | Phone: ${u.phone}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
