/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HeadphonesIcon, Search, RefreshCw, Send, ChevronDown,
  Clock, CheckCircle, XCircle, AlertTriangle, MessageSquare,
  User, Calendar, Tag, Loader2, ArrowLeft, Circle,
  Inbox, Filter, MoreVertical, Flame, AlertCircle,
  Building2, Mail, Phone
} from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { apiClient } from "../../../utils/apiClient";
import toast from "react-hot-toast";
import { cn } from "../../../utils/cn";

// ─── Types ────────────────────────────────────────────────────────────────────
type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

interface TicketMessage {
  id: string;
  sender: "USER" | "ADMIN";
  senderName: string;
  content: string;
  createdAt: string;
}

interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  status: TicketStatus;
  priority: TicketPriority;
  userName: string;
  userEmail: string;
  userPhone?: string;
  resortName?: string;
  bookingId?: string;
  messages: TicketMessage[];
  createdAt: string;
  updatedAt: string;
}

// ─── Config maps ──────────────────────────────────────────────────────────────
const STATUS_CFG: Record<TicketStatus, { label: string; color: string; bg: string; icon: any }> = {
  OPEN:        { label: "Open",        color: "text-blue-700",    bg: "bg-blue-50 border-blue-200",     icon: Circle },
  IN_PROGRESS: { label: "In Progress", color: "text-amber-700",   bg: "bg-amber-50 border-amber-200",   icon: Clock },
  RESOLVED:    { label: "Resolved",    color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200",icon: CheckCircle },
  CLOSED:      { label: "Closed",      color: "text-slate-500",   bg: "bg-slate-50 border-slate-200",   icon: XCircle },
};

const PRIORITY_CFG: Record<TicketPriority, { label: string; color: string; dot: string; icon: any }> = {
  LOW:    { label: "Low",    color: "text-slate-500",   dot: "bg-slate-300",  icon: Circle },
  MEDIUM: { label: "Medium", color: "text-blue-600",    dot: "bg-blue-400",   icon: AlertCircle },
  HIGH:   { label: "High",   color: "text-amber-600",   dot: "bg-amber-400",  icon: AlertTriangle },
  URGENT: { label: "Urgent", color: "text-red-600",     dot: "bg-red-500",    icon: Flame },
};

const CATEGORIES = ["Booking Issue", "Payment", "Refund", "Resort Quality", "Account", "Technical", "Other"];

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const TicketSkeleton = () => (
  <div className="p-4 border-b border-sand-100 animate-pulse space-y-2">
    <div className="flex justify-between">
      <div className="h-3.5 w-48 bg-sand-200 rounded" />
      <div className="h-5 w-16 bg-sand-100 rounded-full" />
    </div>
    <div className="h-3 w-32 bg-sand-100 rounded" />
    <div className="flex gap-2">
      <div className="h-4 w-20 bg-sand-100 rounded-full" />
      <div className="h-4 w-16 bg-sand-100 rounded-full" />
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export function SupportHelpDeskModule() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [reply, setReply] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [filterStatus, setFilterStatus] = useState<TicketStatus | "ALL">("ALL");
  const [filterPriority, setFilterPriority] = useState<TicketPriority | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ─── Stats ───────────────────────────────────────────────────────────────
  const stats = {
    total:      tickets.length,
    open:       tickets.filter(t => t.status === "OPEN").length,
    inProgress: tickets.filter(t => t.status === "IN_PROGRESS").length,
    resolved:   tickets.filter(t => t.status === "RESOLVED").length,
    urgent:     tickets.filter(t => t.priority === "URGENT").length,
  };

  // ─── Fetch ───────────────────────────────────────────────────────────────
  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient("/api/admin/support/tickets");
      setTickets(data?.tickets || data || []);
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selected?.messages]);

  // ─── Filtered list ───────────────────────────────────────────────────────
  const filtered = tickets.filter(t => {
    const matchStatus   = filterStatus === "ALL"   || t.status === filterStatus;
    const matchPriority = filterPriority === "ALL" || t.priority === filterPriority;
    const q = searchQuery.toLowerCase();
    const matchSearch   = !q || t.subject?.toLowerCase().includes(q) || t.userName?.toLowerCase().includes(q) || t.userEmail?.toLowerCase().includes(q);
    return matchStatus && matchPriority && matchSearch;
  });

  // ─── Send Reply ──────────────────────────────────────────────────────────
  const handleReply = async () => {
    if (!reply.trim() || !selected) return;
    setSendingReply(true);
    try {
      await apiClient(`/api/admin/support/tickets/${selected.id}/reply`, {
        method: "POST",
        body: JSON.stringify({ content: reply.trim() }),
      });
      const newMsg: TicketMessage = {
        id: Date.now().toString(),
        sender: "ADMIN",
        senderName: "Support Team",
        content: reply.trim(),
        createdAt: new Date().toISOString(),
      };
      const updated = { ...selected, messages: [...selected.messages, newMsg], status: "IN_PROGRESS" as TicketStatus };
      setSelected(updated);
      setTickets(prev => prev.map(t => t.id === selected.id ? updated : t));
      setReply("");
      toast.success("Reply sent!");
    } catch {
      toast.error("Failed to send reply.");
    } finally {
      setSendingReply(false);
    }
  };

  // ─── Update Status ───────────────────────────────────────────────────────
  const handleStatusChange = async (status: TicketStatus) => {
    if (!selected) return;
    setUpdatingStatus(true);
    setShowStatusMenu(false);
    try {
      await apiClient(`/api/admin/support/tickets/${selected.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      const updated = { ...selected, status };
      setSelected(updated);
      setTickets(prev => prev.map(t => t.id === selected.id ? updated : t));
      toast.success(`Ticket marked as ${STATUS_CFG[status].label}`);
    } catch {
      toast.error("Failed to update status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // ─── Priority badge ──────────────────────────────────────────────────────
  const PriorityBadge = ({ priority }: { priority: TicketPriority }) => {
    const cfg = PRIORITY_CFG[priority];
    return (
      <span className={cn("inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest", cfg.color)}>
        <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
        {cfg.label}
      </span>
    );
  };

  // ─── Ticket List Panel ───────────────────────────────────────────────────
  const TicketList = () => (
    <div className="flex flex-col h-full">
      {/* Search + Filters */}
      <div className="p-4 border-b border-sand-100 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-navy-950/30" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search tickets..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-sand-200 bg-sand-50 text-navy-950 focus:outline-none focus:ring-2 focus:ring-gold-400/40"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(["ALL", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={cn("px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all",
                filterStatus === s ? "bg-navy-950 text-white border-navy-950" : "bg-white text-navy-950/50 border-sand-200 hover:border-navy-200"
              )}>
              {s === "ALL" ? "All" : STATUS_CFG[s].label}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          <span className="text-[10px] text-navy-950/40 font-bold uppercase tracking-widest self-center">Priority:</span>
          {(["ALL", "URGENT", "HIGH", "MEDIUM", "LOW"] as const).map(p => (
            <button key={p} onClick={() => setFilterPriority(p)}
              className={cn("px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all",
                filterPriority === p ? "bg-navy-950 text-white border-navy-950" : "bg-white text-navy-950/40 border-sand-100 hover:border-navy-200"
              )}>
              {p === "ALL" ? "All" : PRIORITY_CFG[p].label}
            </button>
          ))}
        </div>
      </div>

      {/* Ticket Items */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          [1, 2, 3, 4, 5].map(i => <TicketSkeleton key={i} />)
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center">
            <Inbox className="w-10 h-10 text-sand-300 mx-auto mb-3" />
            <p className="text-sm text-navy-950/40 font-medium">No tickets found</p>
          </div>
        ) : (
          filtered.map((ticket, idx) => {
            const sCfg = STATUS_CFG[ticket.status];
            const SIcon = sCfg.icon;
            const isSelected = selected?.id === ticket.id;
            const unread = ticket.messages.filter(m => m.sender === "USER").length;
            return (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                onClick={() => setSelected(ticket)}
                className={cn(
                  "p-4 border-b border-sand-50 cursor-pointer transition-all hover:bg-sand-50",
                  isSelected && "bg-gold-50/50 border-l-2 border-l-gold-500"
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className={cn("text-sm font-bold text-navy-950 truncate flex-1", ticket.status === "CLOSED" && "opacity-50")}>
                    {ticket.subject}
                  </p>
                  <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0", sCfg.bg, sCfg.color)}>
                    <SIcon className="w-2.5 h-2.5" /> {sCfg.label}
                  </span>
                </div>
                <p className="text-xs text-navy-950/50 mb-2">{ticket.userName} · {ticket.userEmail}</p>
                <div className="flex items-center justify-between">
                  <PriorityBadge priority={ticket.priority} />
                  <div className="flex items-center gap-2">
                    {unread > 0 && (
                      <span className="w-4 h-4 rounded-full bg-gold-500 text-navy-950 text-[9px] font-black flex items-center justify-center">
                        {unread}
                      </span>
                    )}
                    <span className="text-[10px] text-navy-950/30">
                      {new Date(ticket.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                </div>
                {ticket.category && (
                  <span className="inline-block mt-1.5 text-[10px] px-1.5 py-0.5 bg-navy-50 text-navy-600 rounded font-medium">
                    {ticket.category}
                  </span>
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );

  // ─── Ticket Detail Panel ─────────────────────────────────────────────────
  const TicketDetail = () => {
    if (!selected) return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-20 h-20 rounded-2xl bg-sand-50 flex items-center justify-center mb-4">
          <HeadphonesIcon className="w-10 h-10 text-sand-300" />
        </div>
        <h3 className="text-lg font-bold text-navy-950 mb-1">Select a ticket</h3>
        <p className="text-sm text-navy-950/40">Click any ticket on the left to view and respond</p>
      </div>
    );

    const sCfg = STATUS_CFG[selected.status];

    return (
      <div className="flex flex-col h-full">
        {/* Ticket Header */}
        <div className="p-5 border-b border-sand-100">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <button onClick={() => setSelected(null)} className="md:hidden flex items-center gap-1 text-xs text-navy-950/50 mb-2 hover:text-navy-950">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <h2 className="text-base font-bold text-navy-950 leading-snug">{selected.subject}</h2>
              <p className="text-xs text-navy-950/40 mt-0.5">
                #{selected.id?.slice(-8)} · {new Date(selected.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
            {/* Status changer */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all", sCfg.bg, sCfg.color)}
              >
                {updatingStatus ? <Loader2 className="w-3 h-3 animate-spin" /> : <sCfg.icon className="w-3 h-3" />}
                {sCfg.label}
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>
              <AnimatePresence>
                {showStatusMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.96 }}
                    className="absolute right-0 top-full mt-1 z-20 bg-white border border-sand-200 rounded-xl shadow-xl overflow-hidden min-w-[140px]"
                  >
                    {(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as TicketStatus[]).map(s => {
                      const c = STATUS_CFG[s];
                      return (
                        <button
                          key={s}
                          onClick={() => handleStatusChange(s)}
                          className={cn("w-full text-left px-3 py-2 text-xs font-bold flex items-center gap-2 hover:bg-sand-50 transition-colors", c.color)}
                        >
                          <c.icon className="w-3.5 h-3.5" /> {c.label}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* User Meta */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3 bg-sand-50 rounded-xl text-xs">
            <div className="flex items-center gap-1.5 text-navy-950/60">
              <User className="w-3 h-3 text-gold-500 shrink-0" />
              <span className="truncate">{selected.userName}</span>
            </div>
            <div className="flex items-center gap-1.5 text-navy-950/60">
              <Mail className="w-3 h-3 text-blue-400 shrink-0" />
              <span className="truncate">{selected.userEmail}</span>
            </div>
            {selected.userPhone && (
              <div className="flex items-center gap-1.5 text-navy-950/60">
                <Phone className="w-3 h-3 text-emerald-500 shrink-0" />
                <span>{selected.userPhone}</span>
              </div>
            )}
            {selected.resortName && (
              <div className="flex items-center gap-1.5 text-navy-950/60">
                <Building2 className="w-3 h-3 text-purple-400 shrink-0" />
                <span className="truncate">{selected.resortName}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-navy-950/60">
              <Tag className="w-3 h-3 text-amber-500 shrink-0" />
              <span>{selected.category || "General"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <PriorityBadge priority={selected.priority} />
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {selected.messages.length === 0 ? (
            <div className="text-center py-8 text-sm text-navy-950/30">No messages yet. Send the first reply!</div>
          ) : (
            selected.messages.map((msg, idx) => {
              const isAdmin = msg.sender === "ADMIN";
              return (
                <motion.div
                  key={msg.id || idx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className={cn("flex gap-3", isAdmin && "flex-row-reverse")}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-black",
                    isAdmin ? "bg-navy-950 text-white" : "bg-gold-100 text-gold-700"
                  )}>
                    {isAdmin ? "A" : msg.senderName?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div className={cn("max-w-[75%] space-y-1", isAdmin && "items-end flex flex-col")}>
                    <div className={cn(
                      "px-4 py-3 rounded-2xl text-sm leading-relaxed",
                      isAdmin
                        ? "bg-navy-950 text-white rounded-tr-sm"
                        : "bg-white border border-sand-200 text-navy-950 rounded-tl-sm shadow-sm"
                    )}>
                      {msg.content}
                    </div>
                    <p className="text-[10px] text-navy-950/30 px-1">
                      {msg.senderName} · {new Date(msg.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </motion.div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Reply Box */}
        {selected.status !== "CLOSED" ? (
          <div className="p-4 border-t border-sand-100 bg-white">
            <div className="flex gap-3">
              <textarea
                value={reply}
                onChange={e => setReply(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleReply(); }}
                placeholder="Type your reply... (Ctrl+Enter to send)"
                rows={3}
                className="flex-1 p-3 text-sm rounded-xl border border-sand-200 text-navy-950 bg-sand-50 focus:outline-none focus:ring-2 focus:ring-gold-400/40 resize-none"
              />
              <Button
                onClick={handleReply}
                disabled={!reply.trim() || sendingReply}
                className="self-end px-5 py-3 gap-2 bg-navy-950 hover:bg-gold-500 hover:text-navy-950 rounded-xl text-sm transition-all"
              >
                {sendingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-4 border-t border-sand-100 bg-sand-50 text-center text-xs text-navy-950/40 font-medium">
            This ticket is closed. Reopen it to send a reply.
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-navy-950 flex items-center gap-2">
            <HeadphonesIcon className="w-6 h-6 text-gold-600" />
            Support Help Desk
          </h2>
          <p className="text-sm text-navy-950/50 mt-1">Manage traveller complaints and support requests</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchTickets} className="gap-2 rounded-xl text-xs w-fit">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total",       value: stats.total,      color: "text-navy-950",   icon: MessageSquare },
          { label: "Open",        value: stats.open,       color: "text-blue-600",   icon: Circle },
          { label: "In Progress", value: stats.inProgress, color: "text-amber-600",  icon: Clock },
          { label: "Resolved",    value: stats.resolved,   color: "text-emerald-600",icon: CheckCircle },
          { label: "Urgent",      value: stats.urgent,     color: "text-red-500",    icon: Flame },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-sand-200 p-4 flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <s.icon className={cn("w-3.5 h-3.5", s.color)} />
              <span className="text-[10px] font-bold uppercase tracking-widest text-navy-950/50">{s.label}</span>
            </div>
            <p className={cn("text-xl font-bold", s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Main Panel — split layout */}
      <div className="bg-white rounded-2xl border border-sand-100 shadow-sm overflow-hidden" style={{ height: "680px" }}>
        <div className="grid grid-cols-1 md:grid-cols-[340px_1fr] h-full divide-x divide-sand-100">
          {/* Left: Ticket List */}
          <div className={cn("h-full overflow-hidden flex flex-col", selected && "hidden md:flex")}>
            <div className="px-4 py-3 border-b border-sand-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-navy-950">All Tickets</h3>
              <span className="text-xs text-navy-950/40 font-medium">{filtered.length} shown</span>
            </div>
            <TicketList />
          </div>

          {/* Right: Ticket Detail */}
          <div className={cn("h-full overflow-hidden flex flex-col", !selected && "hidden md:flex")}>
            <TicketDetail />
          </div>
        </div>
      </div>
    </div>
  );
}
