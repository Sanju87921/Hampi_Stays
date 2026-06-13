import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Shield, Bell } from "lucide-react";
import { apiClient } from "../../utils/apiClient";
import { Button } from "../ui/Button";
import { cn } from "../../utils/cn";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useSystem } from "../../context/SystemContext";
import { useProtectedAction } from "../../hooks/useProtectedAction";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "../ui/LanguageSwitcher";
import { CurrencySwitcher } from "../ui/CurrencySwitcher";
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
      { name: t("navbar.overview", "Overview"), path: "/dashboard" },
      { name: t("navbar.myTours", "My Tours"), path: "/dashboard/tours" },
      { name: "Calendar", path: "/dashboard/calendar" },
      { name: "Bookings", path: "/dashboard/bookings-expert" },
      { name: "Earnings", path: "/dashboard/earnings" },
      { name: t("navbar.profile", "Profile"), path: "/dashboard/expert-profile" },
      { name: "KYC Docs", path: "/dashboard/kyc" },
    ]
  : user?.role?.toUpperCase() === 'TRAVELLER'
 ? [
 { name: t("navbar.dashboard", "Dashboard"), path: "/dashboard" },
 { name: t("navbar.bookStays", "Book Stays"), path: "/resorts" },
 { name: t("navbar.wishlist", "Wishlist"), path: "/dashboard/wishlist" },
 { name: t("navbar.bookings", "Bookings"), path: "/dashboard/bookings" },
 { name: t("navbar.profile", "Profile"), path: "/dashboard/profile" },
 ]
 : user?.role?.toUpperCase() === 'ADMIN'
 ? location.pathname === '/admin'
 ? [] // No links on admin landing page - clean hero look
 : [
 { name: t("navbar.profile", "Profile"), path: "/admin/profile" },
 { name: t("navbar.settings", "Settings"), path: "/admin/settings" },
 ]
 : [
 { name: t("navbar.dashboard", "Dashboard"), path: "/dashboard" },
 ]
  : user?.role?.toUpperCase() === 'ADMIN' ? [] 
  : user?.role?.toUpperCase() === 'GUIDE' || user?.role?.toUpperCase() === 'RESORT_OWNER' ? (
    location.pathname === '/' ? [] : [{ name: t("navbar.dashboard", "Dashboard"), path: "/dashboard" }]
  )
  : [
   { name: t("navbar.resorts", "Resorts"), path: "/resorts" },
   { name: t("navbar.exploreGuides", "Explore Guides"), path: "/guides" },
   { name: t("navbar.discover", "Discover"), path: "/discovery" },
   ...(user ? [{ name: t("navbar.dashboard", "Dashboard"), path: "/dashboard" }] : []),
  ];

  const darkHeroPages = [
    "/",
    "/admin",
    "/discovery",
    "/gallery",
    "/guides",
    "/destination-guide",
    "/contact",
  ];
  const isHeroPage = darkHeroPages.some(p => 
    location.pathname === p || location.pathname.startsWith("/guides/")
  );
  // Scrolled → frosted glass bg + dark text on ALL pages for legibility
  const isSolidBg = isScrolled;
  const useDarkText = isScrolled ? true : !isHeroPage;

 return (
 <motion.nav 
   initial={{ y: 0 }} 
   animate={{ y: isVisible ? 0 : -100 }} 
   transition={{ duration: 0.3, ease: "easeInOut" }} 
   className={cn(
     "fixed top-0 left-0 right-0 z-50 transition-all duration-700 ease-[0.16,1,0.3,1]", 
     isSolidBg 
       ? "bg-white/90 backdrop-blur-2xl border-b border-sand-200 shadow-sm py-2 md:py-1.5" 
       : "bg-transparent py-4 md:py-[1.15rem]"
   )}
 >
 <div className="container mx-auto px-4 md:px-6">
  <div className="flex lg:grid lg:grid-cols-[1fr_auto_1fr] items-center justify-between w-full">
  {/* Left Section: Logo & Admin Badge */}
  <div className="flex items-center justify-start gap-4 z-10">
  <Link 
   to={user?.role?.toUpperCase() === 'ADMIN' ? "/admin" : user?.role?.toUpperCase() === 'RESORT_OWNER' ? "/dashboard" : "/"} 
  className="flex items-center justify-start"
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
  "h-16 md:h-[72px] w-auto object-contain transition-all duration-500 pb-1",
  !useDarkText ? "brightness-0 invert opacity-90 hover:opacity-100" : "opacity-90 hover:opacity-100"
  )}
  />
  </Link>
  {user?.role?.toUpperCase() === 'ADMIN' && (
  <div className={cn(
  "hidden lg:flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border transition-all duration-300",
  useDarkText ? "bg-navy-950 text-white border-navy-950/20 shadow-md" : "bg-white/15 text-white border-white/30 backdrop-blur-md shadow-sm"
  )}>
  <div className="relative flex h-2 w-2 mr-2">
  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
  </div>
  <Shield className="w-3 h-3 mr-1.5" />
  {t("navbar.administrator", "Administrator")}
  </div>
  )}
  </div>

  {/* Center Section: Navigation Links */}
  <div className="hidden lg:flex justify-center items-center z-20">
    <div className="flex items-center gap-6 xl:gap-10 px-4">
    {navLinks.map((link) => {
    const isActive = location.pathname === link.path;
    return (
    <Link
    key={link.name}
    to={link.path}
    className={cn(
    "relative text-[11px] xl:text-[12px] uppercase tracking-[0.2em] font-bold transition-all duration-500 group py-2 whitespace-nowrap",
    useDarkText ? "text-navy-950 hover:text-gold-600" : "text-white hover:text-gold-300"
    )}
    >
    <span className="relative z-10">{link.name}</span>
    <span 
    className={cn(
    "absolute -bottom-1 left-0 w-full h-[2px] rounded-full transform origin-right transition-transform duration-500 ease-out",
    isActive ? "scale-x-100 origin-left bg-gold-500" : "scale-x-0 group-hover:scale-x-100 group-hover:origin-left bg-gold-500/50"
    )}
    />
    </Link>
    );
    })}
    </div>
  </div>

  {/* Right Section: Actions & Mobile Toggle */}
  <div className="flex justify-end items-center gap-4 xl:gap-5 z-10">
  {/* Desktop Actions */}
  <div className="hidden lg:flex items-center gap-4 xl:gap-6">
 <CurrencySwitcher useDarkText={useDarkText} />
 <LanguageSwitcher useDarkText={useDarkText} />
 {isAuthenticated ? (
 <div className="flex items-center gap-6">
  <NotificationBell useDarkText={useDarkText} />
 <button
 onClick={logout}
 className={cn(
 "px-5 py-2 rounded-full text-[11px] uppercase tracking-[0.15em] font-bold border transition-all duration-300",
 useDarkText ? "border-navy-200 text-navy-950 hover:bg-navy-950 hover:text-white" : "border-white/60 text-white hover:bg-white hover:text-navy-950 hover:border-white"
 )}
 >
 {t("navbar.logout", "Logout")}
 </button>
 </div>
 ) : (
 <div className="flex items-center gap-6">
 <Link
 to="/login"
 className={cn(
 "text-[12px] uppercase tracking-[0.15em] font-bold transition-all duration-300 hover:opacity-70",
 useDarkText ? "text-navy-950 " : "text-white"
 )}
 >
 {t("navbar.signIn")}
 </Link>
 <Button
 variant="primary"
 className={cn(
 "px-8 h-11 rounded-full transition-all duration-500 hover:-translate-y-0.5 border-none uppercase tracking-[0.2em] text-[10px] font-black",
 useDarkText ? "bg-navy-950 text-white hover:bg-gold-600 hover:text-navy-950 shadow-2xl shadow-navy-950/20" : "bg-gold-500 text-navy-950 hover:bg-gold-400 hover:text-navy-950 shadow-2xl shadow-gold-500/20"
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
 className="lg:hidden p-2"
 onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
 aria-label="Toggle navigation menu"
 >
 {isMobileMenuOpen ? (
 <X className={cn("w-6 h-6", useDarkText ? "text-navy-950 " : "text-white")} />
 ) : (
 <Menu className={cn("w-6 h-6", useDarkText ? "text-navy-950 " : "text-white")} />
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
 <img src="/logo-full.png" alt="HampiStays" className="h-28 w-auto object-contain" onError={(e) => {
  const target = e.target as HTMLImageElement;
  if (!target.src.includes('logo.png')) {
    target.src = "/logo.png";
  } else {
    target.style.display = 'none';
  }
 }} />
 {isAuthenticated && (
 <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
 <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
 <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">{t("navbar.secureSession", "Secure Session")}</span>
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
 <div className="flex justify-center gap-4 mb-2">
 <CurrencySwitcher useDarkText={useDarkText} />
 <LanguageSwitcher useDarkText={useDarkText} />
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
 {t("navbar.logout", "Logout")}
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

// ── Notification Bell ──────────────────────────────────────────────────────
// ── Notification Bell ──────────────────────────────────────────────────────
function NotificationBell({ useDarkText }: { useDarkText: boolean }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const data = await apiClient.get<any[]>('/users/notifications');
        const arr = Array.isArray(data) ? data : [];
        // Sort notifications so unread are first, then newest
        arr.sort((a, b) => {
          if (a.isRead === b.isRead) return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          return a.isRead ? 1 : -1;
        });
        setNotifications(arr);
      } catch {
        // silently fail
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleNotificationClick = async (notif: any) => {
    setIsOpen(false);
    
    if (!notif.isRead) {
      try {
        await apiClient.put(`/users/notifications/${notif.id}/read`, {});
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
      } catch (err) {
        console.error("Failed to mark as read", err);
      }
    }

    const type = notif.type?.toLowerCase() || '';
    if (type.includes('booking')) navigate('/dashboard/bookings');
    else if (type.includes('kyc') || type.includes('verification')) navigate('/dashboard/profile');
    else if (type.includes('review')) navigate('/dashboard/reviews');
    else if (type.includes('promotion') || type.includes('offer')) navigate('/resorts');
    else navigate('/dashboard/notifications');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full transition-all duration-300 hover:scale-110"
        title="Notifications"
        aria-label="Toggle notifications"
      >
        <Bell className={cn(
          "w-5 h-5",
          useDarkText ? "text-navy-950" : "text-white"
        )} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-gold-500 text-navy-950 text-[10px] font-black rounded-full flex items-center justify-center px-1 shadow-md animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-sand-200 overflow-hidden z-50 origin-top-right"
          >
            <div className="p-4 border-b border-sand-100 flex justify-between items-center bg-sand-50/50">
              <h3 className="font-bold text-navy-950 text-sm tracking-wide uppercase">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-black uppercase text-gold-600 bg-gold-500/10 px-2 py-1 rounded-full">
                  {unreadCount} New
                </span>
              )}
            </div>
            
            <div className="max-h-[360px] overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center">
                  <div className="w-12 h-12 bg-sand-100 rounded-full flex items-center justify-center mb-3">
                    <Bell className="w-5 h-5 text-sand-400" />
                  </div>
                  <p className="text-sm font-medium text-navy-800">No notifications yet</p>
                  <p className="text-xs text-navy-500 mt-1">We'll let you know when something arrives.</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {notifications.slice(0, 5).map(n => (
                    <button
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={cn(
                        "p-4 text-left border-b border-sand-100 hover:bg-sand-50 transition-colors relative group",
                        !n.isRead && "bg-sand-50/30"
                      )}
                    >
                      {!n.isRead && <span className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-gold-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]" />}
                      <div className={cn("pl-3 transition-transform duration-200 group-hover:translate-x-1", !n.isRead ? "" : "pl-3")}>
                        <p className={cn("text-xs font-bold mb-1", !n.isRead ? "text-navy-950" : "text-navy-700")}>{n.title}</p>
                        <p className="text-xs text-navy-600 line-clamp-2 leading-relaxed">{n.message}</p>
                        <p className="text-[10px] text-navy-400 mt-2 font-medium uppercase tracking-wider">
                          {new Date(n.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {notifications.length > 0 && (
              <div className="p-3 border-t border-sand-100 bg-sand-50/50 text-center hover:bg-sand-100 transition-colors">
                <Link
                  to="/dashboard/notifications"
                  onClick={() => setIsOpen(false)}
                  className="text-xs font-bold text-gold-600 hover:text-gold-700 uppercase tracking-widest block w-full"
                >
                  View All Notifications
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
