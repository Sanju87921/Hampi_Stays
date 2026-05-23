import { hardenedPrisma } from './server/utils/prisma.js';

async function testUpdate() {
  try {
    console.log('Testing update with hardenedPrisma...');
    const result = await hardenedPrisma.user.update({
      where: { email: 'sanju87921@gmail.com' },
      data: {
        phone: '1234567890',
        location: 'Test Location',
      }
    });
    console.log('Update result (should be decrypted by the compute field):', result);
  } catch (error) {
    console.error('Update failed:', error);
  } finally {
    await hardenedPrisma.$disconnect();
  }
}

testUpdate();
