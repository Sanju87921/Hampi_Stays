import { useState, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";

interface ImmersiveBackgroundProps {
  images: string[];
  labels?: string[];
  overlayColor?: string;
  height?: string;
  interval?: number;
  showVignette?: boolean;
  showWarmGlow?: boolean;
  blurAmount?: string; // e.g. "blur-[1px]" or "blur-[2px]"
  brightnessClass?: string; // e.g. "brightness-[0.75]"
  contrastClass?: string; // e.g. "contrast-[1.15]"
}

export function ImmersiveBackground({ 
  images, 
  labels = [], 
  overlayColor = "from-navy-950/80 via-navy-950/40 to-sand-50",
  height = "h-[65vh]",
  interval = 3000,
  showVignette = false,
  showWarmGlow = false,
  blurAmount = "blur-none",
  brightnessClass = "brightness-[0.85]",
  contrastClass = "contrast-[1.05]"
}: ImmersiveBackgroundProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, interval);
    return () => clearInterval(timer);
  }, [images.length, interval]);

  return (
    <div className={`absolute inset-0 z-0 overflow-hidden ${height}`}>
      <motion.div style={{ y }} className="absolute inset-0 w-full h-[120%] -top-[10%]">
        <AnimatePresence mode="wait">
          <motion.img 
            key={currentIndex}
            src={images[currentIndex]} 
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 0.75, scale: 1.05 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
            alt={labels[currentIndex] || "Hampi Atmosphere"}
            className={`absolute inset-0 w-full h-full object-cover filter ${blurAmount} ${brightnessClass} ${contrastClass}`}
          />
        </AnimatePresence>
        
        {/* Ambient Overlays */}
        <div className={`absolute inset-0 bg-gradient-to-b ${overlayColor}`} />
        <div className="absolute inset-0 bg-navy-950/20 mix-blend-overlay" />

        {/* Optional Smooth Vignette Edges */}
        {showVignette && (
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_30%,rgba(5,10,30,0.85)_100%)] mix-blend-multiply" />
        )}

        {/* Optional Ambient Warm Glow */}
        {showWarmGlow && (
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.05)_0%,transparent_70%)] mix-blend-screen" />
        )}
        
        {/* Subtle Dust/Particle Effect (Optional) */}
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
      </motion.div>
    </div>
  );
}
