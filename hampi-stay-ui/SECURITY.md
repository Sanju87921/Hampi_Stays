# HampiStays Security Policy

This document outlines the security measures implemented in the HampiStays platform and the process for reporting vulnerabilities.

## Implemented Security Measures

### 1. Data Protection
- **Field-Level Encryption**: Sensitive user data (phone numbers, addresses, government IDs) is encrypted at rest using **AES-256-GCM**.
- **Password Hashing**: Passwords are never stored in plaintext. We use **bcrypt** with 12 salt rounds.
- **Key Management**: Encryption keys are stored securely in environment variables and never committed to the repository.

### 2. Infrastructure Hardening
- **Secure Headers**: Implemented using `Helmet.js` to prevent XSS, Clickjacking, and other common attacks.
- **CORS Policy**: Restricted to trusted origins to prevent cross-origin data theft.
- **Rate Limiting**: Implemented on all API endpoints, with stricter limits on authentication and OTP routes to prevent brute-force attacks.
- **HSTS**: Enforced via secure headers to ensure all communication happens over HTTPS.

### 3. Authentication & Authorization
- **JWT Protection**: Secure JSON Web Tokens with reasonable expiration and protected secrets.
- **RBAC**: Role-Based Access Control enforced on all sensitive routes (Admin, Owner, Guide).
- **Secure OTP**: Cryptographically secure OTP generation using `crypto.randomInt`.

### 4. Payment Security (Razorpay)
- **Backend-Only Orders**: Orders are created on the server to prevent price tampering.
- **Signature Verification**: Every payment is verified using Razorpay signatures on the backend.
- **Transaction Audit Logs**: All payment events are logged for reconciliation.

### 5. File & Image Security
- **MIME Validation**: Strict check for file types (JPEG, PNG, WebP) on the backend.
- **Size Limits**: Enforced 5MB limit per file.
- **Signed Uploads**: Using Cloudinary signed requests to keep API secrets on the server.

## Environment Variable Checklist for Railway

| Variable | Description | Security Requirement |
|----------|-------------|----------------------|
| `JWT_SECRET` | Secret key for signing JWTs | High Entropy String |
| `ENCRYPTION_KEY` | 32-byte hex string for AES encryption | Never Expose |
| `DATABASE_URL` | PostgreSQL connection string | SSL Enforced |
| `RAZORPAY_KEY_SECRET` | Razorpay API Secret | Server-side only |
| `CLOUDINARY_API_SECRET`| Cloudinary Secret | Server-side only |
| `RESEND_API_KEY` | Email provider secret | Server-side only |

## Responsible Disclosure

If you find a security vulnerability, please do not disclose it publicly. Contact our security team at `security@hampistays.com`. We will respond within 48 hours and work with you to resolve the issue.
