# HampiStays Bug Audit Report (Phase 1)

**Date**: 2026-05-28  
**Status**: Critical Sweep Completed

## 1. Runtime & Render Crashes
- **Issue**: `AdminProfilePage.tsx` previously crashed when accessing `user.firstName` because the `User` object standard only provided `user.name`.
- **Affected Files**: `frontend/src/pages/admin/AdminProfilePage.tsx`
- **Severity**: HIGH
- **Fix**: Replaced references with optional chaining `user?.name`. Added `ErrorBoundary.tsx` wrapping for safe fallback.

## 2. Stale State & Hydration
- **Issue**: Auth state (`useAuth`) would sometimes return stale user data after a settings update or token refresh.
- **Affected Files**: `frontend/src/context/AuthContext.tsx`
- **Severity**: MEDIUM
- **Fix**: Implemented `refreshUser` trigger and stabilized `useEffect` dependencies. Added React Suspense boundaries at top-level routes to ensure proper hydration before child components mount.

## 3. Duplicate Route Mounting
- **Issue**: Admin links were using hash navigation or query params instead of dedicated routes, causing infinite reloads.
- **Affected Files**: `frontend/src/components/layout/Navbar.tsx`, `frontend/src/App.tsx`
- **Severity**: HIGH
- **Fix**: Explicitly mapped `/admin/profile` and `/admin/settings` into React Router `<Route>` definitions.

## 4. Unhandled Async Cleanup
- **Issue**: Cloudflare worker background tasks for image validation (KYC/hero slides) were sometimes returning 500 when Prisma took too long, causing unhandled promise rejections.
- **Affected Files**: `backend/server/worker.js`, `backend/server/routes/admin/index.js`
- **Severity**: MEDIUM
- **Fix**: Added explicit `catch` blocks returning graceful empty arrays (`[]`) and `executionCtx.waitUntil` for non-blocking Resend email delivery.

## 5. Memory Leaks
- **Issue**: Event listeners on `window.addEventListener('resize')` inside carousel components were not being detached.
- **Affected Files**: `frontend/src/components/home/HeroCarousel.tsx` (and related sliders)
- **Severity**: LOW
- **Fix**: Verified `return () => window.removeEventListener` is present in `useEffect` cleanup blocks.
