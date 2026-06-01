import { getPrisma } from './config/prisma.js';

async function testUpload() {
  const prisma = getPrisma({ DATABASE_URL: process.env.DATABASE_URL });
  
  // 1. check-hash
  try {
    const existing = await prisma.mediaHash.findUnique({
      where: { hash: 'testhash' }
    });
    console.log('check-hash DB query success:', existing);
  } catch (err) {
    console.error('check-hash DB query failed:', err.message);
  }

  // 2. signature
  // We can't easily test this without the worker environment, but we can check if Cloudinary env vars exist
  console.log('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? 'Exists' : 'Missing');

  // 3. post to /resorts/:id/kyc
  try {
    // just check if resort table exists
    const resort = await prisma.resort.findFirst({ include: { owner: true } });
    console.log('Resort query success, found:', resort ? resort.id : 'none');
  } catch (err) {
    console.error('Resort query failed:', err.message);
  }
}

testUpload();
