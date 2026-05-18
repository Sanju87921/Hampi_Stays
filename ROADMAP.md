# HampiStays — Phased Feature Roadmap

---

## 🔵 PHASE 1 — Foundation & Dual-Role Auth
> Goal: Get the auth system and role-based routing in place

### Auth System
- ✅ Role selection screen at Login/Signup: **Traveller** or **Resort Owner**
- ✅ Separate onboarding flows for each role
- ✅ Role-based routing (each role gets their own dashboard/home)
- ✅ JWT / session-based authentication
- ✅ Forgot password & reset flow
- [ ] Google OAuth login
- ✅ Form validation (Login & Register)
- ✅ Protected routes (redirect if not logged in)

---

## 🟠 PHASE 2 — Traveller: Search & Discovery
> Goal: Travellers can browse and find resorts

- ✅ Functional search bar (location, dates, guests)
- ✅ Date picker (check-in / check-out calendar)
- ✅ Guest counter (adults + children)
- ✅ Resort listing page with filters (price range, amenities, rating, type)
- ✅ Sort by: Price, Rating, Popularity, Newest
- ✅ Map view of resorts (Leaflet.js)
- ✅ Resort detail page (photo gallery, description, amenities, policies)
- ✅ Real-time availability check
- ✅ Compare resorts side-by-side (2–3 properties)
- ✅ Nearby attractions guide (Hampi heritage sites, temples, etc.)


---

## 🟢 PHASE 3 — Traveller: Booking Flow & Payments (100% Complete)
> Goal: Travellers can complete a full booking with payment

- ✅ Select room type & quantity
- ✅ Special requests at booking (dietary needs, anniversary setup, early check-in, airport pickup)
- ✅ Group booking support (multiple rooms in one booking)
- ✅ Booking summary (dates, guests, price breakdown, taxes)
- ✅ Multi-currency display (INR + USD)
- ✅ Travel insurance option at checkout
- ✅ Payment integration (Razorpay / Stripe UI)
- ✅ Booking confirmation page
- ✅ Booking confirmation email notification (simulated)
- ✅ Cancel or modify booking
- ✅ Booking history (upcoming, completed, cancelled)
- ✅ Auto-generated PDF receipt / invoice

---

## 🟢 PHASE 4 — Traveller: Dashboard & Profile (100% Complete)
> Goal: Travellers have a personal space to manage their trips

- ✅ Traveller dashboard (upcoming trips, recent activity)
- ✅ Past trips & downloadable invoices
- ✅ Saved / wishlist resorts (❤️)
- ✅ Profile management (name, photo, phone, address)
- ✅ Loyalty points / rewards tracker
- ✅ Referral program (refer a friend & earn rewards)
- ✅ Notifications center (booking confirmed, check-in reminder, offers)
- ✅ Write a review after checkout (1–5 stars)
- ✅ View all reviews for a property
- ✅ Share resort / trip on social media

---

## 🟢 PHASE 5 — Resort Owner: Onboarding & Property Setup (100% Complete)
> Goal: Resort owners can register and set up their property

- ✅ Resort registration (Premium 7-step comprehensive wizard)
- ✅ Upload photos / gallery (Multi-image management)
- ✅ Add amenities (pool, spa, wifi, etc.)
- ✅ Set house rules & check-in / check-out policies
- ✅ Add multiple room types (Integrated into onboarding flow)
- ✅ Add meal / food package add-ons
- ✅ Admin verification / approval logic (PENDING status system)
- ✅ Manage multiple properties (Multi-resort dashboard support)
- ✅ Document upload simulation (ID proof, GST, ownership proof)

---

## 🟠 PHASE 6 — Resort Owner: Availability & Pricing Management
> Goal: Resort owners can manage rooms, pricing, and calendar

- ✅ Set seasonal pricing (peak season, weekends, holidays)
- ✅ Mark rooms as available / unavailable
- ✅ Block specific dates (maintenance, personal use)
- ✅ Set minimum / maximum stay nights
- ✅ Create discount codes (% off or flat off)
- ✅ Set early-bird or last-minute deals
- ✅ Google Calendar sync for availability (Simulated)
- ✅ Real-time availability reflected for travellers

---

## 🟡 PHASE 7 — Resort Owner: Booking & Guest Management
> Goal: Resort owners can manage all bookings and guests efficiently

- [ ] Booking inbox (new, confirmed, cancelled)
- [ ] Accept or reject booking requests (manual approval mode)
- [ ] Guest details per booking (name, contact, guest count, special requests)
- [ ] Check-in & check-out tracker
- [ ] Digital check-in via QR code (guest scans on arrival)
- [ ] In-app messaging with guests
- [ ] Auto-send review request email after guest checks out
- [ ] GST-compliant auto invoice generation per booking

---

## 🟢 PHASE 8 — Resort Owner: Dashboard & Analytics
> Goal: Resort owners get full visibility into performance

- [ ] Total bookings (today, this week, this month)
- [ ] Revenue overview (daily, weekly, monthly charts)
- [ ] Occupancy rate tracker (% of rooms booked)
- [ ] Most booked room types
- [ ] Upcoming check-ins & check-outs calendar view
- [ ] Cancellation rate & refund history
- [ ] Revenue breakdown by room type
- [ ] Payout / bank account settings
- [ ] View and reply to guest reviews
- [ ] Flag / report inappropriate reviews

---

## 🔵 PHASE 9 — Resort Owner: Staff & Operations
> Goal: Resort owners can manage their team and operations

- [ ] Staff management (add receptionist / manager accounts with limited access)
- [ ] Role-based staff permissions (who can see what)
- [ ] Housekeeping task tracker (room ready, cleaning in progress, etc.)
- [ ] Notifications: new booking, cancellation, guest message, low occupancy warning, review posted

---

## 🟠 PHASE 10 — Advanced Traveller Features
> Goal: Make the traveller experience premium and unique to Hampi

- [ ] AI-powered resort recommendations (based on preferences & past bookings)
- [ ] Trip / Itinerary planner (plan stay + Hampi sightseeing together)
- [ ] Local transport booking (auto-rickshaw, coracle boat rides)
- [ ] PWA / Offline support (access booking details without network)
- [ ] In-app chat with resort owner
- [ ] Push notifications (web)
- [ ] Live chat / AI chatbot for traveller support

---

## 🟡 PHASE 11 — Platform, SEO & Growth
> Goal: Grow the platform and make it discoverable

- [ ] Blog / Hampi Travel Guide section (SEO: "best time to visit", "top temples", etc.)
- [ ] Newsletter subscription
- [ ] Admin panel (approve/reject resort listings, manage users)
- [ ] Platform-wide analytics dashboard
- [ ] SEO-friendly resort pages (meta tags, structured data)
- [ ] Accessibility compliance (WCAG standards)
- [ ] Featured listing boost (resort owners can promote their property)
- [ ] Commission / revenue model configuration
- [ ] Dark mode support

---

## 🔴 PHASE 12 — Super Admin / Developer Dashboard *(Hidden Route)*
> Goal: You (the developer) get full visibility into the entire platform — secret, protected, only accessible to you

### 🔐 Access & Security
- [ ] Hidden route `/admin-x7k` (not linked anywhere publicly)
- [ ] Separate hardcoded super admin credentials (not part of regular auth)
- [ ] Auto-logout after inactivity
- [ ] IP whitelisting (optional — restrict access to your IP only)

### 👥 User Analytics
- [ ] Total registered travellers (all-time + this month)
- [ ] New signups chart (daily / weekly / monthly)
- [ ] Active vs inactive users
- [ ] User growth trend over time
- [ ] Top locations travellers book from

### 🏨 Resort Analytics
- [ ] Total resorts registered on platform
- [ ] Pending approval resorts (awaiting your review)
- [ ] Active / live resorts count
- [ ] Resorts by category / location breakdown
- [ ] Newest resorts joined
- [ ] Approve or reject resort listings directly from dashboard

### 📊 Booking Analytics
- [ ] Total bookings across the platform (all-time)
- [ ] Bookings per day / week / month (line/bar chart)
- [ ] Most booked resorts (leaderboard)
- [ ] Peak booking seasons / months
- [ ] Cancellation rate & reasons
- [ ] Average booking value

### 💰 Revenue & Finance
- [ ] Total platform revenue (if commission model is added later)
- [ ] Commission earned per booking
- [ ] Pending payouts to resort owners
- [ ] Transaction history log
- [ ] Revenue trend chart (monthly)

### 🚩 Platform Health
- [ ] Total reviews posted on platform
- [ ] Flagged / reported reviews to moderate
- [ ] Disputes or refund requests
- [ ] Average platform-wide rating
- [ ] Remove or hide inappropriate reviews

### ⚙️ Admin Controls
- [ ] Ban or suspend user accounts (traveller or resort owner)
- [ ] Verify / unverify resort listings
- [ ] Send platform-wide announcements or notifications
- [ ] View all active sessions (who is logged in right now)

### 🔄 Data Refresh
- [ ] Real-time data with auto-refresh every 30 seconds (WebSocket or polling)
- [ ] Manual refresh button for instant update
- [ ] Last updated timestamp shown on each widget

---

## 💰 Commission Model
> Paid by the Resort Owner per confirmed booking. Travellers are NOT charged any extra fee.

### Tiered Commission Structure
| Tier | Rate | When Applied |
|------|------|---------------|
| **Standard** | 7% | All regular bookings |
| **Featured Listing** | 10% | Resort opts in for top search placement |
| **Peak Season** | 10% | Auto-applied Oct – Feb (Hampi tourist rush) |

### How It Works
- [ ] Commission is auto-calculated at checkout on the booking subtotal
- [ ] Razorpay / Stripe splits the payment: resort gets their share, platform fee is held separately
- [ ] Resort owner sees commission deducted clearly in their payout summary
- [ ] Admin dashboard shows total commission earned per booking / per month
- [ ] Payouts to resort owners are processed after guest check-in (not before) — protects against fraud

### Example
> ₹2,000/night × 2 nights = ₹4,000 booking
> - **7% Standard** → You earn ₹280, Resort gets ₹3,720
> - **10% Featured** → You earn ₹400, Resort gets ₹3,600

---

## 🔐 Security & Architecture Standards
> Every line of code must follow these non-negotiable standards

### Authentication & Authorization
- [ ] JWT tokens with short expiry (15 min access token + 7 day refresh token)
- [ ] Refresh token rotation (invalidate old token on every refresh)
- [ ] Role-based access control (RBAC) — Traveller / Resort Owner / Super Admin
- [ ] Super Admin route protected by both credentials + secret route URL
- [ ] All protected routes verified server-side (never trust frontend-only auth)
- [ ] Rate limiting on all auth endpoints (prevent brute force attacks)
- [ ] Account lockout after 5 failed login attempts

### Data Encryption
- [ ] End-to-end HTTPS (TLS 1.3) — all data in transit is encrypted
- [ ] Passwords hashed with bcrypt (salt rounds: 12)
- [ ] Sensitive data (payment info, personal details) encrypted at rest (AES-256)
- [ ] Payment card data NEVER stored — handled entirely by Razorpay/Stripe (PCI-DSS compliant)
- [ ] Environment variables for all secrets (never hardcoded)

### API Security
- [ ] Input validation & sanitization on all API endpoints (prevent SQL injection, XSS)
- [ ] CORS restricted to allowed origins only
- [ ] Helmet.js (or equivalent) for HTTP security headers
- [ ] API rate limiting per user/IP
- [ ] Request payload size limits
- [ ] All API responses sanitized (never expose internal errors to client)

### Payment Security
- [ ] Razorpay / Stripe webhook signature verification
- [ ] Idempotency keys on all payment requests (prevent duplicate charges)
- [ ] Server-side price calculation only (never trust client-sent price)
- [ ] Commission auto-deducted server-side before payout
- [ ] All transactions logged with full audit trail

### Infrastructure & Code Quality
- [ ] TypeScript strict mode enabled everywhere (no `any` types)
- [ ] ESLint + Prettier enforced on all code
- [ ] Unit tests for all business logic (booking, commission calc, auth)
- [ ] Integration tests for all API endpoints
- [ ] Error boundaries on frontend (no raw crashes)
- [ ] Graceful error handling — meaningful messages, never stack traces to client
- [ ] Database queries use parameterized statements (prevent SQL injection)
- [ ] Regular dependency audits (`npm audit`) to catch vulnerable packages
- [ ] Git secrets scanning (prevent API keys being pushed to GitHub)

### Scalability & Future-Proofing
- [ ] Backend built as RESTful API (can add mobile app later without changes)
- [ ] Database schema versioned with migrations (never alter tables manually)
- [ ] Feature flags for rolling out new features safely
- [ ] Logging & monitoring (track errors in production — Sentry / LogRocket)
- [ ] Horizontal scaling ready (stateless backend, no in-memory sessions)

---

## 📊 Phase Summary

| Phase | Focus | Role |
|-------|-------|------|
| Phase 1 | Auth & Dual Role System | Both |
| Phase 2 | Search & Discovery | Traveller |
| Phase 3 | Booking Flow & Payments | Traveller |
| Phase 4 | Dashboard & Profile | Traveller |
| Phase 5 | Property Setup & Onboarding | Resort Owner |
| Phase 6 | Availability & Pricing | Resort Owner |
| Phase 7 | Booking & Guest Management | Resort Owner |
| Phase 8 | Analytics Dashboard | Resort Owner |
| Phase 9 | Staff & Operations | Resort Owner |
| Phase 10 | Advanced Traveller Features | Traveller |
| Phase 11 | Platform, SEO & Growth | Platform |
| Phase 12 | Super Admin / Developer Dashboard *(Hidden)* | Admin (You) |

### Platform Standards (Non-Negotiable)
| Standard | Requirement |
|----------|-------------|
| Commission | 7% Standard / 10% Featured & Peak Season |
| Auth | JWT + Refresh Token Rotation + RBAC |
| Encryption | TLS 1.3 in transit + AES-256 at rest |
| Passwords | bcrypt (12 salt rounds) |
| Payments | Razorpay/Stripe — PCI-DSS compliant, server-side only |
| Code | TypeScript strict, ESLint, unit + integration tests |
| Security | Rate limiting, input sanitization, CORS, Helmet.js |

---

> ✅ **Phase 1 Complete.** Foundation & Dual Role Auth.
> ✅ **Phase 2 Complete.** Search & Discovery fully implemented.
> ✅ **Phase 3 Complete.** Booking Flow & Payments.
> ✅ **Phase 4 Complete.** Dashboard & Profile.
> ✅ **Phase 5 Complete.** Property Setup & Onboarding.
> ✅ **Phase 6 Complete.** Availability & Pricing Management — Seasonal rates, blockings, min nights, and dynamic traveller pricing are live.
> 🔜 **Phase 7 Next.** Booking & Guest Management.

---

## 💎 PHASE 13 — Local Experiences & Expert Network
> Goal: Connect travellers with Hampi's local expertise (Guides, Bouldering, Coracle)

### 🏺 Guide Expert Network
- [ ] New Role: **Local Guide** (Architecture, History, Nature)
- [ ] Guide Registration & Profile (specialty, languages, day rates, certifications)
- [ ] Guide Marketplace (browse guides by expertise and reviews)
- [ ] Post-booking notification for travellers (nudge to hire a guide)
- [ ] Guide Booking system (integrated with trip dates)
- [ ] Secure payment split (Guide payout - platform fee)
- [ ] Verified Badge for official Archaeological Survey of India (ASI) guides

### 🚣 Activities & Adventures
- [ ] Coracle Boat ride bookings (Riverside experiences)
- [ ] Bouldering & Trekking expert connects
- [ ] Evening Ritual Tours (Sunset at Hemakuta Hill)

