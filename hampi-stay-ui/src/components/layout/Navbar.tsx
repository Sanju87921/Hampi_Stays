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

    fetch(`${import.meta.env.VITE_API_URL}/api/settings`)
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
          ? "bg-sand-50/90 backdrop-blur-2xl border-b border-sand-200/60 shadow-sm py-2 md:py-1.5"
          : "bg-gradient-to-b from-navy-950/80 via-navy-950/30 to-transparent py-4 md:py-[1.15rem]"
      )}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          {/* Mobile Left Spacer (to help center logo) */}
          <div className="flex-1 md:hidden" />

          {/* Logo */}
          <Link 
            to={user?.role === 'RESORT_OWNER' ? "/dashboard" : "/"} 
            className="flex items-center justify-center md:justify-start flex-1 md:flex-none z-10"
          >
            <img 
              src="/logo-full.png" 
              alt="HampiStays" 
              className={cn(
                "h-20 w-auto object-contain transition-all duration-500",
                !isScrolled && "brightness-0 invert opacity-90 hover:opacity-100"
              )}
            />
          </Link>

          {/* Desktop Nav (Center) */}
          <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-10 z-20">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={cn(
                    "relative text-[12px] uppercase tracking-[0.2em] font-bold transition-all duration-500 group py-2",
                    isScrolled 
                      ? "text-navy-950 hover:text-gold-600" 
                      : "text-white hover:text-gold-400"
                  )}
                >
                  <span className="relative z-10">{link.name}</span>
                  <span 
                    className={cn(
                      "absolute -bottom-1 left-0 w-full h-[1.5px] rounded-full transform origin-right transition-transform duration-500 ease-out",
                      isActive ? "scale-x-100 origin-left bg-gold-500" : "scale-x-0 group-hover:scale-x-100 group-hover:origin-left",
                      isScrolled ? "bg-gold-500" : "bg-gold-400"
                    )}
                  />
                </Link>
              );
            })}
          </div>

          {/* Right Side (Desktop Actions & Mobile Toggle) */}
          <div className="flex-1 flex justify-end items-center gap-5 z-10">
            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-6">
              {isAuthenticated ? (
                <div className="flex items-center gap-6">
                  <Link
                    to="/dashboard"
                    className={cn(
                      "text-[12px] uppercase tracking-[0.15em] font-bold transition-all duration-300 hover:text-gold-500",
                      isScrolled ? "text-navy-950" : "text-gold-400"
                    )}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={logout}
                    className={cn(
                      "px-5 py-2 rounded-full text-[11px] uppercase tracking-[0.15em] font-bold border transition-all duration-300",
                      isScrolled 
                        ? "border-navy-200 text-navy-950 hover:bg-navy-950 hover:text-white" 
                        : "border-white/20 text-white hover:bg-white/10"
                    )}
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-6">
                  <Link
                    to="/login"
                    className={cn(
                      "text-[12px] uppercase tracking-[0.15em] font-bold transition-all duration-300 hover:opacity-70",
                      isScrolled ? "text-navy-950" : "text-white"
                    )}
                  >
                    Log in
                  </Link>
                  <Button
                    variant="primary"
                    className={cn(
                      "px-8 h-11 rounded-full transition-all duration-500 hover:-translate-y-0.5 border-none uppercase tracking-[0.2em] text-[10px] font-black",
                      isScrolled 
                        ? "bg-navy-950 text-white hover:bg-gold-600 hover:text-navy-950 shadow-2xl shadow-navy-950/20" 
                        : "bg-gold-500 text-navy-950 hover:bg-white hover:text-navy-950 shadow-2xl shadow-gold-500/20"
                    )}
                    onClick={() => {
                      if (isAuthenticated) {
                        window.location.href = "/resorts";
                      } else {
                        setShowAuthModal(true, "register");
                      }
                    }}
                  >
                    Book Now
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 -mr-2"
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
            <div className="py-8 px-6 flex flex-col gap-6">
              <Link 
                to="/" 
                className="mb-4 self-center flex flex-col items-center gap-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <img src="/logo-full.png" alt="HampiStays" className="h-28 w-auto object-contain" />
                {isAuthenticated && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">Secure Session</span>
                  </div>
                )}
              </Link>

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
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-center font-semibold text-navy-950 py-4 rounded-2xl border border-sand-200 hover:border-gold-400 transition-colors block"
                >
                  Log in
                </Link>
                <Link to="/register" className="w-full" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button 
                    size="lg" 
                    className="w-full h-16 rounded-2xl border-none transition-colors"
                  >
                    Register
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
