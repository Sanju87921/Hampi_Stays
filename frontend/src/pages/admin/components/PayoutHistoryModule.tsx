/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IndianRupee, Download, RefreshCw, Search, CheckCircle,
  Clock, XCircle, Loader2, Building2, Calendar, Filter,
  TrendingUp, ArrowUpRight, BadgeCheck, AlertCircle, FileText,
  ChevronDown, Eye, CreditCard, Banknote, BarChart2
} from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { apiClient } from "../../../utils/apiClient";
import toast from "react-hot-toast";
import { cn } from "../../../utils/cn";
import { jsPDF } from "jspdf";

// ─── Types ────────────────────────────────────────────────────────────────────
type PayoutStatus = "PENDING" | "PROCESSING" | "PAID" | "FAILED" | "ON_HOLD";

interface PayoutRecord {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  resortName: string;
  bookingCount: number;
  grossAmount: number;
  platformFee: number;
  taxDeducted: number;
  netAmount: number;
  status: PayoutStatus;
  payoutMethod?: string;
  accountLast4?: string;
  referenceId?: string;
  periodStart: string;
  periodEnd: string;
  initiatedAt?: string;
  paidAt?: string;
  notes?: string;
}

const STATUS_CFG: Record<PayoutStatus, { label: string; color: string; bg: string; icon: any }> = {
  PENDING:    { label: "Pending",    color: "text-amber-700",   bg: "bg-amber-50 border-amber-200",   icon: Clock },
  PROCESSING: { label: "Processing", color: "text-blue-700",    bg: "bg-blue-50 border-blue-200",     icon: Loader2 },
  PAID:       { label: "Paid",       color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200",icon: CheckCircle },
  FAILED:     { label: "Failed",     color: "text-red-700",     bg: "bg-red-50 border-red-200",       icon: XCircle },
  ON_HOLD:    { label: "On Hold",    color: "text-purple-700",  bg: "bg-purple-50 border-purple-200", icon: AlertCircle },
};

// ─── Row Detail Modal ─────────────────────────────────────────────────────────
const PayoutDetailModal = ({ payout, onClose, onMarkPaid }: { payout: PayoutRecord; onClose: () => void; onMarkPaid: (id: string) => void }) => {
  const cfg = STATUS_CFG[payout.status];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-navy-950 p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-1">Payout #{payout.id?.slice(-8)}</p>
              <h2 className="text-xl font-bold">{payout.ownerName}</h2>
              <p className="text-sm text-white/60">{payout.ownerEmail}</p>
            </div>
            <span className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border", cfg.bg, cfg.color)}>
              <cfg.icon className="w-3 h-3" /> {cfg.label}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Resort",       value: payout.resortName },
              { label: "Bookings",     value: payout.bookingCount },
              { label: "Period Start", value: new Date(payout.periodStart).toLocaleDateString("en-IN") },
              { label: "Period End",   value: new Date(payout.periodEnd).toLocaleDateString("en-IN") },
              { label: "Payout Method",value: payout.payoutMethod || "Bank Transfer" },
              { label: "Account",      value: payout.accountLast4 ? `****${payout.accountLast4}` : "—" },
              { label: "Reference ID", value: payout.referenceId || "—" },
              { label: "Paid At",      value: payout.paidAt ? new Date(payout.paidAt).toLocaleDateString("en-IN") : "—" },
            ].map(item => (
              <div key={item.label} className="bg-sand-50 rounded-xl p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-navy-950/40">{item.label}</p>
                <p className="text-sm font-bold text-navy-950 mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Financials */}
          <div className="bg-sand-50 rounded-xl p-4 space-y-2">
            <p className="text-xs font-black uppercase tracking-widest text-navy-950/40 mb-3">Breakdown</p>
            {[
              { label: "Gross Booking Value", value: payout.grossAmount, color: "text-navy-950" },
              { label: "Platform Fee",         value: -payout.platformFee, color: "text-red-500" },
              { label: "Tax Deducted (TDS)",   value: -payout.taxDeducted, color: "text-orange-500" },
            ].map(row => (
              <div key={row.label} className="flex justify-between text-sm">
                <span className="text-navy-950/60">{row.label}</span>
                <span className={cn("font-bold", row.color)}>
                  {row.value < 0 ? "− " : ""}₹{Math.abs(row.value).toLocaleString("en-IN")}
                </span>
              </div>
            ))}
            <div className="pt-2 border-t border-sand-200 flex justify-between">
              <span className="text-sm font-black text-navy-950">Net Payout</span>
              <span className="text-lg font-black text-emerald-600">₹{payout.netAmount.toLocaleString("en-IN")}</span>
            </div>
          </div>

          {payout.notes && (
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-sm text-navy-950/70">
              <span className="font-bold text-blue-600 text-xs uppercase tracking-widest">Note: </span>{payout.notes}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          {payout.status === "PENDING" && (
            <Button onClick={() => { onMarkPaid(payout.id); onClose(); }}
              className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl">
              <BadgeCheck className="w-4 h-4" /> Mark as Paid
            </Button>
          )}
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">Close</Button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const RowSkeleton = () => (
  <tr className="animate-pulse border-b border-sand-50">
    {[1,2,3,4,5,6].map(i => <td key={i} className="px-4 py-3"><div className="h-3 bg-sand-200 rounded w-24" /></td>)}
  </tr>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
export function PayoutHistoryModule() {
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<PayoutStatus | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selected, setSelected] = useState<PayoutRecord | null>(null);
  const [markingPaid, setMarkingPaid] = useState<string | null>(null);
  const [sortField, setSortField] = useState<"netAmount" | "paidAt" | "periodEnd">("periodEnd");
  const [sortAsc, setSortAsc] = useState(false);

  // ─── Stats ──────────────────────────────────────────────────────────────
  const stats = {
    totalPaid:    payouts.filter(p => p.status === "PAID").reduce((s, p) => s + p.netAmount, 0),
    pending:      payouts.filter(p => p.status === "PENDING").length,
    pendingValue: payouts.filter(p => p.status === "PENDING").reduce((s, p) => s + p.netAmount, 0),
    onHold:       payouts.filter(p => p.status === "ON_HOLD").length,
    total:        payouts.length,
  };

  const fetchPayouts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient("/api/admin/payouts/history");
      setPayouts(data?.payouts || data || []);
    } catch { setPayouts([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPayouts(); }, [fetchPayouts]);

  // ─── Filter + Sort ───────────────────────────────────────────────────────
  const filtered = payouts
    .filter(p => {
      const matchStatus = filterStatus === "ALL" || p.status === filterStatus;
      const q = searchQuery.toLowerCase();
      const matchSearch = !q || p.ownerName?.toLowerCase().includes(q) || p.resortName?.toLowerCase().includes(q) || p.ownerEmail?.toLowerCase().includes(q);
      const matchFrom = !dateFrom || new Date(p.periodEnd) >= new Date(dateFrom);
      const matchTo   = !dateTo   || new Date(p.periodEnd) <= new Date(dateTo);
      return matchStatus && matchSearch && matchFrom && matchTo;
    })
    .sort((a, b) => {
      const va = sortField === "netAmount" ? a.netAmount : new Date(a[sortField] || 0).getTime();
      const vb = sortField === "netAmount" ? b.netAmount : new Date(b[sortField] || 0).getTime();
      return sortAsc ? va - vb : vb - va;
    });

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(false); }
  };

  // ─── Mark as Paid ────────────────────────────────────────────────────────
  const handleMarkPaid = async (id: string) => {
    setMarkingPaid(id);
    try {
      await apiClient(`/api/admin/payouts/${id}/mark-paid`, { method: "POST" });
      setPayouts(prev => prev.map(p => p.id === id ? { ...p, status: "PAID", paidAt: new Date().toISOString() } : p));
      toast.success("Payout marked as paid!");
    } catch { toast.error("Failed to update payout."); }
    finally { setMarkingPaid(null); }
  };

  // ─── Export CSV ──────────────────────────────────────────────────────────
  const exportCsv = () => {
    const headers = ["ID","Owner","Email","Resort","Bookings","Gross (₹)","Fee (₹)","Tax (₹)","Net (₹)","Status","Period","Paid At"];
    const rows = filtered.map(p => [
      p.id?.slice(-8), p.ownerName, p.ownerEmail, p.resortName,
      p.bookingCount, p.grossAmount, p.platformFee, p.taxDeducted, p.netAmount,
      p.status,
      `${new Date(p.periodStart).toLocaleDateString("en-IN")} - ${new Date(p.periodEnd).toLocaleDateString("en-IN")}`,
      p.paidAt ? new Date(p.paidAt).toLocaleDateString("en-IN") : "—",
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `payouts_${Date.now()}.csv`; a.click();
    toast.success("CSV exported!");
  };

  // ─── Export PDF ──────────────────────────────────────────────────────────
  const exportPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(18); doc.text("HampiStays — Payout History", 14, 20);
    doc.setFontSize(10); doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, 14, 28);
    doc.setFontSize(9);
    let y = 38;
    const cols = ["Owner", "Resort", "Net (₹)", "Status", "Period"];
    const colWidths = [45, 40, 25, 25, 50];
    let x = 14;
    doc.setFillColor(15, 23, 42); doc.rect(14, y-4, 182, 8, "F");
    doc.setTextColor(255,255,255);
    cols.forEach((col, i) => { doc.text(col, x + 2, y); x += colWidths[i]; });
    doc.setTextColor(30,30,30); y += 10;
    filtered.forEach((p, idx) => {
      if (y > 270) { doc.addPage(); y = 20; }
      if (idx % 2 === 0) { doc.setFillColor(250,248,245); doc.rect(14, y-4, 182, 8, "F"); }
      let xi = 14;
      const row = [p.ownerName, p.resortName, `${p.netAmount.toLocaleString("en-IN")}`, p.status,
        `${new Date(p.periodStart).toLocaleDateString("en-IN")} - ${new Date(p.periodEnd).toLocaleDateString("en-IN")}`];
      row.forEach((val, i) => { doc.text(String(val).slice(0, 20), xi + 2, y); xi += colWidths[i]; });
      y += 10;
    });
    doc.save(`payouts_${Date.now()}.pdf`);
    toast.success("PDF exported!");
  };

  const SortBtn = ({ field, label }: { field: typeof sortField; label: string }) => (
    <button onClick={() => toggleSort(field)} className="flex items-center gap-1 hover:text-gold-600 transition-colors">
      {label}
      <ChevronDown className={cn("w-3 h-3 transition-transform", sortField === field && !sortAsc && "rotate-180")} />
    </button>
  );

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-navy-950 flex items-center gap-2">
            <Banknote className="w-6 h-6 text-gold-600" /> Payout History
          </h2>
          <p className="text-sm text-navy-950/50 mt-1">Detailed payout records for all resort owners</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Button variant="outline" size="sm" onClick={fetchPayouts} className="gap-2 rounded-xl text-xs">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportCsv} className="gap-2 rounded-xl text-xs">
            <Download className="w-3.5 h-3.5" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportPdf} className="gap-2 rounded-xl text-xs">
            <FileText className="w-3.5 h-3.5" /> PDF
          </Button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total Records",  value: stats.total,                                          color: "text-navy-950",   icon: BarChart2 },
          { label: "Total Paid Out", value: `₹${stats.totalPaid.toLocaleString("en-IN")}`,        color: "text-emerald-600",icon: CheckCircle },
          { label: "Pending",        value: stats.pending,                                        color: "text-amber-600",  icon: Clock },
          { label: "Pending Value",  value: `₹${stats.pendingValue.toLocaleString("en-IN")}`,    color: "text-gold-600",   icon: IndianRupee },
          { label: "On Hold",        value: stats.onHold,                                        color: "text-purple-600", icon: AlertCircle },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-sand-200 p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <s.icon className={cn("w-3.5 h-3.5", s.color)} />
              <span className="text-[10px] font-bold uppercase tracking-widest text-navy-950/50">{s.label}</span>
            </div>
            <p className={cn("text-xl font-bold", s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="bg-white rounded-2xl border border-sand-100 p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-navy-950/30" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by owner name, email or resort..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-sand-200 text-sm text-navy-950 focus:outline-none focus:ring-2 focus:ring-gold-400/40" />
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-navy-950/30 shrink-0" />
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="px-3 py-2 rounded-xl border border-sand-200 text-sm text-navy-950 focus:outline-none focus:ring-2 focus:ring-gold-400/40" />
            <span className="text-navy-950/30 text-sm">to</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="px-3 py-2 rounded-xl border border-sand-200 text-sm text-navy-950 focus:outline-none focus:ring-2 focus:ring-gold-400/40" />
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["ALL","PENDING","PROCESSING","PAID","FAILED","ON_HOLD"] as const).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={cn("px-3 py-1.5 rounded-xl text-xs font-bold border transition-all",
                filterStatus === s ? "bg-navy-950 text-white border-navy-950" : "bg-white text-navy-950/50 border-sand-200 hover:border-navy-200"
              )}>
              {s === "ALL" ? "All" : STATUS_CFG[s].label}
            </button>
          ))}
          <span className="ml-auto text-xs text-navy-950/40 self-center font-medium">{filtered.length} records</span>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-sand-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="bg-sand-50 border-b border-sand-100">
                {[
                  { label: "Owner / Resort", w: "" },
                  { label: "Period", w: "" },
                  { label: "Bookings", w: "text-center" },
                  { label: "Gross", w: "text-right" },
                  { label: "Fee + Tax", w: "text-right" },
                  { label: "Net Payout", w: "text-right", sort: "netAmount" as const },
                  { label: "Status", w: "" },
                  { label: "Actions", w: "" },
                ].map(col => (
                  <th key={col.label} className={cn("px-4 py-3 text-[10px] font-black uppercase tracking-widest text-navy-950/40 whitespace-nowrap", col.w)}>
                    {col.sort ? <SortBtn field={col.sort} label={col.label} /> : col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1,2,3,4,5].map(i => <RowSkeleton key={i} />)
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <Banknote className="w-12 h-12 text-sand-200" />
                      <p className="text-sm font-bold text-navy-950/40">No payout records found</p>
                      <p className="text-xs text-navy-950/30">Payout records will appear here after bookings are completed.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((p, idx) => {
                  const cfg = STATUS_CFG[p.status];
                  const SIcon = cfg.icon;
                  return (
                    <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }}
                      className="border-b border-sand-50 hover:bg-sand-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-bold text-navy-950">{p.ownerName}</p>
                        <p className="text-xs text-navy-950/40 flex items-center gap-1">
                          <Building2 className="w-3 h-3" /> {p.resortName}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-xs text-navy-950/60 whitespace-nowrap">
                        {new Date(p.periodStart).toLocaleDateString("en-IN", { day:"numeric", month:"short" })}
                        {" – "}
                        {new Date(p.periodEnd).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-navy-950 text-center">{p.bookingCount}</td>
                      <td className="px-4 py-3 text-sm text-navy-950 text-right">₹{p.grossAmount.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-xs text-red-500 font-medium">−₹{(p.platformFee + p.taxDeducted).toLocaleString("en-IN")}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-base font-black text-emerald-600">₹{p.netAmount.toLocaleString("en-IN")}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border", cfg.bg, cfg.color)}>
                          <SIcon className="w-3 h-3" /> {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => setSelected(p)}
                            className="p-1.5 rounded-lg border border-sand-200 text-navy-950/40 hover:text-navy-950 hover:border-navy-200 transition-all">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {p.status === "PENDING" && (
                            <button onClick={() => handleMarkPaid(p.id)} disabled={markingPaid === p.id}
                              className="p-1.5 rounded-lg border border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition-all">
                              {markingPaid === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BadgeCheck className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
            {!loading && filtered.length > 0 && (
              <tfoot>
                <tr className="bg-navy-950 text-white">
                  <td colSpan={3} className="px-4 py-3 text-xs font-black uppercase tracking-widest opacity-60">Totals ({filtered.length} records)</td>
                  <td className="px-4 py-3 text-right text-sm font-bold">
                    ₹{filtered.reduce((s, p) => s + p.grossAmount, 0).toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-red-400">
                    −₹{filtered.reduce((s, p) => s + p.platformFee + p.taxDeducted, 0).toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3 text-right text-base font-black text-emerald-400">
                    ₹{filtered.reduce((s, p) => s + p.netAmount, 0).toLocaleString("en-IN")}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selected && (
          <PayoutDetailModal payout={selected} onClose={() => setSelected(null)} onMarkPaid={handleMarkPaid} />
        )}
      </AnimatePresence>
    </div>
  );
}
