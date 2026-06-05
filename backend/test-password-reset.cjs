const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

async function testPasswordReset() {
  try {
    // 1. Get a user
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log('No user found to test with.');
      return;
    }
    const email = user.email;
    console.log(`[TEST] Using email: ${email}`);

    // 2. Simulate /auth/forgot-password logic
    console.log('[TEST] Simulating /auth/forgot-password...');
    await prisma.otpVerification.deleteMany({
      where: { email: email, otpType: 'password_reset' }
    });

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(token, 12);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const otpRecord = await prisma.otpVerification.create({
      data: {
        userId: user.id,
        email: email,
        otpHash: tokenHash,
        otpType: 'password_reset',
        expiresAt
      }
    });
    console.log(`[TEST] Token generated and saved to DB. Token: ${token}`);
    console.log(`[TEST] OTP Record created:`, { id: otpRecord.id, email: otpRecord.email });

    // 3. Simulate /auth/reset-password logic
    console.log('[TEST] Simulating /auth/reset-password...');
    const records = await prisma.otpVerification.findMany({
      where: {
        email: email,
        otpType: 'password_reset',
        verified: false,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (records.length === 0) {
      console.error('[TEST] ERROR: No valid OTP records found!');
      return;
    }

    let matchingRecord = null;
    for (const record of records) {
      if (record.attempts >= 5) continue;
      const isMatch = await bcrypt.compare(token, record.otpHash);
      if (isMatch) {
        matchingRecord = record;
        break;
      }
    }

    if (!matchingRecord) {
      console.error('[TEST] ERROR: Failed to match token with DB hash.');
      return;
    }
    console.log(`[TEST] Token matched successfully with DB hash!`);

    // Complete the reset
    const newPassword = "NewLuxuryPassword!123";
    const salt = await bcrypt.genSalt(12);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    await prisma.$transaction([
      prisma.user.update({
        where: { email: email },
        data: { passwordHash: newPasswordHash }
      }),
      prisma.otpVerification.update({
        where: { id: matchingRecord.id },
        data: { verified: true }
      })
    ]);

    console.log(`[TEST] Password successfully reset for user ${email}!`);
    console.log(`[TEST] Old password hash overwritten. OTP record marked as verified.`);
    
    // Verify changes
    const updatedUser = await prisma.user.findUnique({ where: { email } });
    const updatedOtp = await prisma.otpVerification.findUnique({ where: { id: matchingRecord.id } });
    
    console.log('[TEST RESULTS]');
    console.log('- OTP Verified:', updatedOtp.verified);
    console.log('- Password Hash Changed:', user.passwordHash !== updatedUser.passwordHash);

  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testPasswordReset();
