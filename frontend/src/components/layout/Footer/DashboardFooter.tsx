import { Link } from "react-router-dom";

export function DashboardFooter() {
  return (
    <footer className="bg-white  py-6 border-t border-sand-100  mt-auto">
      <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-xs font-bold text-navy-950   uppercase tracking-widest">
          © {new Date().getFullYear()} HampiStays
        </p>
        <div className="flex items-center gap-6">
          <Link to="/privacy" className="text-xs font-bold uppercase tracking-widest text-navy-950   hover:text-navy-950  transition-colors">Privacy</Link>
          <Link to="/terms" className="text-xs font-bold uppercase tracking-widest text-navy-950   hover:text-navy-950  transition-colors">Terms</Link>
          <Link to="/contact" className="text-xs font-bold uppercase tracking-widest text-navy-950   hover:text-navy-950  transition-colors">Help</Link>
        </div>
      </div>
    </footer>
  );
}
