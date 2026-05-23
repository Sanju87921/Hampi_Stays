import prisma from './server/utils/prisma.js';

async function update() {
  await prisma.user.update({
    where: { email: 'sanju87921@gmail.com' },
    data: {
      phone: '7353562776',
      location: 'gangavathi'
    }
  });
  console.log("Updated user");
}
update();
