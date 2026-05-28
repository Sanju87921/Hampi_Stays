import { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, useAnimation, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, Check } from "lucide-react";
import { cn } from "../../utils/cn";

interface AppleAuthButtonProps {
  onSuccess?: (credential: string) => void;
  isLoading?: boolean;
  text?: string;
}

export function AppleAuthButton({ onSuccess, isLoading, text = "Slide to Continue" }: AppleAuthButtonProps) {
  const [isSuccess, setIsSuccess] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const controls = useAnimation();

  // 1. Dynamic range calculation
  const [dragRange, setDragRange] = useState(230);

  useEffect(() => {
    const updateRange = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const handleWidth = 44; // w-11
        const padding = 12; // left-1.5 + right-1.5
        setDragRange(containerWidth - handleWidth - padding);
      }
    };

    updateRange();
    window.addEventListener("resize", updateRange);
    return () => window.removeEventListener("resize", updateRange);
  }, []);

  // 2. Visual Transformations (Monochrome Luxury)
  const opacity = useTransform(x, [0, dragRange * 0.4], [1, 0]);
  const trackFillWidth = useTransform(x, [0, dragRange], ["0%", "100%"]);
  const glowOpacity = useTransform(x, [0, dragRange], [0, 0.4]);
  const handleBg = useTransform(x, [dragRange - 10, dragRange], ["#ffffff", "#020617"]); // White to Navy-950
  const iconColor = useTransform(x, [dragRange - 10, dragRange], ["#020617", "#ffffff"]);

  const triggerAppleAuth = () => {
    console.log("Apple Auth Triggered");
    if (onSuccess) {
      // Simulate success callback
      setTimeout(() => onSuccess("mock_apple_credential"), 1000);
    }
  };

  const handleDragEnd = async (_: any, info: any) => {
    const threshold = dragRange * 0.92;
    if (info.offset.x >= threshold) {
      setIsSuccess(true);
      await controls.start({ x: dragRange, transition: { type: "spring", stiffness: 600, damping: 40 } });
      triggerAppleAuth();
      
      setTimeout(() => {
        controls.start({ x: 0, transition: { type: "spring", stiffness: 300, damping: 25 } });
        setIsSuccess(false);
      }, 3000);
    } else {
      controls.start({ x: 0, transition: { type: "spring", stiffness: 400, damping: 30 } });
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full max-w-[320px] mx-auto group select-none"
    >
      {/* Main Track (Silver/Navy Theme) */}
      <div className={cn(
        "relative w-full h-[60px] bg-slate-100/50 backdrop-blur-md border border-slate-200 rounded-3xl overflow-hidden transition-all duration-500",
        isSuccess ? "border-navy-950 shadow-2xl" : "hover:border-slate-300 shadow-luxury"
      )}>
        
        {/* 3. Monochrome Luxury Fill */}
        <motion.div 
          style={{ width: trackFillWidth }}
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-slate-300/20 via-slate-400/30 to-navy-900/40 z-0"
        />

        {/* 4. Sliding Text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div 
            style={{ opacity }}
            className="flex items-center gap-2"
          >
            <motion.span
              animate={{ x: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-[13px] font-black uppercase tracking-[0.2em] text-navy-950 dark:text-white/40 dark:text-zinc-500"
            >
              {isLoading ? "Unlocking..." : text}
            </motion.span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 animate-pulse" />
          </motion.div>
        </div>

        {/* 5. Success Shimmer & Sparkles */}
        <AnimatePresence>
          {isSuccess && (
            <>
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "200%" }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 z-10"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute right-16 top-1/2 -translate-y-1/2 z-10"
              >
                <Sparkles className="w-5 h-5 text-slate-400 animate-pulse" />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* 6. Drag Handle */}
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: dragRange }}
          dragElastic={0.05}
          dragMomentum={false}
          animate={controls}
          style={{ x }}
          onDragEnd={handleDragEnd}
          className={cn(
            "absolute left-1.5 top-1.5 bottom-1.5 w-11 h-11 rounded-2xl flex items-center justify-center z-20 cursor-grab active:cursor-grabbing transition-all",
            isSuccess ? "bg-navy-950 shadow-2xl" : "bg-white dark:bg-zinc-900 shadow-premium border border-slate-100 hover:bg-slate-50"
          )}
        >
          <motion.div style={{ color: iconColor }}>
            {isSuccess ? (
              <Check className="w-5 h-5 text-white" />
            ) : (
              <svg viewBox="0 0 256 315" className="w-5 h-5 fill-current">
                <path d="M213.803 167.03c.442 47.58 41.74 63.413 42.147 63.615-.35 1.116-6.599 22.563-21.757 44.716-13.104 19.153-26.705 38.235-48.13 38.63-21.05.394-27.815-12.44-51.841-12.44-24.03 0-31.547 12.046-51.412 12.833-20.643.787-36.257-20.706-49.51-39.814C6.115 233.155-15.068 159.204 6.305 122.03c10.607-18.455 29.61-30.147 50.347-30.457 15.932-.31 30.932 10.703 40.697 10.703 9.76 0 27.76-13.16 46.85-11.233 8.013.332 30.547 3.226 44.995 24.4-1.155.717-26.9 15.684-26.623 46.683l.232 4.904zM155.903 59.29c8.583-10.42 14.343-24.89 12.763-39.29-12.353.5-27.27 8.213-36.13 18.633-7.933 9.176-14.863 24.036-13.003 38.1 13.8.106 27.793-7.023 36.37-17.443z" />
              </svg>
            )}
          </motion.div>

          {/* Aura on Hover */}
          <motion.div 
            style={{ opacity: glowOpacity }}
            className="absolute inset-0 bg-slate-400/20 rounded-2xl blur-md -z-10"
          />
        </motion.div>
      </div>

      {/* Track Background Detail */}
      <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between px-10 pointer-events-none opacity-5">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="w-1 h-1 rounded-full bg-navy-950" />
        ))}
      </div>
    </div>
  );
}
