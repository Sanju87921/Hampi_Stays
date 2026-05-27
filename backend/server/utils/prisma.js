import { PrismaClient } from '@prisma/client';
import { encrypt, decrypt } from './crypto.js';

const prisma = new PrismaClient();

/**
 * Safely encrypt a value — skips if already encrypted (iv:authTag:ciphertext format)
 * This prevents the catastrophic double-encryption bug where failed decryptions
 * get re-encrypted on save, making data permanently unrecoverable.
 */
function safeEncrypt(value) {
  if (!value) return value;
  // Already encrypted values have the format: hexIV:hexAuthTag:hexCiphertext
  // IV is 12 bytes = 24 hex chars, AuthTag is 16 bytes = 32 hex chars
  const parts = value.split(':');
  if (parts.length === 3 && /^[0-9a-f]{24}$/.test(parts[0]) && /^[0-9a-f]{32}$/.test(parts[1])) {
    return value; // Already encrypted, don't double-encrypt
  }
  return encrypt(value);
}

/**
 * Hardened Prisma Client with field-level encryption
 */
export const hardenedPrisma = prisma.$extends({
  query: {
    user: {
      async create({ args, query }) {
        if (args.data.phone) args.data.phone = safeEncrypt(args.data.phone);
        if (args.data.location) args.data.location = safeEncrypt(args.data.location);
        if (args.data.idNumber) args.data.idNumber = safeEncrypt(args.data.idNumber);
        return query(args);
      },
      async update({ args, query }) {
        if (args.data.phone) args.data.phone = safeEncrypt(args.data.phone);
        if (args.data.location) args.data.location = safeEncrypt(args.data.location);
        if (args.data.idNumber) args.data.idNumber = safeEncrypt(args.data.idNumber);
        return query(args);
      },
    },
    resortOwner: {
      async create({ args, query }) {
        if (args.data.gstNumber) args.data.gstNumber = safeEncrypt(args.data.gstNumber);
        return query(args);
      },
      async update({ args, query }) {
        if (args.data.gstNumber) args.data.gstNumber = safeEncrypt(args.data.gstNumber);
        return query(args);
      },
    },
    guideProfile: {
      async create({ args, query }) {
        if (args.data.idNumber) args.data.idNumber = safeEncrypt(args.data.idNumber);
        return query(args);
      },
      async update({ args, query }) {
        if (args.data.idNumber) args.data.idNumber = safeEncrypt(args.data.idNumber);
        return query(args);
      },
    },
  },
  result: {
    user: {
      phone: {
        needs: { phone: true },
        compute(user) {
          return decrypt(user.phone);
        },
      },
      location: {
        needs: { location: true },
        compute(user) {
          return decrypt(user.location);
        },
      },
      idNumber: {
        needs: { idNumber: true },
        compute(user) {
          return decrypt(user.idNumber);
        },
      },
      idImage: {
        needs: { idImage: true },
        compute(user) {
          return decrypt(user.idImage);
        },
      },
    },
    resortOwner: {
      gstNumber: {
        needs: { gstNumber: true },
        compute(owner) {
          return decrypt(owner.gstNumber);
        },
      },
    },
    guideProfile: {
      idNumber: {
        needs: { idNumber: true },
        compute(profile) {
          return decrypt(profile.idNumber);
        },
      },
      idImage: {
        needs: { idImage: true },
        compute(profile) {
          return decrypt(profile.idImage);
        },
      },
    },
  },
});

export default hardenedPrisma;
