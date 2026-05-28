import { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, useAnimation, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, Check } from "lucide-react";
import { cn } from "../../utils/cn";

interface GoogleAuthButtonProps {
  onSuccess: (credential: string) => void;
  isLoading?: boolean;
  text?: string;
}

declare global {
  interface Window {
    google?: any;
  }
}

export function GoogleAuthButton({ onSuccess, isLoading, text = "Slide to Continue" }: GoogleAuthButtonProps) {
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

  // 2. Visual Transformations based on drag position
  const opacity = useTransform(x, [0, dragRange * 0.4], [1, 0]);
  const trackFillWidth = useTransform(x, [0, dragRange], ["0%", "100%"]);
  const glowOpacity = useTransform(x, [0, dragRange], [0, 0.4]);
  const handleBg = useTransform(x, [dragRange - 10, dragRange], ["#ffffff", "#C8A96B"]);
  const iconColor = useTransform(x, [dragRange - 10, dragRange], ["#000000", "#ffffff"]);

  useEffect(() => {
    const clientId = "389686748462-nh36uj8ht8go4unb9607sclhgl1plb7r.apps.googleusercontent.com";
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: any) => {
          if (response.credential) onSuccess(response.credential);
        },
        auto_select: false,
      });
    }
  }, [onSuccess]);

  const triggerGoogleAuth = () => {
    if (window.google) {
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          try {
            window.google.accounts.id.renderButton(
              document.getElementById('hidden-google-button'),
              { theme: 'outline', size: 'large' }
            );
            document.querySelector<HTMLElement>('#hidden-google-button div[role="button"]')?.click();
          } catch (e) {
            console.error("Google Auth Error", e);
          }
        }
      });
    }
  };

  const handleDragEnd = async (_: any, info: any) => {
    const threshold = dragRange * 0.92;
    if (info.offset.x >= threshold) {
      setIsSuccess(true);
      await controls.start({ x: dragRange, transition: { type: "spring", stiffness: 600, damping: 40 } });
      triggerGoogleAuth();
      
      // Reset after a delay
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
      <div id="hidden-google-button" className="hidden" />

      {/* Main Track */}
      <div className={cn(
        "relative w-full h-[60px] bg-sand-100 dark:bg-zinc-800/50/50 backdrop-blur-md border border-sand-200 dark:border-zinc-800 rounded-3xl overflow-hidden transition-all duration-500",
        isSuccess ? "border-gold-500 shadow-gold" : "hover:border-sand-300 shadow-luxury"
      )}>
        
        {/* 3. Soft Google Tones Luxury Fill */}
        <motion.div 
          style={{ width: trackFillWidth }}
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500/10 via-gold-500/20 to-red-500/10 z-0"
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
            <ArrowRight className="w-3.5 h-3.5 text-gold-600 animate-pulse" />
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
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 z-10"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute right-16 top-1/2 -translate-y-1/2 z-10"
              >
                <Sparkles className="w-5 h-5 text-gold-500 animate-pulse" />
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
            "absolute left-1.5 top-1.5 bottom-1.5 w-11 h-11 rounded-2xl flex items-center justify-center z-20 cursor-grab active:cursor-grabbing transition-shadow",
            isSuccess ? "bg-gold-500 shadow-gold" : "bg-white dark:bg-zinc-900 shadow-premium border border-sand-100 dark:border-zinc-800/50 hover:bg-sand-50 dark:hover:bg-zinc-800"
          )}
        >
          <motion.div style={{ color: iconColor }}>
            {isSuccess ? (
              <Check className="w-5 h-5 text-white" />
            ) : (
              <svg viewBox="0 0 24 24" className="w-6 h-6">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
          </motion.div>

          {/* Aura on Hover */}
          <motion.div 
            style={{ opacity: glowOpacity }}
            className="absolute inset-0 bg-gold-500/20 rounded-2xl blur-md -z-10"
          />
        </motion.div>
      </div>

      {/* Track Background Detail */}
      <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between px-10 pointer-events-none opacity-10">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="w-1 h-1 rounded-full bg-navy-950" />
        ))}
      </div>
    </div>
  );
}
