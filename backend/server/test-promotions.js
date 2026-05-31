import { PrismaClient } from '@prisma/client';
import { validateCouponCode } from './utils/couponEngine.js';

const prisma = new PrismaClient();

async function runTests() {
  console.log("=== PROMOTIONS ENGINE LIVE VERIFICATION ===");

  // 1. Setup Dummy Data
  const user = await prisma.user.create({
    data: {
      name: "Test Traveller",
      email: `test-${Date.now()}@example.com`,
      phone: `99999${Math.floor(Math.random() * 100000)}`,
      passwordHash: "dummy",
      role: "TRAVELLER"
    }
  });

  const ownerId = "dummy_owner";
  const resort = await prisma.resort.findFirst({ where: { status: 'APPROVED' } });
  if (!resort) throw new Error("No resort found to test with");
  const resortId = resort.id;

  // Create Promotions
  const welcomeOffer = await prisma.promotion.create({
    data: {
      name: "Welcome",
      code: "WELCOME26",
      discountType: "percentage",
      discountValue: 15,
      firstBookingOnly: true,
      active: true,
      autoApply: true
    }
  });

  const flatOffer = await prisma.promotion.create({
    data: {
      name: "Flat 500",
      code: "FLAT500",
      discountType: "flat",
      discountValue: 500,
      active: true
    }
  });

  const percentageOffer = await prisma.promotion.create({
    data: {
      name: "10 Percent",
      code: "TENPERCENT",
      discountType: "percentage",
      discountValue: 10,
      active: true
    }
  });

  const minBookingOffer = await prisma.promotion.create({
    data: {
      name: "Min 2500",
      code: "MIN2500",
      discountType: "flat",
      discountValue: 300,
      minBookingAmount: 2500,
      active: true
    }
  });

  const autoOffer = await prisma.promotion.create({
    data: {
      name: "Summer Auto",
      code: null,
      discountType: "percentage",
      discountValue: 5,
      active: true,
      autoApply: true
    }
  });

  try {
    // 1. Welcome Offer - First Booking
    console.log("\n--- 1. Welcome Offer (First Booking) ---");
    let res = await validateCouponCode(prisma, { code: "WELCOME26", userId: user.id, resortId: resortId, originalAmount: 5000 });
    console.log("Welcome Validation:", res);
    
    // Simulate first successful booking
    await prisma.booking.create({
      data: {
        referenceNumber: `B-${Date.now()}`,
        userId: user.id,
        resortId: resortId,
        status: "PAID",
        checkIn: new Date(),
        checkOut: new Date(Date.now() + 86400000),
        totalPrice: 4250,
        guests: 2,
        promotionId: welcomeOffer.id
      }
    });

    // 2. Returning Traveller
    console.log("\n--- 2. Returning Traveller (Welcome Offer Again) ---");
    res = await validateCouponCode(prisma, { code: "WELCOME26", userId: user.id, resortId: resortId, originalAmount: 5000 });
    console.log("Welcome Validation (2nd time):", res);

    // 3. Flat Discount
    console.log("\n--- 3. Flat Discount ---");
    res = await validateCouponCode(prisma, { code: "FLAT500", userId: user.id, resortId: resortId, originalAmount: 2000 });
    console.log("Flat Validation:", res);

    // 4. Percentage Discount
    console.log("\n--- 4. Percentage Discount ---");
    res = await validateCouponCode(prisma, { code: "TENPERCENT", userId: user.id, resortId: resortId, originalAmount: 2500 });
    console.log("Percentage Validation:", res);

    // 5. Minimum Booking Value
    console.log("\n--- 5. Minimum Booking Value ---");
    res = await validateCouponCode(prisma, { code: "MIN2500", userId: user.id, resortId: resortId, originalAmount: 2499 });
    console.log("Min 2499 Validation:", res);
    res = await validateCouponCode(prisma, { code: "MIN2500", userId: user.id, resortId: resortId, originalAmount: 2500 });
    console.log("Min 2500 Validation:", res);

    // 6. Auto Apply Promotion (No Code)
    console.log("\n--- 6. Auto Apply Promotion (No Code) ---");
    res = await validateCouponCode(prisma, { promotion: autoOffer, code: null, userId: user.id, resortId: resortId, originalAmount: 3000 });
    console.log("Auto Apply Validation:", res);

  } finally {
    // Cleanup
    await prisma.booking.deleteMany({ where: { userId: user.id } });
    await prisma.promotion.deleteMany({ where: { id: { in: [welcomeOffer.id, flatOffer.id, percentageOffer.id, minBookingOffer.id, autoOffer.id] } } });
    await prisma.user.deleteMany({ where: { id: user.id } });
    await prisma.$disconnect();
  }
}

runTests().catch(console.error);
