# Auth Hardening Report (Phase 2)

**Date**: 2026-05-28  
**Status**: Architecture Hardened

## 1. Session Stability
- **Issue**: Previously, token refresh requests would pile up during concurrent API requests when the access token expired.
- **Resolution**: Implemented `isRefreshingRef` and a queue of failed requests in `apiClient.ts` to replay them sequentially once the refresh completes, preventing duplicate refresh storms.

## 2. Security & Session Recovery
- **Issue**: Missing backend session management allowed orphaned tokens to stay valid.
- **Resolution**:
  - **MFA Architecture**: Fully integrated TOTP (Google Authenticator) via `otplib` and `qrcode`.
  - **Graceful Unauthorized Handling**: `apiClient` now catches `401 Unauthorized` and cleanly redirects to `/login` without breaking the render tree.
  - **Logout-all-devices**: Added `/api/admin/security/reset-password` endpoint that invalidates all active sessions when a password is changed by utilizing the `AdminSession` table.

## 3. Rate Limiting & Admin Guards
- **Issue**: Admin endpoints were unprotected against brute-force attacks.
- **Resolution**: Ensured `authLimiter` and `globalLimiter` middlewares are actively enforced on all `/api/auth` and `/api/admin` routes within `worker.js`.
