import { useState, useEffect } from "react";
import { motion, useScroll, useTransform, AnimatePresence, type Variants } from "framer-motion";
import { SearchBar } from "../resort/SearchBar";
import { useAuth } from "../../context/AuthContext";
import { ShieldCheck, ArrowRight, Building2 } from "lucide-react";
import { Link } from "react-router-dom";

export function Hero() {
  const { scrollY } = useScroll();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const hampiImages = [
    "https://images.unsplash.com/photo-1548013146-72479768bbaa?auto=format&fit=crop&q=75&w=1200", // Luxury Resort Hero
    "https://images.unsplash.com/photo-1642516863984-68fdeea5ba64?auto=format&fit=crop&q=75&w=1200", // Stone Chariot
    "https://images.unsplash.com/photo-1581391528803-5eba57ac1f2d?auto=format&fit=crop&q=75&w=1200", // Virupaksha Temple
    "https://images.unsplash.com/photo-1596018382916-56d2e341d784?auto=format&fit=crop&q=75&w=1200", // Hampi Boulders View
    "https://images.unsplash.com/photo-1600100397608-f010e423b971?auto=format&fit=crop&q=75&w=1200", // Lotus Mahal
    "https://images.unsplash.com/photo-1600100397608-f010e423b971?auto=format&fit=crop&q=75&w=1200", // Duplicate placeholder for variety
    "https://images.unsplash.com/photo-1548013146-72479768bbaa?auto=format&fit=crop&q=75&w=1200"  // Twilight view
  ];

  const imageLabels = [
    "The Sacred Virupaksha Temple",
    "The Sacred Stone Chariot",
    "Virupaksha Temple Gateway",
    "Ancient Granite Boulders",
    "The Royal Lotus Mahal",
    "Anjanadri Hill — Hanuman's Birthplace",
    "Tungabhadra River Twilight"
  ];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % hampiImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.2 } },
  };

  const textVariant: Variants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
  };

  return (
    <div className="relative min-h-[100svh] flex items-center justify-center bg-navy-950 z-30">
      {/* Background Elements Container - clipped to prevent overflow */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <motion.div
          style={{ y: useTransform(scrollY, [0, 1000], [0, 150]) }}
          className="absolute inset-0 w-full h-[120%] -top-[10%]"
        >
          <AnimatePresence>
            <motion.img 
              key={currentImageIndex}
              src={hampiImages[currentImageIndex]} 
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 0.85, scale: 1.05 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
              alt={imageLabels[currentImageIndex]}
              className="absolute inset-0 w-full h-full object-cover"
              loading="eager"
            />
          </AnimatePresence>
          
          {/* Location Label overlay */}
          <div className="absolute bottom-1/4 right-8 z-20 hidden md:block">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentImageIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col items-end"
              >
                <span className="text-[10px] font-bold text-gold-400 uppercase tracking-[0.3em] mb-1">Discover</span>
                <span className="text-white/80 text-sm font-serif italic tracking-wide">{imageLabels[currentImageIndex]}</span>
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-navy-950/60 via-navy-950/20 to-transparent" />
        </motion.div>

        {/* Middle Layer: Floating Architectural Sketches (Custom 3D elements) */}
        <motion.div 
          style={{ y: useTransform(scrollY, [0, 1000], [0, -100]) }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="absolute top-[20%] left-[10%] w-64 h-64 border border-gold-500/10 rounded-full blur-sm animate-float-slow" />
          <div className="absolute bottom-[30%] right-[15%] w-48 h-48 border border-sunset-500/10 rounded-full blur-sm animate-float" />
        </motion.div>

        {/* Floating Ambient Orbs — warm gold tones */}
        <div className="absolute top-1/4 left-1/4 w-48 h-48 sm:w-72 sm:h-72 md:w-96 md:h-96 bg-gold-400/5 rounded-full blur-[120px] animate-float pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 sm:w-96 sm:h-96 md:w-[500px] md:h-[500px] bg-sunset-500/5 rounded-full blur-[150px] animate-float-slow pointer-events-none" />
      </div>

      <div className="relative z-20 w-full container mx-auto px-4 sm:px-6 flex flex-col items-center text-center pt-32 pb-12 sm:pt-40 sm:pb-16 md:pt-48 md:pb-20 -translate-y-4 sm:-translate-y-6 md:-translate-y-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="max-w-5xl w-full flex flex-col items-center"
        >
          <motion.span
            variants={textVariant}
            className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs sm:text-sm font-medium tracking-[0.15em] sm:tracking-[0.2em] uppercase mb-4 cursor-default select-none"
          >
            <span className="w-2 h-2 rounded-full bg-gold-500 animate-pulse flex-shrink-0" />
            {isAdmin ? "Administrator Session" : "Welcome to Hampi"}
          </motion.span>

          {!isAdmin && (
            <motion.div
              variants={textVariant}
              className="flex items-center justify-center gap-6 text-sand-200/60 text-[10px] font-bold tracking-[0.4em] uppercase mb-8"
            >
              <span className="hover:text-gold-400 transition-colors cursor-default">Stay</span>
              <span className="w-1 h-1 bg-gold-500/40 rounded-full" />
              <span className="hover:text-gold-400 transition-colors cursor-default">Experience</span>
              <span className="w-1 h-1 bg-gold-500/40 rounded-full" />
              <span className="hover:text-gold-400 transition-colors cursor-default">Remember</span>
            </motion.div>
          )}

          <motion.h1
            variants={textVariant}
            className="text-4xl sm:text-5xl md:text-7xl font-serif font-bold text-white leading-[1.1] mb-4 sm:mb-6 text-shadow-lg"
          >
            {isAdmin ? (
              <>
                Curate the <span className="text-gold-400 italic">Legacy</span>
              </>
            ) : (
              <>
                Discover Ancient <br className="hidden sm:block" />
                <span className="text-gold-400 italic">Luxury</span>
              </>
            )}
          </motion.h1>

          <motion.p
            variants={textVariant}
            className="text-sand-100/80 mb-8 sm:mb-10 px-2 text-shadow-md text-lg max-w-2xl"
          >
            {isAdmin 
              ? "You are logged in as the platform curator. Manage approvals, monitor performance, and maintain excellence."
              : "Experience the grandeur of the Vijayanagara Empire seamlessly blended with world-class eco-hospitality."}
          </motion.p>

          <motion.div variants={textVariant} className="w-full flex justify-center">
            {isAdmin ? (
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Link to="/dashboard">
                  <button className="h-16 px-10 bg-gold-500 hover:bg-gold-400 text-navy-950 font-bold rounded-2xl flex items-center gap-3 transition-all duration-300 shadow-xl shadow-gold-500/20 group">
                    <ShieldCheck className="w-5 h-5" />
                    Enter Command Center
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
                <div className="flex gap-4">
                  <div className="bg-white/5 backdrop-blur-md border border-white/10 px-6 py-3 rounded-2xl flex items-center gap-3">
                    <Building2 className="w-4 h-4 text-gold-400" />
                    <span className="text-white text-sm font-bold">Curation Mode</span>
                  </div>
                </div>
              </div>
            ) : (
              <SearchBar />
            )}
          </motion.div>

 
          
        </motion.div>
      </div>

      {/* Bottom fade — to warm sandstone */}
      <div className="absolute bottom-0 left-0 right-0 h-16 sm:h-24 bg-gradient-to-t from-sand-50/80 to-transparent z-10 pointer-events-none" />
    </div>
  );
}
