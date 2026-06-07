import { motion } from "framer-motion";

export function PageLoader() {
  return (
    <div className="min-h-screen bg-sand-50/50 pt-28 flex items-center justify-center z-50 relative">
      <motion.img 
        src="/logo.png" 
        alt="HampiStays Loading..." 
        className="w-32 h-auto"
        animate={{ scale: [1, 1.05, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
