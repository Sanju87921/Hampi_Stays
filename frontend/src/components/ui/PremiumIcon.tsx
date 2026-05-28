import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "../../utils/cn";

interface PremiumIconProps {
  icon: LucideIcon;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "gold" | "navy" | "sand" | "glass";
  className?: string;
  animate?: boolean;
}

export function PremiumIcon({
  icon: Icon,
  size = "md",
  variant = "gold",
  className,
  animate = true
}: PremiumIconProps) {
  const sizeClasses = {
    sm: "w-10 h-10 p-2.5",
    md: "w-14 h-14 p-3.5",
    lg: "w-20 h-20 p-5",
    xl: "w-24 h-24 p-6"
  };

  const iconSizeClasses = {
    sm: "w-5 h-5",
    md: "w-7 h-7",
    lg: "w-10 h-10",
    xl: "w-12 h-12"
  };

  const variants = {
    gold: {
      container: "bg-gradient-to-br from-gold-100 via-gold-200 to-gold-400 shadow-[0_10px_20px_-5px_rgba(197,160,89,0.3),inset_0_-4px_8px_rgba(197,160,89,0.5),inset_0_4px_8px_rgba(255,255,255,0.8)]",
      icon: "text-navy-950 dark:text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.1)]",
      glow: "bg-gold-500/20"
    },
    navy: {
      container: "bg-gradient-to-br from-navy-800 via-navy-900 to-navy-950 shadow-[0_10px_20px_-5px_rgba(10,17,40,0.4),inset_0_-4px_8px_rgba(0,0,0,0.5),inset_0_4px_8px_rgba(255,255,255,0.2)]",
      icon: "text-gold-400 drop-shadow-[0_2px_3px_rgba(0,0,0,0.3)]",
      glow: "bg-navy-500/20"
    },
    sand: {
      container: "bg-gradient-to-br from-sand-50 via-sand-100 to-sand-300 shadow-[0_10px_20px_-5px_rgba(180,160,140,0.2),inset_0_-4px_8px_rgba(180,160,140,0.3),inset_0_4px_8px_rgba(255,255,255,0.9)]",
      icon: "text-navy-900 drop-shadow-[0_1px_2px_rgba(0,0,0,0.05)]",
      glow: "bg-sand-500/10"
    },
    glass: {
      container: "bg-white dark:bg-zinc-900/40 backdrop-blur-xl border border-white/40 shadow-[0_10px_20px_-5px_rgba(0,0,0,0.1),inset_0_-4px_8px_rgba(255,255,255,0.2),inset_0_4px_8px_rgba(255,255,255,0.5)]",
      icon: "text-navy-950 dark:text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.1)]",
      glow: "bg-white dark:bg-zinc-900/20"
    }
  };

  const currentVariant = variants[variant];

  return (
    <motion.div
      animate={animate ? { 
        y: [0, -4, 0],
        transition: { 
          duration: 4, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }
      } : {}}
      whileHover={{ 
        y: -8, 
        scale: 1.05,
        transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
      }}
      className={cn("relative group", className)}
    >
      {/* Background Glow */}
      <div className={cn(
        "absolute inset-0 rounded-[2rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700",
        currentVariant.glow
      )} />

      {/* Main 3D Container */}
      <div className={cn(
        "relative z-10 flex items-center justify-center rounded-[1.75rem] transition-all duration-700",
        currentVariant.container,
        sizeClasses[size]
      )}>
        {/* Glass Shimmer */}
        <motion.div 
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 5 }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] z-10 pointer-events-none"
        />
        
        {/* Soft Highlight Overlay */}
        <div className="absolute inset-0 rounded-[1.75rem] bg-gradient-to-tl from-transparent via-white/5 to-white/40 pointer-events-none" />
        
        <Icon className={cn(
          "relative z-20 transition-transform duration-700 group-hover:scale-110 group-hover:rotate-3",
          currentVariant.icon,
          iconSizeClasses[size]
        )} strokeWidth={1.5} />
      </div>
    </motion.div>
  );
}
