# Vercel + Railway Deployment Checklist for HampiStays

Follow these steps to deploy your hardened, enterprise-grade architecture.

## Phase 1: Railway (Backend & Database)

### 1. Database Setup
- [ ] Create a **PostgreSQL** service in Railway.
- [ ] Ensure `DATABASE_URL` is automatically added to your server service.

### 2. Environment Variables (Railway Dashboard)
Add these to your Backend service:
- [ ] `NODE_ENV`: `production`
- [ ] `JWT_SECRET`: A long, random string.
- [ ] `ENCRYPTION_KEY`: A 32-byte hex string.
  - *Generate*: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- [ ] `FRONTEND_URL`: `https://your-hampistays-frontend.vercel.app` (The URL Vercel gives you).
- [ ] `RAZORPAY_KEY_ID`: Your Razorpay Key ID.
- [ ] `RAZORPAY_KEY_SECRET`: Your Razorpay Secret.
- [ ] `CLOUDINARY_CLOUD_NAME`: Your Cloudinary Cloud Name.
- [ ] `CLOUDINARY_API_KEY`: Your Cloudinary API Key.
- [ ] `CLOUDINARY_API_SECRET`: Your Cloudinary Secret.

### 3. Build & Deploy
- [ ] Root Directory: `./` (or `hampi-stay-ui` if your Railway project points to the root).
- [ ] Build Command: `npx prisma generate && npx prisma migrate deploy`
- [ ] Start Command: `node server/index.js`

---

## Phase 2: Vercel (Frontend)

### 1. Import Project
- [ ] Connect your GitHub repo to Vercel.
- [ ] Root Directory: `hampi-stay-ui`

### 2. Environment Variables (Vercel Dashboard)
- [ ] `VITE_API_URL`: `https://your-hampistays-backend.up.railway.app` (The URL Railway gives you).
- [ ] `VITE_GOOGLE_CLIENT_ID`: Your Google Auth Client ID.
- [ ] `VITE_RAZORPAY_KEY_ID`: Your Razorpay Key ID (Client-side).

### 3. Framework Settings
- [ ] Framework Preset: `Vite`
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `dist`

---

## Phase 3: Final Integration Testing

- [ ] **Auth Check**: Attempt to register and login. Verify JWT is sent in headers.
- [ ] **CORS Check**: Ensure no "Cross-Origin" errors appear in the browser console.
- [ ] **Payments Check**: Create a test booking. Ensure the Razorpay modal opens and the payment verifies successfully on the backend.
- [ ] **Image Upload**: Upload a profile picture. Verify it is stored in Cloudinary and the URL is saved in the database.
- [ ] **Encryption Check**: (Advanced) Check your Railway PostgreSQL table directly; fields like `phone` should look like `iv:tag:hash`.
