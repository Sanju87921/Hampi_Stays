const http = require('http');

async function req(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api' + path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch(e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function run() {
  const timestamp = Date.now();
  
  console.log("--- 1. Register Traveler ---");
  const regRes = await req('POST', '/auth/register', {
    name: "Golden Path User",
    email: `traveler${timestamp}@hampistays.com`,
    password: "Password123!",
    role: "TRAVELLER",
    contact: `9${timestamp.toString().slice(-9)}`
  });
  console.log("Register Traveler status:", regRes.status);
  const userToken = regRes.body.token;

  console.log("--- 2. Submit Traveler KYC ---");
  const kycRes = await req('POST', '/kyc', {
    documentType: "AADHAAR",
    documentUrl: "https://hampistays.com/mock-aadhaar.jpg",
    idNumber: `123412341234`
  }, userToken);
  console.log("Submit KYC status:", kycRes.status, kycRes.body);
  
  // Wait to see if it submitted
  const getKyc = await req('GET', '/kyc', null, userToken);
  console.log("Current KYC status:", getKyc.body[0]?.status || getKyc.body);

  console.log("--- 3. Admin Login ---");
  const adminRes = await req('POST', '/auth/login', {
    email: "admin@hampistays.com",
    password: "Password123!"
  });
  if (!adminRes.body.token) {
    console.log("Creating admin...");
    await req('POST', '/auth/register', {
      name: "Admin User",
      email: "admin@hampistays.com",
      password: "Password123!",
      role: "ADMIN"
    });
  }
  const tokenRes = await req('POST', '/auth/login', {
    email: "admin@hampistays.com",
    password: "Password123!"
  });
  const adminToken = tokenRes.body.token || adminRes.body.token;
  if (!adminToken) {
    console.log("Could not log in as admin", tokenRes.body);
    return;
  }
  console.log("Admin Login status: success");

  console.log("--- 4. Verify Traveler KYC (Admin) ---");
  let kycId = null;
  if (Array.isArray(getKyc.body)) {
      kycId = getKyc.body[0]?.id;
  }
  
  if (!kycId) {
    console.log("No KYC record found to verify. Fetching from admin queue...");
    const adminDocs = await req('GET', '/admin/kyc/travellers', null, adminToken);
    if (adminDocs.body && adminDocs.body.length > 0) {
        kycId = adminDocs.body[0].id;
    }
  }

  if (!kycId) {
      console.log("Still no KYC ID found.");
      return;
  }

  const verifyRes = await req('PATCH', `/admin/kyc/travellers/${kycId}`, {
    status: 'VERIFIED'
  }, adminToken);
  console.log("Admin Verify status:", verifyRes.status);

  console.log("--- 5. Check traveler KYC Status ---");
  const meRes = await req('GET', '/auth/me', null, userToken);
  console.log("Traveler kycStatus:", meRes.body.user?.kycStatus);

  if (meRes.body.user?.kycStatus === 'VERIFIED') {
    console.log("SUCCESS! KYC Status transitioned from PENDING to VERIFIED correctly.");
  } else {
    console.log("FAILED! KYC Status is not VERIFIED.");
  }
}

run().catch(console.error);
