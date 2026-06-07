import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useCurrency } from "../../context/CurrencyContext";
import { cn } from "../../utils/cn";
import { ChevronDown } from "lucide-react";

export function CurrencySwitcher({ useDarkText }: { useDarkText?: boolean }) {
  const { currency, setCurrency } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currencies = [
    { code: 'INR', symbol: '₹' },
    { code: 'USD', symbol: '$' },
    { code: 'EUR', symbol: '€' },
    { code: 'GBP', symbol: '£' },
  ] as const;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wider transition-all",
          useDarkText
            ? "text-navy-950 hover:bg-navy-950/5 border border-transparent hover:border-navy-950/10"
            : "text-white hover:bg-white/10 border border-transparent hover:border-white/20"
        )}
      >
        <span>{currency}</span>
        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-28 bg-white border border-sand-200 rounded-2xl shadow-luxury overflow-hidden z-50 py-2"
          >
            {currencies.map((curr) => (
              <button
                key={curr.code}
                onClick={() => {
                  setCurrency(curr.code);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-2 text-sm font-bold transition-colors",
                  currency === curr.code
                    ? "bg-gold-50 text-gold-700"
                    : "text-navy-950 hover:bg-sand-50"
                )}
              >
                <span>{curr.code}</span>
                <span className="opacity-50 font-normal">{curr.symbol}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
