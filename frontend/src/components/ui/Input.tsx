import { forwardRef, useState } from "react";
import { cn } from "../../utils/cn";
import { Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, hint, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const isPassword = type === "password";
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;

    return (
      <div className="relative w-full mb-6">
        <div className="relative group">
          <input
            type={inputType}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={cn(
              "peer w-full h-14 bg-sand-50 dark:bg-zinc-950/50 backdrop-blur-md border-2 border-sand-200 dark:border-zinc-800/60 rounded-2xl px-5 pt-5 pb-1 text-navy-950 dark:text-white placeholder-transparent outline-none transition-all duration-500 ease-[0.16,1,0.3,1] focus:border-gold-500/50 focus:bg-white dark:bg-zinc-900 shadow-sm hover:border-sand-300/80 focus:ring-4 focus:ring-gold-500/5",
              "disabled:cursor-not-allowed disabled:bg-sand-100 dark:bg-zinc-800/50/50 disabled:border-sand-200 dark:border-zinc-800/50 disabled:text-navy-950 dark:text-white/50 dark:text-zinc-400",
              error && "border-red-500 focus:border-red-500 focus:ring-red-500/5",
              isPassword && "pr-12",
              className
            )}
            placeholder={label}
            ref={ref}
            {...props}
          />
          <label
            className={cn(
              "absolute left-5 top-2.5 text-[10px] font-bold text-navy-800/40 uppercase tracking-widest transition-all duration-500 pointer-events-none ease-[0.16,1,0.3,1]",
              "peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:font-medium peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal",
              "peer-focus:top-2.5 peer-focus:text-[10px] peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-widest peer-focus:text-gold-600",
              error && "text-red-500 peer-focus:text-red-500"
            )}
          >
            {label}
          </label>
          
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-navy-800/30 hover:text-navy-950 dark:text-white transition-colors focus:outline-none"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          )}

          {/* Luxury Focus Ring */}
          <motion.div
            initial={false}
            animate={{ opacity: isFocused ? 1 : 0, scale: isFocused ? 1 : 0.98 }}
            className="absolute -inset-[2px] border-2 border-gold-500/30 rounded-[1.2rem] pointer-events-none z-0"
          />
        </div>
        {error && (
          <p className="absolute -bottom-5 left-1 text-xs text-red-500 font-medium">
            {error}
          </p>
        )}
        {!error && hint && (
          <p className="absolute -bottom-5 left-1 text-[10px] text-navy-800/40 font-medium italic">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
