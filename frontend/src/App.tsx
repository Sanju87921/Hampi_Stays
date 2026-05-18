import React, { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Outlet, useLocation, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "./components/layout/Navbar";
import { Footer } from "./components/layout/Footer";
import { MobileDock } from "./components/layout/MobileDock";
import { CookieConsent } from "./components/layout/CookieConsent";

// Lazy Loaded Public Pages
const LandingPage = lazy(() => import("./pages/public/LandingPage").then(m => ({ default: m.LandingPage })));
const ResortsPage = lazy(() => import("./pages/public/ResortsPage").then(m => ({ default: m.ResortsPage })));
const ResortDetailPage = lazy(() => import("./pages/public/ResortDetailPage").then(m => ({ default: m.ResortDetailPage })));
const ResortComparePage = lazy(() => import("./pages/public/ResortComparePage").then(m => ({ default: m.ResortComparePage })));
const GalleryPage = lazy(() => import("./pages/public/GalleryPage").then(m => ({ default: m.GalleryPage })));
const DiscoveryPage = lazy(() => import("./pages/public/DiscoveryPage").then(m => ({ default: m.DiscoveryPage })));
const ContactPage = lazy(() => import("./pages/public/ContactPage").then(m => ({ default: m.ContactPage })));
const TermsOfServicePage = lazy(() => import("./pages/public/TermsOfServicePage").then(m => ({ default: m.TermsOfServicePage })));
const PrivacyPolicyPage = lazy(() => import("./pages/public/PrivacyPolicyPage").then(m => ({ default: m.PrivacyPolicyPage })));
const CookiesPage = lazy(() => import("./pages/public/CookiesPage").then(m => ({ default: m.CookiesPage })));
const NotFoundPage = lazy(() => import("./pages/public/NotFoundPage").then(m => ({ default: m.NotFoundPage })));

// Lazy Loaded Auth Pages
const LoginPage = lazy(() => import("./pages/auth/LoginPage").then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import("./pages/auth/RegisterPage").then(m => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import("./pages/auth/ForgotPasswordPage").then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import("./pages/auth/ResetPasswordPage").then(m => ({ default: m.ResetPasswordPage })));

// Lazy Loaded Role-based Pages
const CheckoutPage = lazy(() => import("./pages/traveler/CheckoutPage").then(m => ({ default: m.CheckoutPage })));
const CheckoutSuccessPage = lazy(() => import("./pages/traveler/CheckoutSuccessPage").then(m => ({ default: m.CheckoutSuccessPage })));
const BookingConfirmationPage = lazy(() => import("./pages/traveler/BookingConfirmationPage").then(m => ({ default: m.BookingConfirmationPage })));
const BookingsPage = lazy(() => import("./pages/traveler/BookingsPage").then(m => ({ default: m.BookingsPage })));
const WishlistPage = lazy(() => import("./pages/traveler/WishlistPage").then(m => ({ default: m.WishlistPage })));
const ProfilePage = lazy(() => import("./pages/traveler/ProfilePage").then(m => ({ default: m.ProfilePage })));
const NotificationsPage = lazy(() => import("./pages/traveler/NotificationsPage").then(m => ({ default: m.NotificationsPage })));
const DashboardSelector = lazy(() => import("./components/shared/DashboardSelector").then(m => ({ default: m.DashboardSelector })));
const ResortSetupPage = lazy(() => import("./pages/owner/ResortSetupPage").then(m => ({ default: m.ResortSetupPage })));

import { ScrollToTop } from "./components/shared/ScrollToTop";
import { AuthModal } from "./components/auth/AuthModal";

import { useAuth } from "./context/AuthContext";
import { useSystem } from "./context/SystemContext";

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-sand-50">
    <motion.div
      animate={{ scale: [1, 1.1, 1], opacity: [0.3, 1, 0.3] }}
      transition={{ duration: 2, repeat: Infinity }}
      className="flex flex-col items-center"
    >
      <img 
        src="/logo.png" 
        alt="Loading" 
        onError={(e) => (e.currentTarget.src = "/favicon.svg")}
        className="h-12 w-auto opacity-20 grayscale mb-4" 
      />
      <div className="w-48 h-0.5 bg-sand-200 overflow-hidden rounded-full">
        <motion.div
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-1/2 h-full bg-gold-500"
        />
      </div>
    </motion.div>
  </div>
);

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-sand-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/pattern.png')] opacity-[0.03] pointer-events-none" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative flex flex-col items-center"
        >
          <img 
            src="/logo.png" 
            alt="HampiStays" 
            onError={(e) => (e.currentTarget.src = "/favicon.svg")}
            className="h-20 w-auto object-contain mb-8 opacity-20 grayscale" 
          />
          <motion.div 
            animate={{ 
              rotate: 360,
              borderColor: ["rgba(197, 160, 89, 0.2)", "rgba(197, 160, 89, 1)", "rgba(197, 160, 89, 0.2)"]
            }} 
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            className="w-12 h-12 border-2 border-gold-500/20 border-t-gold-500 rounded-full"
          />
          <p className="mt-6 text-[10px] font-black uppercase tracking-[0.3em] text-navy-950/40">Secure Session</p>
        </motion.div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login?message=Premium Access Required" replace />;
};

// Layout with Navbar and Footer
const MainLayout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
      <MobileDock />
    </div>
  );
};

// Auth Layout (Minimalist footer for auth flow)
const AuthLayout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <Suspense fallback={<LoadingFallback />}>
          <Routes location={location}>
            {/* Auth Routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
            </Route>

            {/* Main Routes (with Navbar + Footer) */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/resorts" element={<ResortsPage />} />
              <Route path="/resorts/compare" element={<ResortComparePage />} />
              <Route path="/resorts/:slug" element={<ResortDetailPage />} />
              <Route
                path="/checkout"
                element={
                  <ProtectedRoute>
                    <CheckoutPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/checkout/success"
                element={
                  <ProtectedRoute>
                    <CheckoutSuccessPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/booking-confirmation"
                element={
                  <ProtectedRoute>
                    <BookingConfirmationPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/*"
                element={
                  <ProtectedRoute>
                    <DashboardSelector />
                  </ProtectedRoute>
                }
              />
              <Route path="/dashboard/bookings" element={<ProtectedRoute><BookingsPage /></ProtectedRoute>} />
              <Route path="/dashboard/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
              <Route path="/dashboard/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
              <Route path="/dashboard/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route
                path="/dashboard/resort-setup"
                element={
                  <ProtectedRoute>
                    <ResortSetupPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/discovery" element={<DiscoveryPage />} />
              <Route path="/gallery" element={<GalleryPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/terms" element={<TermsOfServicePage />} />
              <Route path="/privacy" element={<PrivacyPolicyPage />} />
              <Route path="/cookies" element={<CookiesPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}

import { Toaster } from "react-hot-toast";

function App() {
  return (
    <Router>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 5000,
          style: {
            background: 'rgba(10, 17, 40, 0.95)', // Luxury Navy with slight transparency
            backdropFilter: 'blur(16px)',
            color: '#F5F1E9',      // Sand White
            borderRadius: '1.25rem',
            border: '1px solid rgba(197, 160, 89, 0.3)', // Subtle Gold border
            padding: '12px 20px',
            fontSize: '13px',
            fontWeight: '600',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            fontFamily: 'Outfit, sans-serif',
            letterSpacing: '0.02em',
          },
          success: {
            iconTheme: {
              primary: '#C5A059', // Gold
              secondary: '#0A1128',
            },
            style: {
              border: '1px solid rgba(197, 160, 89, 0.5)',
            }
          },
          error: {
            iconTheme: {
              primary: '#EF4444', 
              secondary: '#FFFFFF',
            },
            style: {
              border: '1px solid rgba(239, 68, 68, 0.4)',
            }
          }
        }}
      />
      <ScrollToTop />
      <AnimatedRoutes />
      <AuthModal />
      <CookieConsent />
    </Router>
  );
}

export default App;
