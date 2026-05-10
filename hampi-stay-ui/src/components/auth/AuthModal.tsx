import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Lock, User, Phone } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/Button";

export function AuthModal() {
  const { showAuthModal, setShowAuthModal, authModalView, login, register } = useAuth();
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
          className="absolute inset-0 bg-navy-950/60 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="relative bg-white w-full md:max-w-md rounded-t-[3rem] md:rounded-[3rem] shadow-2xl overflow-hidden pointer-events-auto"
        >
          {/* Header */}
          <div className="p-8 pb-0 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-serif font-bold text-navy-950">
                {authModalView === "login" ? "Welcome Back" : "Begin Your Journey"}
              </h2>
              <p className="text-navy-950/40 text-sm mt-1">
                {authModalView === "login" ? "Sign in to continue your booking" : "Create an account to preserve your memories"}
              </p>
            </div>
            <button 
              onClick={() => setShowAuthModal(false)}
              className="p-3 hover:bg-sand-50 rounded-2xl transition-colors"
            >
              <X className="w-6 h-6 text-navy-950/40" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-8 space-y-5">
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
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-navy-950/40 uppercase tracking-widest ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-950/20" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 rounded-2xl bg-sand-50 border border-sand-100 focus:border-gold-400 focus:ring-4 focus:ring-gold-500/5 outline-none transition-all"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-navy-950/40 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-950/20" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 rounded-2xl bg-sand-50 border border-sand-100 focus:border-gold-400 focus:ring-4 focus:ring-gold-500/5 outline-none transition-all"
                  placeholder="traveler@example.com"
                />
              </div>
            </div>

            {authModalView === "register" && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-navy-950/40 uppercase tracking-widest ml-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-950/20" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 rounded-2xl bg-sand-50 border border-sand-100 focus:border-gold-400 focus:ring-4 focus:ring-gold-500/5 outline-none transition-all"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-navy-950/40 uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-950/20" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 rounded-2xl bg-sand-50 border border-sand-100 focus:border-gold-400 focus:ring-4 focus:ring-gold-500/5 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-16 rounded-[2rem] text-lg shadow-gold"
              isLoading={isLoading}
            >
              {authModalView === "login" ? "Explore Hampi" : "Start Your Escape"}
            </Button>

            <div className="pt-4 text-center">
              <button
                type="button"
                onClick={() => setShowAuthModal(true, authModalView === "login" ? "register" : "login")}
                className="text-sm font-bold text-navy-950/40 hover:text-gold-600 transition-colors"
              >
                {authModalView === "login" ? "New to HampiStays? Create Account" : "Already have an account? Sign In"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
