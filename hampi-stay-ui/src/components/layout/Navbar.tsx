import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "../ui/Button";
import { cn } from "../../utils/cn";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, logout, user, setShowAuthModal } = useAuth();
  const [guideServiceEnabled, setGuideServiceEnabled] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Determine if scrolled for styling
      setIsScrolled(currentScrollY > 50);

      // Smart hide/show logic
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down - hide
        setIsVisible(false);
      } else {
        // Scrolling up or at top - show
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });

    fetch("/api/settings")
      .then(res => res.json())
      .then(data => setGuideServiceEnabled(data.guideServiceEnabled))
      .catch(err => console.error(err));

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isDashboard = location.pathname.startsWith("/dashboard");

  const navLinks = isDashboard 
    ? user?.role === 'GUIDE'
      ? [
          { name: "Overview", path: "/dashboard" },
          { name: "My Tours", path: "/dashboard?tab=tours" },
          { name: "My Profile", path: "/dashboard?tab=profile" },
          { name: "Bookings", path: "/dashboard?tab=bookings" },
          { name: "Settings", path: "/dashboard?tab=settings" },
        ]
      : user?.role === 'TRAVELLER'
        ? [
            { name: "Overview", path: "/dashboard" },
            { name: "Wishlist", path: "/dashboard/wishlist" },
            { name: "My Bookings", path: "/dashboard/bookings" },
            { name: "Notifications", path: "/dashboard/notifications" },
            { name: "Profile", path: "/dashboard/profile" },
          ]
        : [
            { name: "Overview", path: "/dashboard" },
            { name: "Properties", path: "/dashboard?tab=properties" },
            { name: "Bookings", path: "/dashboard?tab=bookings" },
            { name: "Profile", path: "/dashboard/profile" },
            { name: "Settings", path: "/dashboard?tab=settings" },
          ]
    : [
    { name: "Resorts", path: "/resorts" },
    ...(guideServiceEnabled ? [
      { name: "Experiences", path: "/experiences" },
      { name: "Experts", path: "/guide" },
      { name: "Discover", path: "/discovery" }
    ] : []),
    { name: "About", path: "/about" },
  ];

  return (
    <motion.nav
      initial={{ y: 0 }}
      animate={{ y: isVisible ? 0 : -100 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-700 ease-[0.16,1,0.3,1]",
        isScrolled
          ? "bg-sand-50/90 backdrop-blur-2xl border-b border-sand-200/60 shadow-sm py-1.5"
          : "bg-gradient-to-b from-navy-950/80 via-navy-950/30 to-transparent py-3.5 md:py-[1.15rem]"
      )}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between relative">
          {/* Logo (Centered on mobile, Left on desktop) */}
          <Link 
            to={user?.role === 'RESORT_OWNER' ? "/dashboard" : "/"} 
            className="flex items-center group z-10 absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0"
          >
            <img 
              src="/logo-full.png" 
              alt="HampiStays" 
              className={cn(
                "h-20 md:h-[5.5rem] w-auto object-contain transition-all duration-500",
                !isScrolled && "brightness-0 invert opacity-90 hover:opacity-100"
              )}
            />
          </Link>

          {/* Desktop Nav (Center) */}
          <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-8">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={cn(
                    "relative text-[13px] uppercase tracking-[0.15em] font-semibold transition-colors duration-300 group py-2",
                    isScrolled ? "text-navy-900 hover:text-gold-600" : "text-white/90 hover:text-gold-400"
                  )}
                >
                  {link.name}
                  <span 
                    className={cn(
                      "absolute bottom-0 left-0 w-full h-[2px] rounded-full transform origin-left transition-transform duration-300 ease-out",
                      isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
                      isScrolled ? "bg-gold-500" : "bg-gold-400"
                    )}
                  />
                </Link>
              );
            })}
          </div>

          {/* Desktop Actions (Right) */}
          <div className="hidden md:flex items-center gap-5 z-10">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className={cn(
                    "text-[13px] uppercase tracking-[0.1em] font-semibold transition-colors duration-300 hover:text-gold-500",
                    isScrolled ? "text-navy-900" : "text-gold-400"
                  )}
                >
                  Dashboard
                </Link>
                <button
                  onClick={logout}
                  className={cn(
                    "text-[13px] uppercase tracking-[0.1em] font-semibold transition-colors duration-300 hover:opacity-70",
                    isScrolled ? "text-navy-900" : "text-white"
                  )}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowAuthModal(true, "login")}
                  className={cn(
                    "text-[13px] uppercase tracking-[0.1em] font-semibold transition-colors duration-300 hover:opacity-70",
                    isScrolled ? "text-navy-900" : "text-white"
                  )}
                >
                  Log in
                </button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowAuthModal(true, "register")}
                  className={cn(
                    "transition-all duration-500 hover:-translate-y-0.5 border-none uppercase tracking-widest text-[11px] font-bold",
                    isScrolled 
                      ? "bg-navy-950 text-white hover:bg-gold-500 hover:text-navy-950 shadow-luxury" 
                      : "bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-gold-500/90 hover:text-navy-950"
                  )}
                >
                  Book Now
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className={cn("w-6 h-6", isScrolled ? "text-navy-950" : "text-white")} />
            ) : (
              <Menu className={cn("w-6 h-6", isScrolled ? "text-navy-950" : "text-white")} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="absolute top-full left-0 right-0 bg-sand-50/95 backdrop-blur-2xl shadow-luxury border-t border-sand-200/50 flex flex-col md:hidden overflow-hidden"
          >
            <div className="py-6 px-6 flex flex-col gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className="text-navy-950 font-serif text-2xl font-bold border-b border-sand-200 pb-4 hover:text-gold-600 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <div className="flex flex-col gap-4 mt-2">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setShowAuthModal(true, "login");
                  }}
                  className="text-center font-semibold text-navy-950 py-4 rounded-2xl border border-sand-200 hover:border-gold-400 transition-colors"
                >
                  Log in
                </button>
                <Button 
                  size="lg" 
                  className="w-full h-16 rounded-2xl border-none transition-colors"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setShowAuthModal(true, "register");
                  }}
                >
                  Register
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
