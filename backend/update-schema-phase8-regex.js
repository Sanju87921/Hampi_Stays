import fs from 'fs';

const schemaPath = 'prisma/schema.prisma';
let schema = fs.readFileSync(schemaPath, 'utf8');

const insertBeforeEnd = (modelName, stringToInsert) => {
  const modelRegex = new RegExp(\`model \${modelName} \\\{[\\\\s\\\\S]*?\\\n\\\}\`);
  const match = schema.match(modelRegex);
  if (match && !match[0].includes(stringToInsert.trim().split('\\n')[0])) {
    const endBraceIndex = match[0].lastIndexOf('}');
    const newModelBody = match[0].slice(0, endBraceIndex) + stringToInsert + match[0].slice(endBraceIndex);
    schema = schema.replace(match[0], newModelBody);
  }
};

insertBeforeEnd('User', '  couponRedemptions  CouponRedemption[]\n  referralsSent      Referral[]         @relation("Referrer")\n  referralsReceived  Referral[]         @relation("ReferredUser")\n  rewardCredits      RewardCredit[]\n');
insertBeforeEnd('Resort', '  coupons        Coupon[]       @relation("ResortCoupons")\n');
insertBeforeEnd('Booking', '  couponRedemption  CouponRedemption?\n');

fs.writeFileSync(schemaPath, schema);
console.log('Schema updated successfully with regex!');
