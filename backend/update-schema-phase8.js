import fs from 'fs';

const schemaPath = 'prisma/schema.prisma';
let schema = fs.readFileSync(schemaPath, 'utf8');

// Insert new relations into User
if (!schema.includes('couponRedemptions  CouponRedemption[]')) {
  schema = schema.replace(
    '  wishlist         Wishlist[]\n',
    '  wishlist         Wishlist[]\n  couponRedemptions  CouponRedemption[]\n  referralsSent      Referral[]         @relation("Referrer")\n  referralsReceived  Referral[]         @relation("ReferredUser")\n  rewardCredits      RewardCredit[]\n'
  );
}

// Insert new relations into Resort
if (!schema.includes('coupons        Coupon[]       @relation("ResortCoupons")')) {
  schema = schema.replace(
    '  resortAmenities ResortAmenity[]\n',
    '  resortAmenities ResortAmenity[]\n  coupons        Coupon[]       @relation("ResortCoupons")\n'
  );
}

// Insert new relations into Booking
if (!schema.includes('couponRedemption  CouponRedemption?')) {
  schema = schema.replace(
    '  messages        Message[]\n',
    '  messages        Message[]\n  couponRedemption  CouponRedemption?\n'
  );
}

// Append new models
if (!schema.includes('model Coupon {')) {
  schema += `
model Coupon {
  id               String   @id @default(cuid())
  code             String   @unique
  type             String   // PERCENTAGE, FLAT, REFERRAL, FIRST_BOOKING, REWARD
  discountValue    Float
  minBookingAmt    Float?
  maxDiscountAmt   Float?
  validFrom        DateTime
  validUntil       DateTime
  maxUsesTotal     Int?
  maxUsesPerUser   Int      @default(1)
  currentUses      Int      @default(0)
  isActive         Boolean  @default(true)
  
  resortId         String?  
  roomId           String?
  region           String?
  userRole         String?
  onlyFirstTime    Boolean  @default(false)
  
  redemptions      CouponRedemption[]
  resort           Resort?  @relation("ResortCoupons", fields: [resortId], references: [id])
  
  @@map("coupons")
}

model CouponRedemption {
  id           String   @id @default(cuid())
  couponId     String
  userId       String
  bookingId    String?  @unique
  discountAmt  Float
  redeemedAt   DateTime @default(now())
  
  coupon       Coupon   @relation(fields: [couponId], references: [id])
  user         User     @relation(fields: [userId], references: [id])
  booking      Booking? @relation(fields: [bookingId], references: [id])
  
  @@unique([couponId, userId, bookingId])
  @@map("coupon_redemptions")
}

model Referral {
  id              String   @id @default(cuid())
  referrerId      String
  referredUserId  String   @unique
  referralCode    String
  status          String   @default("PENDING") // PENDING, COMPLETED
  rewardAmount    Float    @default(0)
  createdAt       DateTime @default(now())
  completedAt     DateTime?
  
  referrer        User     @relation("Referrer", fields: [referrerId], references: [id])
  referredUser    User     @relation("ReferredUser", fields: [referredUserId], references: [id])
  
  @@map("referrals")
}

model RewardCredit {
  id            String   @id @default(cuid())
  userId        String
  amount        Float
  source        String   // REFERRAL, CASHBACK, PROMOTION
  status        String   @default("AVAILABLE") // AVAILABLE, USED, EXPIRED
  expiresAt     DateTime?
  createdAt     DateTime @default(now())
  usedAt        DateTime?
  
  user          User     @relation(fields: [userId], references: [id])
  
  @@map("reward_credits")
}
`;
}

fs.writeFileSync(schemaPath, schema);
console.log('Schema updated successfully for Phase 8!');
