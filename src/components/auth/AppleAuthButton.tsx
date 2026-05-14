import { useState } from "react";
import { motion, useMotionValue, useTransform, useAnimation } from "framer-motion";
import { cn } from "../../utils/cn";

interface AppleAuthButtonProps {
  onSuccess?: (credential: string) => void;
  isLoading?: boolean;
  text?: string;
}

export function AppleAuthButton({ onSuccess, isLoading, text = "Continue with Apple" }: AppleAuthButtonProps) {
  const [isSwiped, setIsSwiped] = useState(false);
  const x = useMotionValue(0);
  const controls = useAnimation();
  
  // Same transformations as Google button for consistency
  const opacity = useTransform(x, [0, 150], [1, 0]);
  const scale = useTransform(x, [0, 150], [1, 0.9]);
  const glowOpacity = useTransform(x, [0, 100, 200], [0, 0.5, 1]);
  const shineX = useTransform(x, [0, 200], ["-100%", "200%"]);
  const iconScale = useTransform(x, [0, 180, 200], [1, 1.1, 1.2]);

  const triggerAppleAuth = () => {
    // Placeholder for Apple Auth logic
    console.log("Apple Auth Triggered");
    if (onSuccess) {
      // Simulate success for now if needed or just handle the UI
    }
  };

  const handleDragEnd = async (_: any, info: any) => {
    if (info.offset.x > 120) {
      setIsSwiped(true);
      await controls.start({ x: 160, transition: { type: "spring", stiffness: 500, damping: 30 } });
      triggerAppleAuth();
      
      setTimeout(() => {
        controls.start({ x: 0, transition: { type: "spring", stiffness: 300, damping: 25 } });
        setIsSwiped(false);
      }, 2000);
    } else {
      controls.start({ x: 0, transition: { type: "spring", stiffness: 400, damping: 25 } });
    }
  };

  return (
    <div className="relative w-[85%] max-w-[320px] mx-auto group select-none">
      <motion.button
        type="button"
        onClick={triggerAppleAuth}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.99 }}
        style={{ scale }}
        disabled={isLoading || isSwiped}
        className={cn(
          "relative w-full h-14 flex items-center justify-center gap-3 bg-[#fdfbf7] border border-gold-500/20 rounded-[1.25rem] overflow-hidden transition-all duration-500",
          "hover:border-gold-500/40 hover:shadow-luxury group-active:border-gold-500/60",
          (isLoading || isSwiped) && "opacity-70 cursor-not-allowed"
        )}
      >
        {/* Animated Shine Effect */}
        <motion.div 
          style={{ x: shineX }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-gold-200/20 to-transparent skew-x-[-20deg] z-10 pointer-events-none"
        />

        {/* Swipe Handle / Apple Icon */}
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 160 }}
          dragElastic={0.05}
          animate={controls}
          style={{ x }}
          onDragEnd={handleDragEnd}
          className="absolute left-1.5 top-1.5 bottom-1.5 w-11 h-11 bg-white rounded-2xl shadow-premium border border-gold-100 flex items-center justify-center z-30 cursor-grab active:cursor-grabbing hover:bg-sand-50 transition-colors"
        >
          <motion.svg viewBox="0 0 24 24" className="w-6 h-6 fill-navy-950" style={{ scale: iconScale }}>
            <path d="M17.05 20.28c-.96.95-2.04 1.78-3.32 1.78-1.2 0-1.63-.74-3.13-.74-1.48 0-1.99.72-3.13.72-1.28 0-2.45-.88-3.41-1.84C1.86 18.06.45 14.15.45 10.74c0-3.38 2.1-5.16 4.11-5.16 1.06 0 2.06.44 2.82.44.75 0 1.58-.41 2.8-.41 1.04 0 2.15.42 2.89 1.13-1.66 1.02-2.14 3.09-1.26 4.7.74 1.34 2.13 2.15 3.32 2.15.22 0 .43-.01.62-.05-.44 1.4-.92 2.65-1.7 3.54zm-2.95-15.1c0 2.02-1.67 3.65-3.6 3.65-.05 0-.09 0-.14-.01.07-2.02 1.76-3.62 3.64-3.62.05 0 .1 0 .1.01v.01-.04z"/>
          </motion.svg>
        </motion.div>

        {/* Text */}
        <motion.span 
          style={{ opacity }}
          className="text-[13px] font-bold text-navy-950 tracking-tight z-20"
        >
          {isLoading ? "Authenticating..." : text}
        </motion.span>

        {/* Swipe Prompt Overlay */}
        <motion.div 
          style={{ opacity: glowOpacity }}
          className="absolute inset-0 bg-gold-500/5 pointer-events-none z-0"
        />

        {/* Subtle Dots Track */}
        <div className="absolute left-16 right-8 h-full flex items-center justify-around opacity-10 pointer-events-none">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-1 h-1 rounded-full bg-navy-950" />
          ))}
        </div>
      </motion.button>
      
      {/* Background Track Hint */}
      <div className="absolute inset-x-1.5 top-1.5 bottom-1.5 bg-sand-50/40 rounded-2xl -z-10 pointer-events-none border border-dashed border-gold-200/30 flex items-center justify-end pr-6">
        <motion.div 
          animate={{ x: [0, 8, 0], opacity: [0.3, 0.6, 0.3] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          className="text-[8px] font-black uppercase tracking-[0.3em] text-gold-600/30"
        >
          Slide
        </motion.div>
      </div>
    </div>
  );
}
