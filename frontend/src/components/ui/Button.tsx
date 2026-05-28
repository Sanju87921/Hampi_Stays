import { forwardRef } from "react";
import { cn } from "../../utils/cn";
import { motion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, ...props }, ref) => {
    const variants = {
      primary: "bg-navy-950 text-white hover:bg-gold-500 shadow-luxury hover:shadow-gold",
      secondary: "bg-gold-500 text-navy-950 dark:text-white hover:bg-gold-400 shadow-luxury hover:shadow-gold",
      outline: "border-2 border-navy-950 text-navy-950 dark:text-white hover:bg-navy-950 hover:text-white",
      ghost: "text-navy-950 dark:text-white hover:bg-sand-100 dark:hover:bg-zinc-700 hover:text-navy-800",
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
