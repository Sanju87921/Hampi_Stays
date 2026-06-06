/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RotateCcw, CheckCircle, XCircle, Search, Filter,
  Clock, AlertCircle, IndianRupee, Calendar, User,
  Building2, Eye, Loader2, ChevronDown, MessageSquare,
  Download, RefreshCw, BadgeCheck, Ban
} from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { apiClient } from "../../../utils/apiClient";
import toast from "react-hot-toast";
import { cn } from "../../../utils/cn";

type RefundStatus = "PENDING" | "APPROVED" | "REJECTED" | "PROCESSING";

interface RefundRequest {
  id: string;
  bookingId: string;
  travellerName: string;
  travellerEmail: string;
  resortName: string;
  amount: number;
  reason: string;
  status: RefundStatus;
  createdAt: string;
  updatedAt: string;
  checkIn?: string;
  checkOut?: string;
  adminNote?: string;
}

const STATUS_CONFIG: Record<RefundStatus, { label: string; color: string; bg: string; icon: any }> = {
  PENDING:    { label: "Pending",    color: "text-amber-700",   bg: "bg-amber-50 border-amber-200",   icon: Clock },
  APPROVED:   { label: "Approved",   color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: CheckCircle },
  REJECTED:   { label: "Rejected",   color: "text-red-700",     bg: "bg-red-50 border-red-200",       icon: XCircle },
  PROCESSING: { label: "Processing", color: "text-blue-700",    bg: "bg-blue-50 border-blue-200",     icon: Loader2 },
};

// ─── Skeleton Loader ─────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-sand-100 p-6 animate-pulse space-y-4">
    <div className="flex justify-between">
      <div className="space-y-2">
        <div className="h-4 w-40 bg-sand-200 rounded" />
        <div className="h-3 w-28 bg-sand-100 rounded" />
      </div>
      <div className="h-7 w-20 bg-sand-200 rounded-full" />
    </div>
    <div className="h-px bg-sand-100" />
    <div className="flex gap-6">
      <div className="h-3 w-32 bg-sand-100 rounded" />
      <div className="h-3 w-24 bg-sand-100 rounded" />
    </div>
    <div className="flex gap-3 pt-2">
      <div className="h-9 w-24 bg-sand-200 rounded-xl" />
      <div className="h-9 w-24 bg-sand-100 rounded-xl" />
    </div>
  </div>
);

export function RefundManagementModule() {
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<RefundStatus | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState<Record<string, string>>({});
  const [showNoteFor, setShowNoteFor] = useState<string | null>(null);

  // ─── Stats derived ──────────────────────────────────────────────────────────
  const stats = {
    total:      refunds.length,
    pending:    refunds.filter(r => r.status === "PENDING").length,
    approved:   refunds.filter(r => r.status === "APPROVED").length,
    rejected:   refunds.filter(r => r.status === "REJECTED").length,
    totalValue: refunds.filter(r => r.status === "PENDING").reduce((s, r) => s + r.amount, 0),
  };

  // ─── Fetch refund requests ──────────────────────────────────────────────────
  const fetchRefunds = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient("/api/admin/refunds");
      setRefunds(data?.refunds || data || []);
    } catch {
      // If backend not yet wired, show empty state gracefully
      setRefunds([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRefunds(); }, [fetchRefunds]);

  // ─── Approve / Reject ───────────────────────────────────────────────────────
  const handleAction = async (id: string, action: "approve" | "reject") => {
    setActionLoading(id + action);
    const note = adminNote[id] || "";
    try {
      await apiClient(`/api/admin/refunds/${id}/${action}`, {
        method: "POST",
        body: JSON.stringify({ adminNote: note }),
      });
      toast.success(`Refund ${action === "approve" ? "approved" : "rejected"} successfully!`);
      setRefunds(prev =>
        prev.map(r =>
          r.id === id
            ? { ...r, status: action === "approve" ? "APPROVED" : "REJECTED", adminNote: note }
            : r
        )
      );
      setShowNoteFor(null);
    } catch {
      toast.error(`Failed to ${action} refund. Please try again.`);
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Filter + Search ─────────────────────────────────────────────────────────
  const filtered = refunds.filter(r => {
    const matchesStatus = filterStatus === "ALL" || r.status === filterStatus;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      r.travellerName?.toLowerCase().includes(q) ||
      r.bookingId?.toLowerCase().includes(q) ||
      r.resortName?.toLowerCase().includes(q) ||
      r.travellerEmail?.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  // ─── Export CSV ──────────────────────────────────────────────────────────────
  const exportCsv = () => {
    const headers = ["ID", "Booking ID", "Traveller", "Resort", "Amount (₹)", "Status", "Reason", "Date"];
    const rows = filtered.map(r => [
      r.id, r.bookingId, r.travellerName, r.resortName,
      r.amount, r.status, `"${r.reason}"`,
      new Date(r.createdAt).toLocaleDateString("en-IN"),
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `refunds_${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Refund data exported!");
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-navy-950 flex items-center gap-2">
            <RotateCcw className="w-6 h-6 text-gold-600" />
            Refund Management
          </h2>
          <p className="text-sm text-navy-950/50 mt-1">Review and process traveller refund requests</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={fetchRefunds} className="gap-2 rounded-xl text-xs">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportCsv} className="gap-2 rounded-xl text-xs">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </Button>
        </div>
      </div>

      {/* ── Stats Bar ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total Requests", value: stats.total,      color: "text-navy-950",   icon: RotateCcw },
          { label: "Pending",        value: stats.pending,    color: "text-amber-600",  icon: Clock },
          { label: "Approved",       value: stats.approved,   color: "text-emerald-600",icon: CheckCircle },
          { label: "Rejected",       value: stats.rejected,   color: "text-red-500",    icon: XCircle },
          { label: "Pending Value",  value: `₹${stats.totalValue.toLocaleString("en-IN")}`, color: "text-gold-600", icon: IndianRupee },
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

      {/* ── Filters ── */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-950/30" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by traveller, booking ID, or resort..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-sand-200 text-sm text-navy-950 bg-white focus:outline-none focus:ring-2 focus:ring-gold-400/40"
          />
        </div>
        <div className="flex gap-2">
          {(["ALL", "PENDING", "APPROVED", "REJECTED", "PROCESSING"] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={cn(
                "px-3 py-2 rounded-xl text-xs font-bold border transition-all",
                filterStatus === s
                  ? "bg-navy-950 text-white border-navy-950"
                  : "bg-white text-navy-950/60 border-sand-200 hover:border-navy-200"
              )}
            >
              {s === "ALL" ? "All" : STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* ── List ── */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-sand-100 p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-sand-50 flex items-center justify-center mx-auto mb-4">
            <RotateCcw className="w-8 h-8 text-sand-300" />
          </div>
          <h3 className="text-lg font-bold text-navy-950 mb-1">No refund requests</h3>
          <p className="text-sm text-navy-950/40">
            {searchQuery || filterStatus !== "ALL"
              ? "No requests match your current filters."
              : "All refund requests will appear here once travellers submit them."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filtered.map((refund, idx) => {
              const cfg = STATUS_CONFIG[refund.status];
              const Icon = cfg.icon;
              const isExpanded = expandedId === refund.id;
              const isActing = actionLoading?.startsWith(refund.id);

              return (
                <motion.div
                  key={refund.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: idx * 0.04 }}
                  className="bg-white rounded-2xl border border-sand-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                >
                  {/* Card Header */}
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-black uppercase tracking-widest text-navy-950/40">
                            #{refund.bookingId?.slice(-8) || refund.id?.slice(-8)}
                          </span>
                          <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border", cfg.bg, cfg.color)}>
                            <Icon className="w-3 h-3" /> {cfg.label}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-navy-950 truncate">{refund.travellerName}</h3>
                        <p className="text-xs text-navy-950/50">{refund.travellerEmail}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-2xl font-black text-navy-950">₹{refund.amount?.toLocaleString("en-IN")}</p>
                        <p className="text-[10px] text-navy-950/40 mt-0.5">
                          {new Date(refund.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                    </div>

                    {/* Meta Row */}
                    <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-sand-50">
                      <div className="flex items-center gap-1.5 text-xs text-navy-950/60">
                        <Building2 className="w-3.5 h-3.5 text-gold-500" />
                        {refund.resortName || "N/A"}
                      </div>
                      {refund.checkIn && (
                        <div className="flex items-center gap-1.5 text-xs text-navy-950/60">
                          <Calendar className="w-3.5 h-3.5 text-blue-400" />
                          {new Date(refund.checkIn).toLocaleDateString("en-IN")} – {new Date(refund.checkOut!).toLocaleDateString("en-IN")}
                        </div>
                      )}
                    </div>

                    {/* Reason */}
                    <div className="mt-3 p-3 bg-sand-50 rounded-xl">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-navy-950/40 mb-1">Reason</p>
                      <p className="text-sm text-navy-950/70 leading-relaxed">{refund.reason || "No reason provided."}</p>
                    </div>

                    {/* Admin Note (if any) */}
                    {refund.adminNote && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600 mb-1">Admin Note</p>
                        <p className="text-sm text-navy-950/70">{refund.adminNote}</p>
                      </div>
                    )}

                    {/* Actions */}
                    {refund.status === "PENDING" && (
                      <div className="mt-4 space-y-3">
                        {/* Note toggle */}
                        <button
                          onClick={() => setShowNoteFor(showNoteFor === refund.id ? null : refund.id)}
                          className="flex items-center gap-1.5 text-xs text-navy-950/50 hover:text-navy-950 transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          {showNoteFor === refund.id ? "Hide note" : "Add admin note (optional)"}
                        </button>

                        <AnimatePresence>
                          {showNoteFor === refund.id && (
                            <motion.textarea
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              value={adminNote[refund.id] || ""}
                              onChange={e => setAdminNote(prev => ({ ...prev, [refund.id]: e.target.value }))}
                              placeholder="Add a note for the traveller (will be included in email)..."
                              rows={2}
                              className="w-full p-3 rounded-xl border border-sand-200 text-sm text-navy-950 bg-sand-50 focus:outline-none focus:ring-2 focus:ring-gold-400/40 resize-none"
                            />
                          )}
                        </AnimatePresence>

                        <div className="flex gap-3">
                          <Button
                            size="sm"
                            onClick={() => handleAction(refund.id, "approve")}
                            disabled={!!isActing}
                            className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs px-5"
                          >
                            {isActing && actionLoading === refund.id + "approve"
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <BadgeCheck className="w-3.5 h-3.5" />}
                            Approve Refund
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAction(refund.id, "reject")}
                            disabled={!!isActing}
                            className="gap-2 border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs px-5"
                          >
                            {isActing && actionLoading === refund.id + "reject"
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <Ban className="w-3.5 h-3.5" />}
                            Reject
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
