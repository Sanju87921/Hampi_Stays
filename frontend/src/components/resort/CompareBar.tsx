import { X, ArrowRight, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import type { CompareItem } from "../../types/resort";
import { Button } from "../ui/Button";

interface CompareBarProps {
  items: CompareItem[];
  onRemove: (id: string) => void;
  onClear: () => void;
}

export function CompareBar({ items, onRemove, onClear }: CompareBarProps) {
  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] w-full max-w-4xl px-4">
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="bg-navy-950 text-white rounded-[2.5rem] p-4 shadow-luxury border border-white/10 flex flex-col md:flex-row items-center gap-6"
      >
        <div className="flex items-center gap-3 px-4 border-r border-white/10">
          <div className="w-10 h-10 bg-gold-600 rounded-full flex items-center justify-center">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold">Compare ({items.length}/3)</p>
            <p className="text-[10px] opacity-40 uppercase tracking-widest font-bold">Sanctuaries</p>
          </div>
        </div>

        <div className="flex-grow flex items-center gap-4 overflow-x-auto py-2 custom-scrollbar no-scrollbar">
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item.resortId}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="flex-shrink-0 flex items-center gap-3 bg-white  border border-white/10 rounded-2xl pl-4 pr-2 py-2 group"
              >
                <span className="text-xs font-bold whitespace-nowrap">{item.resortName}</span>
                <button
                  onClick={() => onRemove(item.resortId)}
                  className="p-1.5 hover:bg-white  rounded-lg transition-colors text-white/40 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {items.length < 3 && (
            <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest whitespace-nowrap px-4 border-2 border-dashed border-white/5 rounded-2xl py-3">
              Add more to compare
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 px-4 flex-shrink-0">
          <button
            onClick={onClear}
            className="text-xs font-bold text-white/40 hover:text-white transition-colors"
          >
            Clear All
          </button>
          <Link to={`/resorts/compare?ids=${items.map((i) => i.resortId).join(",")}`}>
            <Button size="sm" className="rounded-xl gap-2 h-11 px-6 shadow-gold">
              Compare Now
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
