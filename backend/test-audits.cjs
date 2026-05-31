const http = require('http');

async function req(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
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
  console.log("--- Testing OTP Request ---");
  const otpRes = await req('POST', '/auth/otp/send', {
    contact: "9999999999",
    type: "mobile"
  });
  console.log("OTP Send status:", otpRes.status);

  // We need an admin token to test admin endpoints.
  // First, login as admin. (Using default mock password or let's create one)
  console.log("--- Admin Login ---");
  const adminRes = await req('POST', '/auth/login', {
    email: "admin@hampistays.com",
    password: "Password123"
  });
  console.log("Admin Login status:", adminRes.status);
  
  if (!adminRes.body.token) {
    console.log("No token, falling back to creating an admin user via register");
    // Register admin just in case
    const regRes = await req('POST', '/auth/register', {
      name: "Admin User",
      email: "admin2@hampistays.com",
      password: "Password123!",
      role: "ADMIN"
    });
    console.log("Register:", regRes.status);
    return;
  }
  const token = adminRes.body.token;

  console.log("--- Update Settings (Triggers AuditLog) ---");
  const setRes = await req('POST', '/admin/system-settings', {
    detailedAuditLogging: true
  }, token);
  console.log("Settings Update status:", setRes.status);

  console.log("--- Fetch OTP Logs ---");
  const otps = await req('GET', '/admin/otp-logs', null, token);
  console.log("OTP Logs count:", otps.body.data?.length);
  if(otps.body.data && otps.body.data.length > 0) {
    console.log("Latest OTP Log:", otps.body.data[0]);
  }

  console.log("--- Fetch Audit Logs ---");
  const audits = await req('GET', '/admin/audit-logs', null, token);
  console.log("Audit Logs count:", audits.body.data?.length);
  if(audits.body.data && audits.body.data.length > 0) {
    console.log("Latest Audit Log:", audits.body.data[0]);
  }
}

run().catch(console.error);
