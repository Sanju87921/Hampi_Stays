import { forwardRef, useState } from "react";
import { cn } from "../../utils/cn";
import { Eye, EyeOff } from "lucide-react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, hint, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;

    return (
      <div className="relative w-full mb-6">
        <div className="relative">
          <input
            type={inputType}
            className={cn(
              "peer w-full h-14 bg-sand-50/80 backdrop-blur-sm border-2 border-sand-200 rounded-xl px-4 pt-4 pb-1 text-navy-950 placeholder-transparent outline-none transition-all duration-300 focus:border-gold-500 focus:bg-white shadow-sm hover:border-sand-300",
              "disabled:cursor-not-allowed disabled:bg-sand-100/50 disabled:border-sand-200/50 disabled:text-navy-950/50",
              error && "border-red-500 focus:border-red-500",
              isPassword && "pr-12",
              className
            )}
            placeholder={label}
            ref={ref}
            {...props}
          />
          <label
            className={cn(
              "absolute left-4 top-2 text-xs font-bold text-navy-800/60 uppercase tracking-widest transition-all duration-300 pointer-events-none",
              "peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:font-medium peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal",
              "peer-focus:top-2 peer-focus:text-xs peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-widest peer-focus:text-gold-600",
              error && "text-red-500 peer-focus:text-red-500"
            )}
          >
            {label}
          </label>
          
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-navy-800/40 hover:text-navy-950 transition-colors focus:outline-none"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          )}
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
