const fs = require('fs');
let c = fs.readFileSync('c:/Users/sanju/Desktop/Hampi-Stays/backend/prisma/schema.prisma', 'utf8');

c = c.replace(/model ResortOwnerPayout \{[^}]+\}/, `model ResortOwnerPayout {
  id                 String   @id @default(cuid())
  bookingId          String   @unique
  resortId           String
  ownerId            String
  grossAmount        Float
  commissionRate     Float
  platformCommission Float
  netAmount          Float
  status             String   @default("PENDING")
  settlementId       String?
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  settlement SettlementLedger? @relation(fields: [settlementId], references: [id])
  booking    Booking           @relation(fields: [bookingId], references: [id])
  resort     Resort            @relation(fields: [resortId], references: [id])
  owner      ResortOwner       @relation(fields: [ownerId], references: [id])

  @@index([resortId])
  @@index([ownerId])
  @@index([status])
  @@map("resort_owner_payouts")
}`);

c = c.replace(/model SettlementLedger \{[^}]+\}/, `model SettlementLedger {
  id              String    @id @default(cuid())
  ownerId         String
  totalGross      Float
  totalCommission Float
  totalNet        Float
  status          String    @default("PENDING")
  transactionRef  String?
  settlementDate  DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  payouts ResortOwnerPayout[]
  owner   ResortOwner         @relation(fields: [ownerId], references: [id])

  @@index([ownerId])
  @@index([status])
  @@map("settlement_ledgers")
}`);

c = c.replace(/model Booking \{/, `model Booking {\n  payout ResortOwnerPayout?\n`);
c = c.replace(/model Resort \{/, `model Resort {\n  payouts ResortOwnerPayout[]\n`);
c = c.replace(/model ResortOwner \{/, `model ResortOwner {\n  payouts ResortOwnerPayout[]\n  settlements SettlementLedger[]\n`);

fs.writeFileSync('c:/Users/sanju/Desktop/Hampi-Stays/backend/prisma/schema.prisma', c);
