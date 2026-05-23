/**
 * verify_production.mjs
 * Run: node verify_production.mjs <password>
 * Verifies the production API returns human-readable phone/location.
 */

const PROD_API = 'https://hampi-stays.sanju87921.workers.dev/api';
const EMAIL = 'sanju87921@gmail.com';
const PASSWORD = process.argv[2];

if (!PASSWORD) {
  console.error('Usage: node verify_production.mjs <your-password>');
  process.exit(1);
}

async function main() {
  console.log('🔐 Logging in to production...');
  const loginRes = await fetch(`${PROD_API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD })
  });
  const loginData = await loginRes.json();

  if (!loginData.token) {
    console.error('❌ Login failed:', loginData);
    process.exit(1);
  }
  console.log('✅ Login successful. Token obtained.');

  console.log('\n📋 Fetching /users/profile...');
  const profileRes = await fetch(`${PROD_API}/users/profile`, {
    headers: { Authorization: `Bearer ${loginData.token}` }
  });
  const profile = await profileRes.json();

  console.log('\n=== PRODUCTION /users/profile RESPONSE ===');
  console.log(JSON.stringify(profile, null, 2));

  console.log('\n=== VERIFICATION ===');
  const phone = profile.phone;
  const location = profile.location;
  const isPhoneEncrypted = phone && phone.includes(':') && phone.split(':').length === 3;
  const isLocationEncrypted = location && location.includes(':') && location.split(':').length === 3;

  console.log(`Phone   : ${phone}`);
  console.log(`Location: ${location}`);

  if (isPhoneEncrypted || isLocationEncrypted) {
    console.log('\n❌ FAIL — Fields still contain encrypted values (hash format)!');
  } else {
    console.log('\n✅ SUCCESS — Fields contain human-readable values!');
  }
}

main().catch(console.error);
