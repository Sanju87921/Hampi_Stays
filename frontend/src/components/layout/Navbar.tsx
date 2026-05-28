import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Shield } from "lucide-react";
import { Button } from "../ui/Button";
import { cn } from "../../utils/cn";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useSystem } from "../../context/SystemContext";
import { useProtectedAction } from "../../hooks/useProtectedAction";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "../ui/LanguageSwitcher";
export function Navbar() {
 const [isScrolled, setIsScrolled] = useState(false);
 const [isVisible, setIsVisible] = useState(true);
 const [lastScrollY, setLastScrollY] = useState(0);
 const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
 const location = useLocation();
 const navigate = useNavigate();
 const { isAuthenticated, logout, user, setShowAuthModal } = useAuth();
 const { protect } = useProtectedAction();
 const { settings } = useSystem();
 const guideServiceEnabled = settings?.guideServiceEnabled ?? true;
 const { t } = useTranslation();

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
 return () => window.removeEventListener("scroll", handleScroll);
 }, []);

 const isDashboard = location.pathname.startsWith("/dashboard") || location.pathname.startsWith("/admin");

 const navLinks = isDashboard 
 ? user?.role?.toUpperCase() === 'GUIDE'
 ? [
 { name: t("navbar.dashboard"), path: "/dashboard" },
 { name: "My Tours", path: "/dashboard?tab=tours" },
 { name: t("navbar.profile"), path: "/dashboard?tab=profile" },
 { name: t("navbar.bookings"), path: "/dashboard?tab=bookings" },
 { name: "Settings", path: "/dashboard?tab=settings" },
 ]
 : user?.role?.toUpperCase() === 'TRAVELLER'
 ? [
 { name: t("navbar.dashboard"), path: "/dashboard" },
 { name: "Book Stays", path: "/resorts" },
 { name: t("navbar.wishlist"), path: "/dashboard/wishlist" },
 { name: t("navbar.bookings"), path: "/dashboard/bookings" },
 { name: "Notifications", path: "/dashboard/notifications" },
 { name: t("navbar.profile"), path: "/dashboard/profile" },
 ]
 : user?.role?.toUpperCase() === 'ADMIN'
 ? [
 { name: "Profile", path: "/admin/profile" },
 { name: "Settings", path: "/admin/settings" },
 ]
 : [
 { name: t("navbar.dashboard"), path: "/dashboard" },
 { name: "Properties", path: "/dashboard?tab=properties" },
 { name: t("navbar.bookings"), path: "/dashboard?tab=bookings" },
 { name: t("navbar.profile"), path: "/dashboard/profile" },
 { name: "Settings", path: "/dashboard?tab=settings" },
 ]
 : [
 { name: t("navbar.resorts"), path: "/resorts" },
 { name: t("navbar.discover"), path: "/discovery" },
 ];

 return (
 <motion.nav
 initial={{ y: 0 }}
 animate={{ y: isVisible ? 0 : -100 }}
 transition={{ duration: 0.3, ease: "easeInOut" }}
 className={cn(
 "fixed top-0 left-0 right-0 z-50 transition-all duration-700 ease-[0.16,1,0.3,1]",
 isScrolled
 ? "bg-sand-50 backdrop-blur-2xl border-b border-sand-200 shadow-sm py-2 md:py-1.5"
 : "bg-gradient-to-b from-navy-950/80 via-navy-950/30 to-transparent py-4 md:py-[1.15rem]"
 )}
 >
 <div className="container mx-auto px-4 md:px-6">
 <div className="flex items-center justify-between">
 {/* Mobile Left Spacer (to help center logo) */}
 <div className="flex-1 md:hidden" />

 {/* Logo & Admin Badge */}
 <div className="flex items-center gap-4 flex-1 md:flex-none z-10">
 <Link 
 to={user?.role?.toUpperCase() === 'ADMIN' ? "/admin" : user?.role?.toUpperCase() === 'RESORT_OWNER' ? "/dashboard" : "/"} 
 className="flex items-center justify-center md:justify-start"
 >
 <img 
 src="/logo.png" 
 alt="HampiStays" 
 onError={(e) => {
 const target = e.target as HTMLImageElement;
 target.src = "/favicon.svg";
 target.className = "h-8 w-auto opacity-50";
 }}
 className={cn(
 "h-20 w-auto object-contain transition-all duration-500",
 !isScrolled && "brightness-0 invert opacity-90 hover:opacity-100"
 )}
 />
 </Link>
 {user?.role?.toUpperCase() === 'ADMIN' && (
 <div className={cn(
 "hidden md:flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border transition-all duration-300",
 isScrolled ? "bg-navy-950 text-white border-navy-950/20 shadow-md" : "bg-white/15 text-white border-white/30 backdrop-blur-md shadow-sm"
 )}>
 <div className="relative flex h-2 w-2 mr-2">
 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
 <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
 </div>
 <Shield className="w-3 h-3 mr-1.5" />
 Administrator
 </div>
 )}
 </div>

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
 <LanguageSwitcher />
 {isAuthenticated ? (
 <div className="flex items-center gap-6">
 <button
 onClick={logout}
 className={cn(
 "px-5 py-2 rounded-full text-[11px] uppercase tracking-[0.15em] font-bold border transition-all duration-300",
 isScrolled 
 ? "border-navy-200 text-navy-950 hover:bg-navy-950 hover:text-white" 
 : "border-white/20 text-white hover:bg-white "
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
 isScrolled ? "text-navy-950 " : "text-white"
 )}
 >
 {t("navbar.signIn")}
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
 protect(
 () => navigate("/resorts"),
 { message: "Unlock Luxury Bookings", view: "register" }
 );
 }}
 >
 {t("common.bookNow")}
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
 <X className={cn("w-6 h-6", isScrolled ? "text-navy-950 " : "text-white")} />
 ) : (
 <Menu className={cn("w-6 h-6", isScrolled ? "text-navy-950 " : "text-white")} />
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
 className="absolute top-full left-0 right-0 bg-sand-50 backdrop-blur-2xl shadow-luxury border-t border-sand-200 flex flex-col md:hidden overflow-hidden"
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
 className="text-navy-950 font-serif text-xl sm:text-2xl font-bold border-b border-sand-200 pb-3 sm:pb-4 hover:text-gold-600 transition-colors"
 onClick={() => setIsMobileMenuOpen(false)}
 >
 {link.name}
 </Link>
 ))}
 <div className="flex flex-col gap-3 sm:gap-4 mt-2">
 <div className="flex justify-center mb-2">
 <LanguageSwitcher />
 </div>
 {!isAuthenticated ? (
 <>
 <button
 onClick={() => {
 setIsMobileMenuOpen(false);
 navigate("/login");
 }}
 className="w-full text-center font-bold text-navy-950 py-4 rounded-2xl border border-sand-200 hover:border-gold-400 transition-colors block text-sm"
 >
 {t("navbar.signIn")}
 </button>
 <button 
 onClick={() => {
 setIsMobileMenuOpen(false);
 navigate("/register");
 }}
 className="w-full"
 >
 <Button 
 size="lg" 
 className="w-full h-14 sm:h-16 rounded-2xl border-none shadow-gold text-sm"
 >
 {t("common.bookNow")}
 </Button>
 </button>
 </>
 ) : (
 <button
 onClick={() => {
 setIsMobileMenuOpen(false);
 logout();
 }}
 className="w-full h-14 sm:h-16 rounded-2xl border border-navy-200 text-navy-950 font-bold text-sm uppercase tracking-[0.15em] hover:bg-navy-950 hover:text-white transition-all duration-300"
 >
 Logout
 </button>
 )}
 </div>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </motion.nav>
 );
}







