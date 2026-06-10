import { useState, useEffect } from "react";
import { motion, useScroll, useTransform, AnimatePresence, type Variants } from "framer-motion";
import { SearchBar } from "../resort/SearchBar";
import { useAuth } from "../../context/AuthContext";
import { ShieldCheck, ArrowRight, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function Hero() {
  const { scrollY } = useScroll();
  const { user } = useAuth();
  const isAdmin = user?.role?.toUpperCase() === "ADMIN";
  const { t } = useTranslation();

  const hampiImagesFallback = [
    "/images/hero.png",
    "/images/hampi-1.png",
    "/images/hampi-2.png",
    "/images/hampi-3.png",
    "/images/hampi-4.png",
    "/images/hampi-5.png",
    "/images/hampi-6.png"
  ];

  const imageLabelsFallback = [
    "The Sacred Virupaksha Temple",
    "The Sacred Stone Chariot",
    "Virupaksha Temple Gateway",
    "Ancient Granite Boulders",
    "The Royal Lotus Mahal",
    "Anjanadri Hill — Hanuman's Birthplace",
    "Tungabhadra River Twilight"
  ];

  const [hampiImages, setHampiImages] = useState(hampiImagesFallback);
  const [imageLabels, setImageLabels] = useState(imageLabelsFallback);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [hasSlides, setHasSlides] = useState<boolean | null>(null);
  const [headlineIndex, setHeadlineIndex] = useState(0);

  const headlines = [
    { top: "Welcome to", bottom: "Hampi" },
    { top: "Discover the Magic of", bottom: "Hampi" },
    { top: "Experience Ancient", bottom: "Hampi" },
    { top: "Stay in Luxury, Explore", bottom: "Hampi" },
    { top: "Where Heritage Meets", bottom: "Luxury" },
    { top: "Create Unforgettable", bottom: "Memories" },
    { top: "Your Journey Begins in", bottom: "Hampi" }
  ];

  useEffect(() => {
    const textInterval = setInterval(() => {
      setHeadlineIndex((prev) => (prev + 1) % headlines.length);
    }, 5000);
    return () => clearInterval(textInterval);
  }, []);

  useEffect(() => {
    // Fetch dynamic hero slides
    fetch(import.meta.env.VITE_API_URL + '/hero-slides')
      .then(res => res.json())
      .then((data) => {
        if (data && data.length > 0) {
          setHampiImages(data.map((s: any) => s.imageUrl));
          setImageLabels(data.map((s: any) => s.title));
        }
      })
      .catch(err => console.error("Failed to load hero slides", err));
      
    // Rotation interval config
    let speed = 3;
    const configStr = localStorage.getItem('hampi_hero_config');
    if (configStr) {
      try {
        speed = JSON.parse(configStr).rotationSpeed || 3;
      } catch (e) {}
    }

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % (hampiImages.length || 1));
    }, speed * 1000);
    return () => clearInterval(interval);
  }, [hampiImages.length]);

  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.2 } },
  };

  const textVariant: Variants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
  };

  return (
    <div className="relative min-h-[70svh] md:min-h-[100svh] flex items-center justify-center bg-navy-950 z-30">
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
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (!target.src.includes('hero.png')) {
                  target.src = '/images/hero.png';
                }
              }}
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

      <div className="relative z-20 w-full container mx-auto px-4 sm:px-6 flex flex-col items-center text-center pt-24 pb-8 sm:pt-40 sm:pb-16 md:pt-48 md:pb-20 -translate-y-4 sm:-translate-y-6 md:-translate-y-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="max-w-5xl w-full flex flex-col items-center"
        >
          <motion.div
            variants={textVariant}
            className="inline-flex items-center py-1.5 px-6 rounded-full bg-white/10 backdrop-blur-md border border-white/25 text-white text-xs sm:text-sm font-bold tracking-[0.2em] sm:tracking-[0.25em] uppercase mb-4 sm:mb-6 cursor-default select-none shadow-sm"
          >
            {isAdmin ? (
              <div className="flex items-center gap-3">
                <motion.span 
                  animate={{ opacity: [1, 0.4, 1], scale: [1, 1.2, 1] }} 
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} 
                  className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-gold-400 flex-shrink-0 shadow-[0_0_8px_rgba(212,176,106,0.6)]" 
                />
                <span>Administrator Session</span>
              </div>
            ) : (
              <div className="flex items-center gap-5 sm:gap-8">
                {[
                  t("hero.badge_stay", "STAY"), 
                  t("hero.badge_experience", "EXPERIENCE"), 
                  t("hero.badge_remember", "REMEMBER")
                ].map((text, i) => (
                  <div key={text} className="hidden sm:flex items-center gap-2 sm:gap-3">
                    <motion.span 
                      animate={{ opacity: [1, 0.4, 1], scale: [1, 1.2, 1] }} 
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }} 
                      className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-gold-400 flex-shrink-0 shadow-[0_0_8px_rgba(212,176,106,0.6)]" 
                    />
                    <span>{text}</span>
                  </div>
                ))}
                <div className="sm:hidden flex items-center gap-2">
                  <motion.span 
                    animate={{ opacity: [1, 0.4, 1], scale: [1, 1.2, 1] }} 
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} 
                    className="w-2 h-2 rounded-full bg-gold-400 flex-shrink-0 shadow-[0_0_8px_rgba(212,176,106,0.6)]" 
                  />
                  <span>KARNATAKA'S PREMIER LUXURY</span>
                </div>
              </div>
            )}
          </motion.div>




          <motion.div
            variants={textVariant}
            className="text-[42px] sm:text-5xl md:text-7xl font-serif font-bold text-white leading-[1.1] mb-4 sm:mb-6 text-shadow-lg w-full"
          >
            {isAdmin ? (
              <h1 className="text-center text-white">
                Curate the <span className="text-gold-400 italic">Legacy</span>
              </h1>
            ) : (
              <div className="grid [grid-template-areas:'stack'] place-items-center w-full min-h-[96px] sm:min-h-[120px] md:min-h-[160px]">
                <AnimatePresence>
                  <motion.h1
                    key={headlineIndex}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -30 }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                    className="[grid-area:stack] text-center w-full text-white"
                  >
                    {headlines[headlineIndex].top} <br className="hidden sm:block" />
                    <span className="text-gold-400 italic">{headlines[headlineIndex].bottom}</span>
                  </motion.h1>
                </AnimatePresence>
              </div>
            )}
          </motion.div>

          <motion.p
            variants={textVariant}
            className="text-sand-100/80 mb-8 sm:mb-10 px-2 text-shadow-md text-lg max-w-2xl"
          >
            {isAdmin 
              ? "You are logged in as the platform curator. Manage approvals, monitor performance, and maintain excellence."
              : t("hero.subtitle")}
          </motion.p>

          <motion.div variants={textVariant} className="w-full flex justify-center">
            {isAdmin ? (
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Link to="/admin/dashboard">
                  <button className="h-16 px-10 bg-gold-500 hover:bg-gold-400 text-navy-950 font-black rounded-2xl flex items-center gap-3 transition-all duration-300 shadow-xl shadow-gold-500/30 group text-base tracking-wide">
                    <ShieldCheck className="w-5 h-5 flex-shrink-0" />
                    Enter Command Center
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                  </button>
                </Link>
                <div className="flex gap-4">
                  <Link to="/admin/curation">
                    <button className="bg-navy-950/40 hover:bg-navy-950/60 backdrop-blur-md border border-white/15 px-6 h-16 rounded-2xl flex items-center gap-3 transition-all duration-300 shadow-sm">
                      <Building2 className="w-5 h-5 text-gold-400 flex-shrink-0" />
                      <span className="text-white text-base font-bold">Curation Mode</span>
                    </button>
                  </Link>
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
