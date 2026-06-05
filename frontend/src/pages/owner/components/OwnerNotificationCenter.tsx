import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Trash2, Calendar, CreditCard, Star, AlertCircle, X, Info } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../utils/apiClient';
import { Button } from '../../../components/ui/Button';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export const OwnerNotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['ownerNotifications'],
    queryFn: async () => {
      const { data } = await apiClient.get('/users/notifications');
      return data;
    },
    refetchInterval: 30000 // poll every 30s for real-time feel
  });

  const markAsRead = useMutation({
    mutationFn: async (id: string) => apiClient.patch(`/users/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ownerNotifications'] })
  });

  const markAllRead = useMutation({
    mutationFn: async () => apiClient.patch(`/users/notifications/read-all`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ownerNotifications'] })
  });

  const deleteNotification = useMutation({
    mutationFn: async (id: string) => apiClient.delete(`/users/notifications/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ownerNotifications'] })
  });

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  const getIcon = (type: string) => {
    if (type.includes('BOOKING')) return <Calendar className="w-5 h-5 text-blue-500" />;
    if (type.includes('PAYMENT')) return <CreditCard className="w-5 h-5 text-green-500" />;
    if (type.includes('REVIEW')) return <Star className="w-5 h-5 text-gold-500" />;
    if (type.includes('KYC') || type.includes('REJECTED')) return <AlertCircle className="w-5 h-5 text-red-500" />;
    return <Info className="w-5 h-5 text-navy-500" />;
  };

  const handleNotificationClick = (n: any) => {
    if (!n.isRead) {
      markAsRead.mutate(n.id);
    }
    
    // Deep-linking logic based on notification type
    if (n.type.includes('BOOKING')) {
      navigate('/owner/dashboard?tab=bookings');
      setIsOpen(false);
    } else if (n.type.includes('REVIEW')) {
      navigate('/owner/dashboard?tab=reviews');
      setIsOpen(false);
    } else if (n.type.includes('KYC') || n.type.includes('REJECTED') || n.type.includes('APPROVED')) {
      navigate('/owner/dashboard?tab=overview');
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-sand-100 transition-colors"
      >
        <Bell className="w-6 h-6 text-navy-900" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40"
            />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-sand-200 z-50 overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-4 border-b border-sand-100 flex items-center justify-between bg-sand-50/50">
                <h3 className="font-serif font-bold text-lg text-navy-950 flex items-center gap-2">
                  <Bell className="w-5 h-5" /> Notifications
                </h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={() => markAllRead.mutate()}
                    className="text-xs font-semibold text-navy-600 hover:text-navy-900 flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>

              <div className="overflow-y-auto flex-1 p-2 space-y-1 custom-scrollbar">
                {isLoading ? (
                  <div className="p-8 text-center text-navy-400">Loading...</div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center text-navy-400 flex flex-col items-center">
                    <Bell className="w-8 h-8 mb-2 opacity-20" />
                    <p>No new notifications</p>
                  </div>
                ) : (
                  notifications.map((n: any) => (
                    <div 
                      key={n.id} 
                      onClick={() => handleNotificationClick(n)}
                      className={`relative p-4 rounded-xl transition-all cursor-pointer hover:bg-sand-100 ${n.isRead ? 'bg-transparent opacity-75' : 'bg-sand-50 border border-sand-100 shadow-sm'}`}
                    >
                      <div className="flex gap-3">
                        <div className="shrink-0 mt-1">
                          {getIcon(n.type)}
                        </div>
                        <div className="flex-1 pr-6">
                          <h4 className={`text-sm ${n.isRead ? 'font-medium' : 'font-bold'} text-navy-950`}>
                            {n.title}
                          </h4>
                          <p className="text-xs text-navy-700 mt-1 leading-relaxed">
                            {n.message}
                          </p>
                          <span className="text-[10px] text-navy-400 mt-2 block font-medium">
                            {format(new Date(n.createdAt), 'MMM d, h:mm a')}
                          </span>
                        </div>
                      </div>

                      <div className="absolute top-3 right-3 flex flex-col gap-2">
                        {!n.isRead && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); markAsRead.mutate(n.id); }}
                            className="p-1.5 hover:bg-white rounded-full text-navy-400 hover:text-green-600 transition-colors shadow-sm bg-white/50"
                            title="Mark as read"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button 
                          onClick={(e) => { e.stopPropagation(); deleteNotification.mutate(n.id); }}
                          className="p-1.5 hover:bg-red-50 hover:text-red-700 rounded-full text-navy-400 hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
