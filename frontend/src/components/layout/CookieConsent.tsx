import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X, ShieldCheck, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem("hampistays-cookie-consent");
    if (!consent) {
      // Delay showing the banner for better UX
      const timer = setTimeout(() => setIsVisible(true), 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("hampistays-cookie-consent", "accepted");
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem("hampistays-cookie-consent", "declined");
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:max-w-md z-[9999]"
        >
          <div className="bg-white  backdrop-blur-2xl border border-sand-200  shadow-2xl rounded-[2.5rem] p-8 overflow-hidden relative group">
            {/* Subtle background glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gold-200/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
            
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gold-50 flex items-center justify-center border border-gold-100 shadow-sm">
                    <Cookie className="w-6 h-6 text-gold-600" />
                  </div>
                  <div>
                    <h4 className="text-navy-950  font-bold text-lg leading-tight">Cookie Settings</h4>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gold-600">Privacy & Transparency</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsVisible(false)}
                  className="p-2 hover:bg-sand-100 :bg-zinc-700 rounded-full transition-colors text-navy-950   hover:text-navy-950 "
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-sm text-navy-950  leading-relaxed mb-8">
                We use cookies to personalize your experience, analyze our traffic, and show you the best of Hampi. 
                By clicking "Accept All", you agree to our use of cookies as described in our 
                <Link to="/cookies" className="text-gold-600 font-bold hover:underline mx-1">Policy</Link>.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleAccept}
                  className="flex-grow bg-navy-950 text-white px-6 py-4 rounded-2xl font-bold text-sm hover:bg-gold-500 hover:text-navy-950  transition-all shadow-lg hover:shadow-gold/20 flex items-center justify-center gap-2"
                >
                  Accept All
                  <ShieldCheck className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDecline}
                  className="flex-grow bg-sand-50  text-navy-950  border border-sand-200  px-6 py-4 rounded-2xl font-bold text-sm hover:bg-sand-100 :bg-zinc-700 transition-all flex items-center justify-center gap-2"
                >
                  Essential Only
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-sand-100  flex items-center justify-between">
                <Link 
                  to="/privacy" 
                  className="text-[10px] font-bold uppercase tracking-widest text-navy-950   hover:text-gold-600 transition-colors flex items-center gap-1 group"
                >
                  Privacy Policy <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <span className="text-[10px] font-bold text-navy-950  ">v2.4.0</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
