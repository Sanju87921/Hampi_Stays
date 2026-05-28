import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../ui/Button";
import { Link } from "react-router-dom";

const images = [
  "/images/hampi-3.png",
  "/images/hampi-1.png",
  "/images/hampi-4.png",
  "/images/hampi-6.png",
];

export function CTASection() {
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % images.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-32 md:py-48 relative overflow-hidden bg-navy-950">
      {/* Dynamic Background Slideshow */}
      <AnimatePresence mode="wait">
        <motion.div
          key={images[currentIdx]}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="absolute inset-0 bg-cover bg-center bg-fixed"
          style={{
            backgroundImage: `url('${images[currentIdx]}')`,
          }}
        />
      </AnimatePresence>
      
      {/* Dark overlay for the background */}
      <div className="absolute inset-0 bg-navy-950/70 backdrop-blur-[2px]" />

      <div className="container mx-auto px-4 md:px-6 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl mx-auto rounded-2xl shadow-luxury overflow-hidden relative group p-12 md:p-20 bg-navy-950/40 backdrop-blur-md border border-white/10"
        >
          {/* Content */}
          <div className="relative z-10">
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-gold-500 font-semibold tracking-[0.2em] uppercase text-sm mb-6 block"
            >
              Your Journey Awaits
            </motion.span>
            <h2 className="text-4xl md:text-6xl font-serif font-bold text-white mb-8 leading-tight">
              Begin Your Royal Retreat
            </h2>
            <p className="text-sand-100/60 mb-12 text-lg max-w-2xl mx-auto">
              Join our exclusive membership for early access to seasonal packages and bespoke experiences tailored perfectly for your desires.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link to="/resorts" className="w-full sm:w-auto">
                <Button size="lg" className="w-full bg-gold-500 hover:bg-gold-400 text-navy-950 dark:text-white border-none shadow-gold hover:-translate-y-1 transition-all duration-500 rounded-full px-10 h-14 text-lg font-bold">
                  Explore Packages
                </Button>
              </Link>
              <Link to="/contact" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full border-white/20 text-white hover:bg-white dark:bg-zinc-900/10 hover:border-gold-400/40 transition-all duration-500 rounded-full px-10 h-14 text-lg font-bold">
                  Contact Concierge
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
