import { forwardRef } from "react";
import { cn } from "../../utils/cn";
import { motion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
 variant?: "primary" | "secondary" | "success" | "danger" | "warning" | "outline" | "ghost" | "custom";
 size?: "sm" | "md" | "lg";
 isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
 ({ className, variant = "primary", size = "md", isLoading, children, ...props }, ref) => {
 const variants = {
  primary: "bg-navy-950 text-white hover:bg-navy-900 focus:ring-navy-950 disabled:bg-navy-950/50 shadow-luxury hover:shadow-lg",
  secondary: "bg-sand-100 text-navy-950 hover:bg-sand-200 focus:ring-sand-200 disabled:bg-sand-50",
  success: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-600 disabled:bg-green-600/50 shadow-md",
  danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-600 disabled:bg-red-600/50 shadow-md",
  warning: "bg-gold-500 text-navy-950 hover:bg-gold-600 focus:ring-gold-500 disabled:bg-gold-500/50 shadow-md",
  outline: "border-2 border-navy-950 text-navy-950 hover:bg-navy-950 hover:text-white focus:ring-navy-950 disabled:border-navy-950/50 disabled:text-navy-950/50",
  ghost: "text-navy-950 hover:bg-sand-100 hover:text-navy-800 focus:ring-sand-200 disabled:text-navy-950/50",
  custom: "",
  };

 const sizes = {
 sm: "h-10 px-5 text-sm font-semibold",
 md: "h-12 px-7 text-base font-semibold",
 lg: "h-14 px-9 text-lg font-semibold",
 };

 return (
 <motion.button
 ref={ref}
 whileHover={{ 
 y: -2, 
 boxShadow: variant === "primary" 
 ? "0 20px 40px -12px rgba(10, 17, 40, 0.3)" 
 : "0 20px 40px -12px rgba(197, 160, 89, 0.3)"
 }}
 whileTap={{ scale: 0.98 }}
 transition={{ 
 type: "spring", 
 stiffness: 500, 
 damping: 30,
 mass: 0.8
 }}
 disabled={isLoading || props.disabled}
 className={cn(
 "inline-flex items-center justify-center rounded-2xl font-bold transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-gold-400 focus:ring-offset-2 focus:ring-offset-sand-50 disabled:opacity-70 disabled:cursor-not-allowed",
 variants[variant],
 sizes[size],
 className
 )}
 {...props}
 >
 {isLoading ? (
 <div className="flex items-center gap-2">
 <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
 <span>Processing...</span>
 </div>
 ) : (
 children
 )}
 </motion.button>
 );
 }
);

Button.displayName = "Button";

export { Button };
