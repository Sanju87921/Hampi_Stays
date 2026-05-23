import { hardenedPrisma } from './server/utils/prisma.js';

async function check() {
  const user = await hardenedPrisma.user.findUnique({
    where: { email: 'sanju87921@gmail.com' }
  });

  console.log('=== CURRENT DB DECRYPTED VALUES ===');
  console.log(JSON.stringify(user, null, 2));

  await hardenedPrisma.$disconnect();
}
check();
