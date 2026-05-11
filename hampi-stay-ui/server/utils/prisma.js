import { PrismaClient } from '@prisma/client';
import { encrypt, decrypt } from './crypto.js';

const prisma = new PrismaClient();

/**
 * Hardened Prisma Client with field-level encryption
 */
export const hardenedPrisma = prisma.$extends({
  query: {
    user: {
      async create({ args, query }) {
        if (args.data.phone) args.data.phone = encrypt(args.data.phone);
        if (args.data.location) args.data.location = encrypt(args.data.location);
        if (args.data.idNumber) args.data.idNumber = encrypt(args.data.idNumber);
        return query(args);
      },
      async update({ args, query }) {
        if (args.data.phone) args.data.phone = encrypt(args.data.phone);
        if (args.data.location) args.data.location = encrypt(args.data.location);
        if (args.data.idNumber) args.data.idNumber = encrypt(args.data.idNumber);
        return query(args);
      },
    },
    resortOwner: {
      async create({ args, query }) {
        if (args.data.gstNumber) args.data.gstNumber = encrypt(args.data.gstNumber);
        return query(args);
      },
      async update({ args, query }) {
        if (args.data.gstNumber) args.data.gstNumber = encrypt(args.data.gstNumber);
        return query(args);
      },
    },
    guideProfile: {
      async create({ args, query }) {
        if (args.data.idNumber) args.data.idNumber = encrypt(args.data.idNumber);
        return query(args);
      },
      async update({ args, query }) {
        if (args.data.idNumber) args.data.idNumber = encrypt(args.data.idNumber);
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
    },
  },
});

export default hardenedPrisma;
