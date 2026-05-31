import http from 'http';

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

import jwt from 'jsonwebtoken';
import { config } from 'dotenv';
config();

const JWT_SECRET = process.env.JWT_SECRET;
const token = jwt.sign({ userId: 'cmpnxqcdu0005z3fb5xwhoi56', role: 'ADMIN' }, JWT_SECRET, { expiresIn: '1h' });

async function run() {
  console.log("--- Testing OTP Request ---");
  const otpRes = await req('POST', '/api/auth/send-mobile-otp', {
    phone: "9999999999"
  });
  console.log("OTP Send status:", otpRes.status);

  console.log("--- Update Settings (Triggers AuditLog) ---");
  const setRes = await req('POST', '/api/admin/settings', {
    detailedAuditLogging: true
  }, token);
  console.log("Settings Update status:", setRes.status);

  console.log("--- Fetch OTP Logs ---");
  const otps = await req('GET', '/api/admin/otp-logs', null, token);
  console.log("OTP Logs count:", otps.body?.data?.length);
  if(otps.body?.data && otps.body.data.length > 0) {
    console.log("Latest OTP Log:", otps.body.data[0]);
  }

  console.log("--- Fetch Audit Logs ---");
  const audits = await req('GET', '/api/admin/audit-logs', null, token);
  console.log("Audit Logs count:", audits.body?.data?.length);
  if(audits.body?.data && audits.body.data.length > 0) {
    console.log("Latest Audit Log:", audits.body.data[0]);
  }
}

run().catch(console.error);
