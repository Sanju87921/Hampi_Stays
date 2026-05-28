import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Lock, User, Phone, Sparkles } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/Button";
import { GoogleAuthButton } from "./GoogleAuthButton";

export function AuthModal() {
  const { showAuthModal, setShowAuthModal, authModalView, login, register, loginWithGoogle, authMessage } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      if (authModalView === "login") {
        await login(email, password);
      } else {
        await register(name, email, phone, password, "TRAVELLER");
      }
      setShowAuthModal(false);
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credential: string) => {
    setIsLoading(true);
    try {
      await loginWithGoogle(credential);
      setShowAuthModal(false);
    } catch (err: any) {
      setError(err.message || "Google authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (!showAuthModal) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center p-0 md:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowAuthModal(false)}
          className="absolute inset-0 bg-navy-950/40 backdrop-blur-xl"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="relative bg-white dark:bg-zinc-900/95 backdrop-blur-md w-full md:max-w-md rounded-t-[3rem] md:rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] overflow-hidden pointer-events-auto border border-white/20"
        >
          {/* Top Handle for Mobile */}
          <div className="md:hidden flex justify-center pt-4 pb-2">
            <div className="w-12 h-1.5 bg-navy-950/10 rounded-full" />
          </div>

          {/* Header */}
          <div className="p-8 pb-4 flex items-start justify-between">
            <div className="flex-grow">
              {authMessage ? (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 inline-flex items-center gap-2 px-4 py-2 bg-gold-500/10 border border-gold-500/20 rounded-full"
                >
                  <Sparkles className="w-4 h-4 text-gold-600" />
                  <span className="text-xs font-black text-gold-700 uppercase tracking-widest">{authMessage}</span>
                </motion.div>
              ) : null}
              <h2 className="text-3xl font-serif font-bold text-navy-950 dark:text-white leading-tight">
                {authModalView === "login" ? "Welcome Back" : "Begin Your Journey"}
              </h2>
              <p className="text-navy-950 dark:text-white/40 dark:text-zinc-500 text-sm mt-2 font-medium">
                {authModalView === "login" 
                  ? "Sign in to access exclusive heritage stays" 
                  : "Join our community of mindful travelers"}
              </p>
            </div>
            <button 
              onClick={() => setShowAuthModal(false)}
              className="p-3 hover:bg-sand-50 dark:hover:bg-zinc-800 rounded-2xl transition-all duration-300 hover:rotate-90"
            >
              <X className="w-6 h-6 text-navy-950 dark:text-white/20 dark:text-zinc-700" />
            </button>
          </div>

          {/* Form Content */}
          <div className="px-8 pb-8">
            {/* Social Login Section */}
            <div className="mb-8">
              <GoogleAuthButton onSuccess={handleGoogleSuccess} isLoading={isLoading} />
              
              <div className="relative mt-8 mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-sand-200 dark:border-zinc-800" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-[0.3em] font-black text-navy-950 dark:text-white/20 dark:text-zinc-700">
                  <span className="bg-white dark:bg-zinc-900 px-4">Or continue with</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }} 
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium"
                >
                  {error}
                </motion.div>
              )}

              {authModalView === "register" && (
                <div className="group">
                  <label className="text-[10px] font-black text-navy-950 dark:text-white/40 dark:text-zinc-500 uppercase tracking-[0.2em] ml-1 mb-1.5 block">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-950 dark:text-white/20 dark:text-zinc-700 transition-colors group-focus-within:text-gold-500" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-12 pr-6 py-4 rounded-2xl bg-sand-50 dark:bg-zinc-950 border border-sand-100 dark:border-zinc-800/50 focus:border-gold-400 focus:bg-white dark:bg-zinc-900 focus:ring-4 focus:ring-gold-500/5 outline-none transition-all font-medium text-navy-950 dark:text-white"
                      placeholder="John Doe"
                    />
                  </div>
                </div>
              )}

              <div className="group">
                <label className="text-[10px] font-black text-navy-950 dark:text-white/40 dark:text-zinc-500 uppercase tracking-[0.2em] ml-1 mb-1.5 block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-950 dark:text-white/20 dark:text-zinc-700 transition-colors group-focus-within:text-gold-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 rounded-2xl bg-sand-50 dark:bg-zinc-950 border border-sand-100 dark:border-zinc-800/50 focus:border-gold-400 focus:bg-white dark:bg-zinc-900 focus:ring-4 focus:ring-gold-500/5 outline-none transition-all font-medium text-navy-950 dark:text-white"
                    placeholder="traveler@hampistays.com"
                  />
                </div>
              </div>

              {authModalView === "register" && (
                <div className="group">
                  <label className="text-[10px] font-black text-navy-950 dark:text-white/40 dark:text-zinc-500 uppercase tracking-[0.2em] ml-1 mb-1.5 block">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-950 dark:text-white/20 dark:text-zinc-700 transition-colors group-focus-within:text-gold-500" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-12 pr-6 py-4 rounded-2xl bg-sand-50 dark:bg-zinc-950 border border-sand-100 dark:border-zinc-800/50 focus:border-gold-400 focus:bg-white dark:bg-zinc-900 focus:ring-4 focus:ring-gold-500/5 outline-none transition-all font-medium text-navy-950 dark:text-white"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>
              )}

              <div className="group">
                <label className="text-[10px] font-black text-navy-950 dark:text-white/40 dark:text-zinc-500 uppercase tracking-[0.2em] ml-1 mb-1.5 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-950 dark:text-white/20 dark:text-zinc-700 transition-colors group-focus-within:text-gold-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 rounded-2xl bg-sand-50 dark:bg-zinc-950 border border-sand-100 dark:border-zinc-800/50 focus:border-gold-400 focus:bg-white dark:bg-zinc-900 focus:ring-4 focus:ring-gold-500/5 outline-none transition-all font-medium text-navy-950 dark:text-white"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full h-16 rounded-[2rem] text-lg shadow-gold border-none font-bold tracking-tight"
                  isLoading={isLoading}
                >
                  {authModalView === "login" ? "Enter the Sanctuary" : "Create Account"}
                </Button>
              </div>

              <div className="pt-6 text-center">
                <button
                  type="button"
                  onClick={() => setShowAuthModal(true, { view: authModalView === "login" ? "register" : "login", message: authMessage || undefined })}
                  className="text-xs font-black uppercase tracking-[0.2em] text-navy-950 dark:text-white/40 dark:text-zinc-500 hover:text-gold-600 transition-colors"
                >
                  {authModalView === "login" ? "New to HampiStays? Join Us" : "Already a member? Sign In"}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
