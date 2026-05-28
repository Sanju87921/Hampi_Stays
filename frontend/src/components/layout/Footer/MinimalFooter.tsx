import { Link } from "react-router-dom";

export function MinimalFooter() {
  return (
    <footer className="bg-sand-50  py-10 border-t border-sand-200 ">
      <div className="container mx-auto px-4 text-center">
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 mb-6">
          <Link to="/privacy" className="text-xs font-bold uppercase tracking-widest text-navy-950   hover:text-navy-950  transition-colors">Privacy</Link>
          <Link to="/terms" className="text-xs font-bold uppercase tracking-widest text-navy-950   hover:text-navy-950  transition-colors">Terms</Link>
          <Link to="/cookies" className="text-xs font-bold uppercase tracking-widest text-navy-950   hover:text-navy-950  transition-colors">Cookies</Link>
          <Link to="/contact" className="text-xs font-bold uppercase tracking-widest text-navy-950   hover:text-navy-950  transition-colors">Support</Link>
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-navy-950  ">
          © {new Date().getFullYear()} HampiStays — Secular Luxury
        </p>
      </div>
    </footer>
  );
}
