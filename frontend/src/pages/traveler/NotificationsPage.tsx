import { motion, AnimatePresence } from "framer-motion";
import { Bell, Info, Calendar, Plane, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { apiClient } from "../../utils/apiClient";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    let active = true;
    const fetchNotifications = async () => {
      try {
        if (isAuthenticated) {
          const data = await apiClient.get<Notification[]>("/users/notifications");
          if (active) {
            setNotifications(Array.isArray(data) ? data : []);
          }
        } else {
          await Promise.resolve();
        }
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    fetchNotifications();
    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  const markAsRead = async (id: string, isRead: boolean) => {
    if (isRead) return;
    try {
      await apiClient.patch(`/users/notifications/${id}/read`);
      setNotifications(prev => (Array.isArray(prev) ? prev.map(n => n.id === id ? { ...n, isRead: true } : n) : []));
    } catch (err) {
      console.error(err);
    }
  };

  const getIconAndStyle = (type: string = "") => {
    const safeType = type || "";
    if (safeType.includes("UPCOMING_STAY")) {
      return { icon: Calendar, color: "text-blue-600", bg: "bg-blue-50" };
    }
    if (safeType.includes("TRAVEL_PREP")) {
      return { icon: Plane, color: "text-sky-600", bg: "bg-sky-50" };
    }
    if (safeType.includes("CHECKIN_REMINDER")) {
      return { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" };
    }
    return { icon: Bell, color: "text-gold-600", bg: "bg-gold-50" };
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return "Just now";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "Just now";
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    return `${Math.floor(diff/86400)}d ago`;
  };

  return (
    <div className="min-h-screen bg-sand-50/50 pt-28 pb-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <header className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-serif font-bold text-navy-950 mb-2">Notifications</h1>
            <p className="text-navy-950/50">Stay updated with your latest bookings and alerts.</p>
          </div>
          {notifications.filter(n => !n.isRead).length > 0 && (
            <div className="bg-gold-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
              {notifications.filter(n => !n.isRead).length} New
            </div>
          )}
        </header>

        <div className="bg-white rounded-[2.5rem] border border-sand-100 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-20 text-center animate-pulse">
              <div className="w-16 h-16 bg-sand-100 rounded-full mx-auto mb-4" />
              <div className="h-4 bg-sand-100 rounded w-1/3 mx-auto mb-2" />
              <div className="h-3 bg-sand-100 rounded w-1/4 mx-auto" />
            </div>
          ) : notifications.length > 0 ? (
            <div className="divide-y divide-sand-50">
              <AnimatePresence>
                {notifications.map((n, i) => {
                  const { icon: Icon, color, bg } = getIconAndStyle(n.type);
                  return (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => markAsRead(n.id, n.isRead)}
                      className={`p-8 flex items-start gap-6 transition-all duration-300 group cursor-pointer ${n.isRead ? 'opacity-60 bg-white hover:bg-sand-50/30' : 'bg-sand-50/20 hover:bg-sand-50/60'}`}
                    >
                      <div className={`w-12 h-12 rounded-2xl ${bg} flex items-center justify-center shrink-0 border border-white shadow-sm relative`}>
                        <Icon className={`w-6 h-6 ${color}`} />
                        {!n.isRead && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full animate-pulse" />
                        )}
                      </div>
                      <div className="flex-grow">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className={`font-bold ${!n.isRead ? 'text-navy-950' : 'text-navy-950/70'}`}>{n.title}</h3>
                          <span className="text-[10px] font-bold text-navy-950/30 uppercase tracking-widest shrink-0">{formatTime(n.createdAt)}</span>
                        </div>
                        <p className={`text-sm leading-relaxed ${!n.isRead ? 'text-navy-950/80 font-medium' : 'text-navy-950/50'}`}>
                          {n.message}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          ) : (
            <div className="p-20 text-center">
              <div className="w-16 h-16 bg-sand-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-navy-950/20" />
              </div>
              <h3 className="text-xl font-bold text-navy-950 mb-2">All caught up!</h3>
              <p className="text-navy-950/50">No new notifications at this time.</p>
            </div>
          )}
        </div>

        <div className="mt-8 p-6 bg-gold-50 border border-gold-100 rounded-3xl flex items-center gap-4">
          <Info className="w-5 h-5 text-gold-600 shrink-0" />
          <p className="text-xs text-navy-950/60 leading-relaxed">
            <b>Pro Tip:</b> Our digital concierge automatically monitors your upcoming stays and sends helpful preparations 7 days before your arrival.
          </p>
        </div>
      </div>
    </div>
  );
}
