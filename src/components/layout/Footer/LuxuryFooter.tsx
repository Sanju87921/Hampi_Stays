import { useState } from "react";
import { Link } from "react-router-dom";
import { Globe, Share2, MessageCircle, ArrowRight, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function LuxuryFooter() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubscribed(true);
    // Add logic to save email here later
  };

  return (
    <footer className="bg-sand-50 border-t border-sand-200 pt-32 pb-16 overflow-hidden relative">
      {/* Cinematic subtle glow */}
      <div className="absolute top-0 left-1/4 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        {/* Top Area: Brand & Newsletter */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center mb-24">
          <div className="lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left">
            <Link to="/" className="inline-block mb-10 group">
              <img 
                src="/logo.png" 
                alt="HampiStays" 
                onError={(e) => (e.currentTarget.src = "/favicon.svg")}
                className="h-44 md:h-40 w-auto object-contain transition-transform duration-700 group-hover:scale-105" 
              />
            </Link>
            <p className="text-navy-950/70 text-lg md:text-xl font-serif italic leading-relaxed max-w-md mx-auto lg:mx-0">
              "Where the whispers of history meet the embrace of modern luxury. Experience Hampi through a different lens."
            </p>
          </div>

          <div className="lg:col-span-7 flex justify-end w-full">
            <div className="w-full max-w-xl bg-white p-10 rounded-[3rem] shadow-luxury border border-sand-100 relative overflow-hidden group min-h-[220px] flex flex-col justify-center">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gold-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
              
              <AnimatePresence mode="wait">
                {!isSubscribed ? (
                  <motion.div 
                    key="form"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="relative z-10"
                  >
                    <h4 className="text-[11px] font-bold uppercase tracking-[0.3em] text-gold-600 mb-2">The Exclusive Newsletter</h4>
                    <h3 className="text-2xl font-serif font-bold text-navy-950 mb-6">Receive Rare Narratives</h3>
                    <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
                      <input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com" 
                        className="flex-grow bg-sand-50 border border-sand-200 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 transition-all"
                      />
                      <button type="submit" className="bg-navy-950 text-white px-10 py-4 rounded-2xl font-bold text-sm hover:bg-gold-500 hover:text-navy-950 transition-all shadow-lg hover:shadow-gold/20 flex items-center justify-center gap-2">
                        Subscribe
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </form>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative z-10 text-center py-4"
                  >
                    <div className="w-16 h-16 bg-gold-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="w-8 h-8 text-gold-600" />
                    </div>
                    <h3 className="text-2xl font-serif font-bold text-navy-950 mb-2">Welcome to the Inner Circle</h3>
                    <p className="text-navy-950/40 text-sm font-medium">Rare narratives will soon find their way to you.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Middle Area: Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 lg:gap-8 mb-24 border-y border-sand-200/50 py-20">
          <div>
            <h5 className="text-[10px] font-bold uppercase tracking-[0.3em] text-navy-950/30 mb-10">Discover</h5>
            <ul className="space-y-5">
              <li><Link to="/resorts" className="text-navy-950 font-bold text-base hover:text-gold-600 transition-all flex items-center gap-2 group">
                <span className="w-0 h-px bg-gold-500 group-hover:w-4 transition-all" />
                Resorts
              </Link></li>
              <li><Link to="/gallery" className="text-navy-950 font-bold text-base hover:text-gold-600 transition-all flex items-center gap-2 group">
                <span className="w-0 h-px bg-gold-500 group-hover:w-4 transition-all" />
                Gallery
              </Link></li>
            </ul>
          </div>
          <div>
            <h5 className="text-[10px] font-bold uppercase tracking-[0.3em] text-navy-950/30 mb-10">Company</h5>
            <ul className="space-y-5">
              <li><Link to="/about" className="text-navy-950 font-bold text-base hover:text-gold-600 transition-all flex items-center gap-2 group">
                <span className="w-0 h-px bg-gold-500 group-hover:w-4 transition-all" />
                Our Story
              </Link></li>
              <li><Link to="/contact" className="text-navy-950 font-bold text-base hover:text-gold-600 transition-all flex items-center gap-2 group">
                <span className="w-0 h-px bg-gold-500 group-hover:w-4 transition-all" />
                Contact
              </Link></li>
              <li><a href="#" className="text-navy-950 font-bold text-base hover:text-gold-600 transition-all flex items-center gap-2 group">
                <span className="w-0 h-px bg-gold-500 group-hover:w-4 transition-all" />
                Careers
              </a></li>
            </ul>
          </div>
          <div>
            <h5 className="text-[10px] font-bold uppercase tracking-[0.3em] text-navy-950/30 mb-10">Legal</h5>
            <ul className="space-y-5">
              <li><Link to="/privacy" className="text-navy-950 font-bold text-base hover:text-gold-600 transition-all flex items-center gap-2 group">
                <span className="w-0 h-px bg-gold-500 group-hover:w-4 transition-all" />
                Privacy Policy
              </Link></li>
              <li><Link to="/terms" className="text-navy-950 font-bold text-base hover:text-gold-600 transition-all flex items-center gap-2 group">
                <span className="w-0 h-px bg-gold-500 group-hover:w-4 transition-all" />
                Terms
              </Link></li>
              <li><Link to="/cookies" className="text-navy-950 font-bold text-base hover:text-gold-600 transition-all flex items-center gap-2 group">
                <span className="w-0 h-px bg-gold-500 group-hover:w-4 transition-all" />
                Cookies
              </Link></li>
            </ul>
          </div>
          <div>
            <h5 className="text-[10px] font-bold uppercase tracking-[0.3em] text-navy-950/30 mb-10">Contact</h5>
            <ul className="space-y-6">
              <li className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase text-gold-600 tracking-widest">Phone</span>
                <span className="text-navy-950 font-bold text-base">+91 98765 43210</span>
              </li>
              <li className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase text-gold-600 tracking-widest">Email</span>
                <span className="text-navy-950 font-bold text-base">stay@hampistays.com</span>
              </li>
              <li className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase text-gold-600 tracking-widest">Location</span>
                <span className="text-navy-950 font-bold text-sm leading-relaxed max-w-[200px]">Heritage Route, Kamalapura, Hampi, Karnataka</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-sand-200/60 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-xs font-bold text-navy-950/40 uppercase tracking-widest">
            © {new Date().getFullYear()} HampiStays — Crafted in Hampi, India
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-navy-950/40 hover:text-gold-600 transition-colors" aria-label="Instagram">
              <Globe className="w-5 h-5" />
            </a>
            <a href="#" className="text-navy-950/40 hover:text-gold-600 transition-colors" aria-label="Twitter">
              <Share2 className="w-5 h-5" />
            </a>
            <a href="#" className="text-navy-950/40 hover:text-gold-600 transition-colors" aria-label="Facebook">
              <MessageCircle className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
