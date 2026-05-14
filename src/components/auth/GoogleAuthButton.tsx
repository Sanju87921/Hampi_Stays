import { useState, useEffect } from "react";
import { motion, useMotionValue, useTransform, useAnimation } from "framer-motion";
import { cn } from "../../utils/cn";

interface GoogleAuthButtonProps {
  onSuccess: (credential: string) => void;
  isLoading?: boolean;
  text?: string;
}

// Add global type for google identity services
declare global {
  interface Window {
    google?: any;
  }
}

export function GoogleAuthButton({ onSuccess, isLoading, text = "Continue with Google" }: GoogleAuthButtonProps) {
  const [isSwiped, setIsSwiped] = useState(false);
  const x = useMotionValue(0);
  const controls = useAnimation();
  
  // Transform x position to various visual properties
  // The slider track is about 200px
  const opacity = useTransform(x, [0, 150], [1, 0]);
  const scale = useTransform(x, [0, 150], [1, 0.9]);
  const glowOpacity = useTransform(x, [0, 100, 200], [0, 0.5, 1]);
  const shineX = useTransform(x, [0, 200], ["-100%", "200%"]);
  const iconScale = useTransform(x, [0, 180, 200], [1, 1.1, 1.2]);

  useEffect(() => {
    // Initialize Google Identity Services if not already done
    const clientId = "389686748462-nh36uj8ht8go4unb9607sclhgl1plb7r.apps.googleusercontent.com";
    
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: any) => {
          if (response.credential) {
            onSuccess(response.credential);
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true
      });
    }
  }, [onSuccess]);

  const triggerGoogleAuth = () => {
    if (window.google) {
      // Trigger the Google Identity Services prompt (One Tap or Select Account)
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // If prompt isn't shown (e.g. blocked), we can't easily force it with a custom button 
          // without rendering their official button, but we'll try to show the picker
          try {
             // Fallback: This is sometimes restricted but worth a try
             window.google.accounts.id.renderButton(
               document.getElementById('hidden-google-button'),
               { theme: 'outline', size: 'large' }
             );
             document.querySelector<HTMLElement>('#hidden-google-button div[role="button"]')?.click();
          } catch (e) {
            console.error("Could not trigger Google Login", e);
          }
        }
      });
    }
  };

  const handleDragEnd = async (_: any, info: any) => {
    if (info.offset.x > 140) {
      setIsSwiped(true);
      await controls.start({ x: 210, transition: { type: "spring", stiffness: 500, damping: 30 } });
      triggerGoogleAuth();
      
      // Success feedback animation
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
      {/* Hidden button for fallback triggers */}
      <div id="hidden-google-button" className="hidden" />

      <motion.button
        type="button"
        onClick={triggerGoogleAuth}
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

        {/* Swipe Handle / Google Icon */}
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 160 }}
          dragElastic={0.05}
          animate={controls}
          style={{ x }}
          onDragEnd={async (_, info) => {
            if (info.offset.x > 120) {
              setIsSwiped(true);
              await controls.start({ x: 160, transition: { type: "spring", stiffness: 500, damping: 30 } });
              triggerGoogleAuth();
              
              setTimeout(() => {
                controls.start({ x: 0, transition: { type: "spring", stiffness: 300, damping: 25 } });
                setIsSwiped(false);
              }, 2000);
            } else {
              controls.start({ x: 0, transition: { type: "spring", stiffness: 400, damping: 25 } });
            }
          }}
          className="absolute left-1.5 top-1.5 bottom-1.5 w-11 h-11 bg-white rounded-2xl shadow-premium border border-gold-100 flex items-center justify-center z-30 cursor-grab active:cursor-grabbing hover:bg-sand-50 transition-colors"
        >
          <motion.svg viewBox="0 0 24 24" className="w-6 h-6" style={{ scale: iconScale }}>
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
