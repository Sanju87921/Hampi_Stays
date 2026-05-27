import prisma from '../server/utils/prisma.js';
import { decrypt, encrypt, sanitizePhoneNumber } from '../server/utils/crypto.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
  console.log('🔄 Starting PII Phone Number Migration and Sanitization...');
  
  // 1. Fetch raw users using raw query to get direct access to the database phone column values (bypassing any extensions/getters)
  const users = await prisma.$queryRaw`SELECT "id", "name", "email", "phone" FROM "users"`;
  
  let updatedCount = 0;
  
  for (const u of users) {
    const rawPhone = u.phone;
    if (!rawPhone) {
      console.log(`User: ${u.email} | Phone is already null/empty.`);
      continue;
    }
    
    console.log(`Processing User: ${u.email} | Raw Phone in DB: ${rawPhone}`);
    
    // Decrypt the raw phone
    let plaintextPhone = '';
    const parts = rawPhone.split(':');
    if (parts.length === 3 && /^[0-9a-f]{24}$/.test(parts[0]) && /^[0-9a-f]{32}$/.test(parts[1])) {
      // It is encrypted
      try {
        plaintextPhone = decrypt(rawPhone);
        console.log(`  Decrypted successfully: ${plaintextPhone}`);
      } catch (err) {
        console.warn(`  Failed to decrypt: ${err.message}. Setting to empty.`);
        plaintextPhone = '';
      }
    } else {
      // It is already plaintext
      plaintextPhone = rawPhone;
      console.log(`  Phone is already plaintext in DB: ${plaintextPhone}`);
    }
    
    // Sanitize the plaintext phone number
    const sanitized = sanitizePhoneNumber(plaintextPhone);
    console.log(`  Sanitized result: "${sanitized}"`);
    
    let encryptedToSave = null;
    if (sanitized) {
      encryptedToSave = encrypt(sanitized);
    }
    
    // Save it back to the database directly using a raw query to bypass any extensions/middleware that might trigger double encryption
    await prisma.$executeRaw`UPDATE "users" SET "phone" = ${encryptedToSave} WHERE "id" = ${u.id}`;
    console.log(`  ✅ Updated user ${u.email} successfully.`);
    updatedCount++;
  }
  
  console.log(`\n🎉 Migration complete. Updated ${updatedCount} users.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
