import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X, MessageCircle, Loader2 } from "lucide-react";
import { apiClient } from "../../utils/apiClient";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/Button";

interface Message {
  id: string;
  text: string;
  senderId: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
}

interface GuideChatProps {
  bookingId: string;
  guideName: string;
  travellerName: string;
  onClose: () => void;
}

export function GuideChat({ bookingId, guideName, travellerName, onClose }: GuideChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000); // Poll every 3s
    return () => clearInterval(interval);
  }, [bookingId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const data = await apiClient.get<Message[]>(`/guide-bookings/${bookingId}/messages`);
      setMessages(data);
    } catch (err) {
      console.error("Failed to fetch messages", err);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      const msg = await apiClient.post<Message>(`/guide-bookings/${bookingId}/messages`, { text: newMessage });
      setMessages(prev => [...prev, msg]);
      setNewMessage("");
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setIsSending(false);
    }
  };

  const otherName = user?.role === 'GUIDE' ? travellerName : guideName;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-6 right-6 w-[400px] h-[600px] max-h-[80vh] bg-white rounded-3xl shadow-2xl border border-sand-100 flex flex-col z-[100] overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 bg-navy-950 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gold-500/20 flex items-center justify-center border border-gold-500/30">
            <MessageCircle className="w-5 h-5 text-gold-500" />
          </div>
          <div>
            <h3 className="font-bold font-serif">{otherName}</h3>
            <p className="text-[10px] text-white/60 uppercase tracking-widest">In-App Chat</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-sand-50/30">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
            <MessageCircle className="w-12 h-12 mb-2" />
            <p className="text-sm">No messages yet.</p>
            <p className="text-xs">Say hi and confirm the meeting point!</p>
          </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.senderId === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl p-3 ${isMe ? 'bg-navy-950 text-white rounded-tr-sm' : 'bg-white border border-sand-100 text-navy-950 rounded-tl-sm'}`}>
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                  <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-white/40' : 'text-navy-950/40'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-4 bg-white border-t border-sand-100 flex gap-2">
        <input 
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-sand-50 border border-sand-100 rounded-full px-4 text-sm outline-none focus:border-gold-500 transition-colors"
        />
        <Button 
          type="submit" 
          disabled={!newMessage.trim() || isSending}
          className="w-10 h-10 rounded-full bg-gold-500 hover:bg-gold-400 text-navy-950 p-0 flex items-center justify-center"
        >
          {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </form>
    </motion.div>
  );
}
