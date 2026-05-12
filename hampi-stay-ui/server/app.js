import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Middleware
import { securityHeaders, globalLimiter, sanitizeRequest } from './middleware/security.js';
import { errorHandler } from './middleware/errorHandler.js';

// Routes
import authRoutes from './routes/authRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import resortRoutes from './routes/resortRoutes.js';
import userRoutes from './routes/userRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import heritageRoutes from './routes/heritageRoutes.js';
import experienceRoutes from './routes/experienceRoutes.js';


import uploadRoutes from './routes/uploadRoutes.js';



// (Other routes would be imported here)

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Security First - Headers & Rate Limiting
app.use(securityHeaders);
app.use('/api', globalLimiter);

// 2. Body Parsers & Sanitization
app.use(express.json({ limit: '10mb' })); // Reduced limit for safety
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(sanitizeRequest);

// 3. CORS Configuration
const frontendUrl = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, '') : null;
const allowedOrigins = [
  frontendUrl,
  'http://localhost:5173',
  'http://localhost:5000'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 4. API Routes
app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/resorts', resortRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/heritage', heritageRoutes);
app.use('/api/experiences', experienceRoutes);


app.use('/api/upload', uploadRoutes);




// Global Data Routes
import * as resortController from './controllers/resortController.js';

app.get('/api/stats', resortController.getStats);
app.get('/api/settings', (req, res) => res.json({ 
  guideServiceEnabled: true,
  maintenanceMode: false,
  siteName: "HampiStays"
}));

// Health Check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Static Files (Production)
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Fallback for SPA (Catch-all middleware)
app.use((req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(distPath, 'index.html'));
  } else {
    res.status(404).json({ error: 'API endpoint not found' });
  }
});

// 5. Centralized Error Handling (Must be last)
app.use(errorHandler);

export default app;
