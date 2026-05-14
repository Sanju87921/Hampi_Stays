import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Compass, Calendar, User, Search } from "lucide-react";
import { cn } from "../../utils/cn";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { PremiumIcon } from "../ui/PremiumIcon";

export function MobileDock() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  // Only show for Travelers or Unauthenticated users (public)
  const isOwner = user?.role === "RESORT_OWNER";
  const isAdmin = user?.role === "ADMIN";
  if (isOwner || isAdmin) return null;

  const items = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Search, label: "Explore", path: "/resorts" },
    { icon: Compass, label: "Experiences", path: "/experiences" },
    { icon: Calendar, label: "Bookings", path: "/dashboard/bookings" },
    { icon: User, label: "Profile", path: isAuthenticated ? "/dashboard/profile" : "/login" },
  ];

  return (
    <div className="md:hidden fixed bottom-6 left-0 right-0 z-50 px-4 pointer-events-none">
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-w-md mx-auto bg-navy-950/80 backdrop-blur-xl border border-white/10 rounded-[2rem] p-2 shadow-2xl flex items-center justify-between pointer-events-auto"
      >
        {items.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
          const Icon = item.icon;

          const handleClick = (e: React.MouseEvent, label: string) => {
            if (!isAuthenticated && (label === "Bookings" || label === "Profile")) {
              e.preventDefault();
              navigate("/login");
            }
          };

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={(e) => handleClick(e, item.label)}
              className="relative flex flex-col items-center justify-center py-2 px-4 rounded-2xl transition-all duration-300"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-gold-500/10 rounded-2xl"
                  transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                />
              )}
              
              <PremiumIcon 
                icon={Icon} 
                variant={isActive ? "gold" : "glass"} 
                size="sm" 
                animate={true}
                className={cn("relative z-10", isActive && "drop-shadow-gold")}
              />
              
              <span className={cn(
                "text-[9px] font-bold uppercase tracking-widest mt-1 z-10 transition-colors duration-300",
                isActive ? "text-gold-400" : "text-white/30"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </motion.div>
    </div>
  );
}
