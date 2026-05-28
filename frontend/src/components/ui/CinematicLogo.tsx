import React, { useRef } from "react";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { cn } from "../../utils/cn";

interface CinematicLogoProps {
 className?: string;
 size?: "sm" | "md" | "lg";
}

export function CinematicLogo({ className, size = "md" }: CinematicLogoProps) {
 const containerRef = useRef<HTMLDivElement>(null);

 // 1. Mouse Tracking for 3D Tilt
 const mouseX = useMotionValue(0.5);
 const mouseY = useMotionValue(0.5);

 // 2. Smooth Spring Physics (High damping/stiffness for that "expensive" heavy feel)
 const springConfig = { damping: 30, stiffness: 120, restDelta: 0.001 };
 const rotateX = useSpring(useTransform(mouseY, [0, 1], [15, -15]), springConfig);
 const rotateY = useSpring(useTransform(mouseX, [0, 1], [-15, 15]), springConfig);

 const handleMouseMove = (e: React.MouseEvent) => {
 if (!containerRef.current) return;
 const rect = containerRef.current.getBoundingClientRect();
 const x = (e.clientX - rect.left) / rect.width;
 const y = (e.clientY - rect.top) / rect.height;
 mouseX.set(x);
 mouseY.set(y);
 };

 const handleMouseLeave = () => {
 mouseX.set(0.5);
 mouseY.set(0.5);
 };

 const sizes = {
 sm: "w-16 h-16",
 md: "w-24 h-24 md:w-32 md:h-32",
 lg: "w-32 h-32 md:w-40 md:h-40"
 };

 return (
 <div 
 ref={containerRef}
 onMouseMove={handleMouseMove}
 onMouseLeave={handleMouseLeave}
 className={cn("relative flex items-center justify-center perspective-1000", className)}
 >
 {/* 3. Glassmorphic Aura (Background Glow) */}
 <motion.div
 initial={{ opacity: 0, scale: 0.8 }}
 animate={{ 
 opacity: [0.4, 0.6, 0.4],
 scale: [1, 1.1, 1],
 }}
 transition={{ 
 duration: 4, 
 repeat: Infinity, 
 ease: "easeInOut" 
 }}
 className="absolute inset-0 bg-radial-gradient from-amber-200/20 via-sand-100/5 to-transparent blur-3xl rounded-full"
 style={{ transform: "translateZ(-50px)" }}
 />

 {/* 4. The Floating Logo Container */}
 <motion.div
 style={{ 
 rotateX: typeof window !== 'undefined' && window.matchMedia("(hover: hover)").matches ? rotateX : 0, 
 rotateY: typeof window !== 'undefined' && window.matchMedia("(hover: hover)").matches ? rotateY : 0, 
 transformStyle: "preserve-3d" 
 }}
 initial={{ opacity: 0, y: 20, scale: 0.9, filter: "blur(10px)" }}
 animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
 transition={{ 
 duration: 1.2, 
 ease: [0.22, 1, 0.36, 1], // Cinematic quint easing
 delay: 0.2
 }}
 className={cn("relative z-10", sizes[size])}
 >
 {/* Slow Floating Animation */}
 <motion.div
 animate={{ y: [0, -8, 0] }}
 transition={{ 
 duration: 5, 
 repeat: Infinity, 
 ease: "easeInOut" 
 }}
 className="relative w-full h-full group"
 >
 {/* Logo Image */}
 <img 
 src="/logo.png" 
 alt="HampiStays Logo"
 onError={(e) => {
 const target = e.target as HTMLImageElement;
 target.src = "/favicon.svg"; // Fallback to favicon if logo is missing
 target.className = "w-12 h-12 opacity-50"; 
 }}
 className="w-full h-full object-contain drop-shadow-2xl brightness-110"
 />

 {/* 5. Cinematic Light Sweep (Metallic Shimmer) */}
 <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700">
 <motion.div 
 animate={{ 
 left: ["-100%", "200%"],
 }}
 transition={{ 
 duration: 2.5, 
 repeat: Infinity, 
 repeatDelay: 3,
 ease: "easeInOut"
 }}
 className="absolute top-0 h-full w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-25"
 />
 </div>

 {/* Subtle Periodic Auto-Shimmer (Non-hover) */}
 <motion.div 
 animate={{ 
 left: ["-100%", "200%"],
 }}
 transition={{ 
 duration: 3, 
 repeat: Infinity, 
 repeatDelay: 8,
 ease: "easeInOut"
 }}
 className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-25 pointer-events-none"
 />
 </motion.div>
 </motion.div>

 {/* 6. Ambient Floor Shadow (Adds Depth) */}
 <motion.div
 animate={{ 
 scale: [1, 0.9, 1],
 opacity: [0.3, 0.2, 0.3]
 }}
 transition={{ 
 duration: 5, 
 repeat: Infinity, 
 ease: "easeInOut" 
 }}
 className="absolute -bottom-4 w-1/2 h-2 bg-sand-50/20 blur-md rounded-full"
 />
 </div>
 );
}
