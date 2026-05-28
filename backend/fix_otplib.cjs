const fs = require('fs');

const backendFile = 'server/routes/admin/security.js';
let backendContent = fs.readFileSync(backendFile, 'utf8');

// Replace import
backendContent = backendContent.replace(
  "import { authenticator } from 'otplib';",
  "import { OTP } from 'otplib';\nconst authenticator = new OTP();"
);

// Replace keyuri with generateURI
backendContent = backendContent.replace(
  "const otpauthUrl = authenticator.keyuri(admin.email, 'HampiStays Admin', secret);",
  "const otpauthUrl = authenticator.generateURI({ label: admin.email, issuer: 'HampiStays Admin', secret });"
);

// Replace verify with verifySync
backendContent = backendContent.replace(
  "const isValid = authenticator.verify({ token, secret: admin.mfaSecret });",
  "const verifyResult = authenticator.verifySync({ token, secret: admin.mfaSecret });\n      const isValid = verifyResult && verifyResult.valid;"
);

fs.writeFileSync(backendFile, backendContent, 'utf8');

console.log('Fixed otplib API usage for v13.');
