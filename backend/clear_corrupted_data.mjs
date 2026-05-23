import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearCorruptedData() {
  try {
    console.log('Clearing corrupted phone and location data for sanju87921@gmail.com...');
    const result = await prisma.user.update({
      where: { email: 'sanju87921@gmail.com' },
      data: {
        phone: '',
        location: '',
      }
    });
    console.log('Data cleared successfully for user:', result.id);
  } catch (error) {
    console.error('Failed to clear data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearCorruptedData();
