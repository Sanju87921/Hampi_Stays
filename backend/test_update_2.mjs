import { hardenedPrisma } from './server/utils/prisma.js';

async function testDoubleUpdate() {
  try {
    console.log('Testing second update with hardenedPrisma...');
    const result1 = await hardenedPrisma.user.findFirst({
      where: { email: 'sanju87921@gmail.com' }
    });
    
    // Simulate frontend sending back the decrypted value
    const result2 = await hardenedPrisma.user.update({
      where: { email: 'sanju87921@gmail.com' },
      data: {
        phone: result1.phone, // sending the decrypted '1234567890' back
        location: result1.location, // sending the decrypted 'Test Location' back
      }
    });
    
    console.log('Second update result:', result2.phone, result2.location);
  } catch (error) {
    console.error('Update failed:', error);
  } finally {
    await hardenedPrisma.$disconnect();
  }
}

testDoubleUpdate();
