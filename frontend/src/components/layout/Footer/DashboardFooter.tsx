import { Link } from "react-router-dom";

export function DashboardFooter() {
  return (
    <footer className="bg-white dark:bg-zinc-900 py-6 border-t border-sand-100 dark:border-zinc-800/50 mt-auto">
      <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-xs font-bold text-navy-950 dark:text-white/40 dark:text-zinc-500 uppercase tracking-widest">
          © {new Date().getFullYear()} HampiStays
        </p>
        <div className="flex items-center gap-6">
          <Link to="/privacy" className="text-xs font-bold uppercase tracking-widest text-navy-950 dark:text-white/40 dark:text-zinc-500 hover:text-navy-950 dark:text-white transition-colors">Privacy</Link>
          <Link to="/terms" className="text-xs font-bold uppercase tracking-widest text-navy-950 dark:text-white/40 dark:text-zinc-500 hover:text-navy-950 dark:text-white transition-colors">Terms</Link>
          <Link to="/contact" className="text-xs font-bold uppercase tracking-widest text-navy-950 dark:text-white/40 dark:text-zinc-500 hover:text-navy-950 dark:text-white transition-colors">Help</Link>
        </div>
      </div>
    </footer>
  );
}
