import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

async function check() {
  const user = await p.user.findFirst({
    where: { email: 'sanju87921@gmail.com' },
    select: {
      id: true, name: true, email: true, phone: true, location: true
    }
  });

  console.log('=== CURRENT DB RAW VALUES ===');
  console.log(JSON.stringify(user, null, 2));

  await p.$disconnect();
}
check();
