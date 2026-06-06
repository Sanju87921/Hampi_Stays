/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, Send, Users, Clock, CheckCircle, XCircle,
  Plus, Eye, Loader2, RefreshCw, BarChart2, Trash2,
  Megaphone, FileText, ChevronDown, Star, Bell, Tag,
  Calendar, AlertCircle
} from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { apiClient } from "../../../utils/apiClient";
import toast from "react-hot-toast";
import { cn } from "../../../utils/cn";

type CampaignStatus = "DRAFT" | "SENT" | "SCHEDULED" | "FAILED";
type AudienceType = "ALL" | "TRAVELLERS" | "RESORT_OWNERS" | "GUIDES";

interface Campaign {
  id: string;
  title: string;
  subject: string;
  body: string;
  audience: AudienceType;
  status: CampaignStatus;
  scheduledAt?: string;
  sentAt?: string;
  totalRecipients: number;
  openRate?: number;
  clickRate?: number;
  createdAt: string;
}

const STATUS_CFG: Record<CampaignStatus, { label: string; color: string; bg: string; icon: any }> = {
  DRAFT:     { label: "Draft",     color: "text-slate-600",   bg: "bg-slate-50 border-slate-200",   icon: FileText },
  SENT:      { label: "Sent",      color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200",icon: CheckCircle },
  SCHEDULED: { label: "Scheduled", color: "text-blue-700",    bg: "bg-blue-50 border-blue-200",     icon: Clock },
  FAILED:    { label: "Failed",    color: "text-red-600",     bg: "bg-red-50 border-red-200",       icon: XCircle },
};

const AUDIENCE_CFG: Record<AudienceType, { label: string; icon: any; color: string }> = {
  ALL:           { label: "All Users",      icon: Users,     color: "text-navy-950" },
  TRAVELLERS:    { label: "Travellers",     icon: Star,      color: "text-gold-600" },
  RESORT_OWNERS: { label: "Resort Owners", icon: Bell,      color: "text-emerald-600" },
  GUIDES:        { label: "Guides",         icon: Tag,       color: "text-purple-600" },
};

const TEMPLATES = [
  { name: "Summer Offer",    subject: "☀️ Exclusive Summer Deals at HampiStays!", body: "Dear Traveller,\n\nDiscover our exclusive summer deals on heritage resorts in Hampi. Book now and save up to 30% on select properties!\n\nUse code: SUMMER30\n\nExplore Now → https://hampi-stays.pages.dev\n\nWarm regards,\nHampiStays Team" },
  { name: "Festival Promo",  subject: "🎉 Hampi Festival Season — Special Packages!", body: "Dear Guest,\n\nThe Hampi Utsav is here! We've curated special festival packages with premium stays and guided tours.\n\nLimited seats available — book your spot today!\n\nBook Now → https://hampi-stays.pages.dev\n\nWarm regards,\nHampiStays Team" },
  { name: "Welcome Back",    subject: "Welcome back! We've missed you 🙏", body: "Dear Traveller,\n\nIt's been a while since your last visit to Hampi. We have exciting new resorts and experiences waiting for you.\n\nCome back and explore → https://hampi-stays.pages.dev\n\nWarm regards,\nHampiStays Team" },
  { name: "New Resort Alert", subject: "🏯 New Resort Just Listed on HampiStays", body: "Dear Guest,\n\nWe're thrilled to announce a new luxury heritage resort has joined HampiStays.\n\nBe among the first to experience it → https://hampi-stays.pages.dev\n\nWarm regards,\nHampiStays Team" },
];

const BLANK_FORM = { title: "", subject: "", body: "", audience: "ALL" as AudienceType, scheduledAt: "" };

export function EmailCampaignsModule() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [view, setView] = useState<"list" | "compose" | "preview">("list");
  const [form, setForm] = useState(BLANK_FORM);
  const [previewCampaign, setPreviewCampaign] = useState<Campaign | null>(null);
  const [filterStatus, setFilterStatus] = useState<CampaignStatus | "ALL">("ALL");
  const [showTemplates, setShowTemplates] = useState(false);

  const stats = {
    total:     campaigns.length,
    sent:      campaigns.filter(c => c.status === "SENT").length,
    scheduled: campaigns.filter(c => c.status === "SCHEDULED").length,
    drafts:    campaigns.filter(c => c.status === "DRAFT").length,
    reached:   campaigns.filter(c => c.status === "SENT").reduce((s, c) => s + (c.totalRecipients || 0), 0),
  };

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient("/api/admin/campaigns");
      setCampaigns(data?.campaigns || data || []);
    } catch { setCampaigns([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  const filtered = campaigns.filter(c => filterStatus === "ALL" || c.status === filterStatus);

  const handleSend = async (asDraft = false) => {
    if (!form.subject.trim() || !form.body.trim()) {
      toast.error("Subject and body are required."); return;
    }
    setSending(true);
    try {
      const payload = { ...form, status: asDraft ? "DRAFT" : (form.scheduledAt ? "SCHEDULED" : "SENT") };
      const data = await apiClient("/api/admin/campaigns", { method: "POST", body: JSON.stringify(payload) });
      setCampaigns(prev => [data?.campaign || { ...payload, id: Date.now().toString(), createdAt: new Date().toISOString(), totalRecipients: 0 }, ...prev]);
      toast.success(asDraft ? "Saved as draft!" : form.scheduledAt ? "Campaign scheduled!" : "Campaign sent successfully!");
      setForm(BLANK_FORM); setView("list");
    } catch { toast.error("Failed to send campaign."); }
    finally { setSending(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient(`/api/admin/campaigns/${id}`, { method: "DELETE" });
      setCampaigns(prev => prev.filter(c => c.id !== id));
      toast.success("Campaign deleted.");
    } catch { toast.error("Failed to delete."); }
  };

  // ── Compose View ────────────────────────────────────────────────────────────
  if (view === "compose") return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold text-navy-950 flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-gold-600" /> New Campaign
          </h2>
          <p className="text-sm text-navy-950/50 mt-1">Compose and send a bulk email to your users</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setView("list")} className="rounded-xl text-xs gap-2">
          ← Back to Campaigns
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Compose Panel */}
        <div className="bg-white rounded-2xl border border-sand-200 p-6 space-y-5">
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-navy-950/50 mb-1.5 block">Campaign Title (internal)</label>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Summer Offer June 2025"
              className="w-full px-4 py-2.5 rounded-xl border border-sand-200 text-sm text-navy-950 focus:outline-none focus:ring-2 focus:ring-gold-400/40" />
          </div>
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-navy-950/50 mb-1.5 block">Email Subject *</label>
            <input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
              placeholder="e.g. ☀️ Exclusive Summer Deals at HampiStays!"
              className="w-full px-4 py-2.5 rounded-xl border border-sand-200 text-sm text-navy-950 focus:outline-none focus:ring-2 focus:ring-gold-400/40" />
          </div>
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-navy-950/50 mb-1.5 block">Email Body *</label>
            <textarea value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
              placeholder="Write your email content here..."
              rows={12}
              className="w-full px-4 py-3 rounded-xl border border-sand-200 text-sm text-navy-950 focus:outline-none focus:ring-2 focus:ring-gold-400/40 resize-none font-mono" />
            <p className="text-xs text-navy-950/30 mt-1">{form.body.length} characters</p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-2 border-t border-sand-100">
            <Button onClick={() => handleSend(false)} disabled={sending} className="gap-2 bg-navy-950 hover:bg-gold-500 hover:text-navy-950 text-white rounded-xl px-6">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {form.scheduledAt ? "Schedule Campaign" : "Send Now"}
            </Button>
            <Button variant="outline" onClick={() => handleSend(true)} disabled={sending} className="gap-2 rounded-xl px-6 text-sm">
              <FileText className="w-4 h-4" /> Save as Draft
            </Button>
          </div>
        </div>

        {/* Side Panel */}
        <div className="space-y-4">
          {/* Audience */}
          <div className="bg-white rounded-2xl border border-sand-200 p-5">
            <h3 className="text-xs font-black uppercase tracking-widest text-navy-950/50 mb-3">Target Audience</h3>
            <div className="space-y-2">
              {(Object.entries(AUDIENCE_CFG) as [AudienceType, any][]).map(([key, cfg]) => (
                <button key={key} onClick={() => setForm(p => ({ ...p, audience: key }))}
                  className={cn("w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                    form.audience === key ? "border-navy-950 bg-navy-50" : "border-sand-200 hover:border-navy-200"
                  )}>
                  <cfg.icon className={cn("w-4 h-4", cfg.color)} />
                  <span className={cn("text-sm font-bold", form.audience === key ? "text-navy-950" : "text-navy-950/60")}>{cfg.label}</span>
                  {form.audience === key && <CheckCircle className="w-4 h-4 text-navy-950 ml-auto" />}
                </button>
              ))}
            </div>
          </div>

          {/* Schedule */}
          <div className="bg-white rounded-2xl border border-sand-200 p-5">
            <h3 className="text-xs font-black uppercase tracking-widest text-navy-950/50 mb-3 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" /> Schedule (Optional)
            </h3>
            <input type="datetime-local" value={form.scheduledAt}
              onChange={e => setForm(p => ({ ...p, scheduledAt: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-sand-200 text-sm text-navy-950 focus:outline-none focus:ring-2 focus:ring-gold-400/40" />
            {form.scheduledAt && (
              <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Will be sent at {new Date(form.scheduledAt).toLocaleString("en-IN")}
              </p>
            )}
          </div>

          {/* Templates */}
          <div className="bg-white rounded-2xl border border-sand-200 p-5">
            <button onClick={() => setShowTemplates(!showTemplates)}
              className="w-full flex items-center justify-between text-xs font-black uppercase tracking-widest text-navy-950/50 mb-2">
              <span className="flex items-center gap-2"><FileText className="w-3.5 h-3.5" /> Templates</span>
              <ChevronDown className={cn("w-4 h-4 transition-transform", showTemplates && "rotate-180")} />
            </button>
            <AnimatePresence>
              {showTemplates && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-2 pt-1">
                  {TEMPLATES.map(t => (
                    <button key={t.name} onClick={() => { setForm(p => ({ ...p, subject: t.subject, body: t.body, title: t.name })); setShowTemplates(false); toast.success(`"${t.name}" template loaded!`); }}
                      className="w-full text-left p-3 rounded-xl border border-sand-100 hover:border-gold-400 hover:bg-gold-50 transition-all">
                      <p className="text-sm font-bold text-navy-950">{t.name}</p>
                      <p className="text-xs text-navy-950/40 truncate mt-0.5">{t.subject}</p>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Preview Modal ───────────────────────────────────────────────────────────
  const PreviewModal = () => previewCampaign ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setPreviewCampaign(null)}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-sand-100 flex items-center justify-between">
          <h3 className="font-bold text-navy-950">Email Preview</h3>
          <button onClick={() => setPreviewCampaign(null)} className="text-navy-950/40 hover:text-navy-950"><XCircle className="w-5 h-5" /></button>
        </div>
        <div className="p-6">
          <div className="bg-sand-50 rounded-xl p-4 mb-4">
            <p className="text-xs text-navy-950/40 font-bold uppercase tracking-widest mb-1">Subject</p>
            <p className="text-base font-bold text-navy-950">{previewCampaign.subject}</p>
          </div>
          <div className="bg-white border border-sand-200 rounded-xl p-6">
            <div className="border-b border-sand-100 pb-4 mb-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-navy-950 flex items-center justify-center">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-navy-950">HampiStays</p>
                <p className="text-xs text-navy-950/40">noreply@hampi-stays.in</p>
              </div>
            </div>
            <pre className="text-sm text-navy-950/80 whitespace-pre-wrap font-sans leading-relaxed">{previewCampaign.body}</pre>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div className="bg-sand-50 rounded-xl p-3">
              <p className="text-lg font-black text-navy-950">{previewCampaign.totalRecipients}</p>
              <p className="text-xs text-navy-950/40">Recipients</p>
            </div>
            <div className="bg-sand-50 rounded-xl p-3">
              <p className="text-lg font-black text-emerald-600">{previewCampaign.openRate ?? "—"}%</p>
              <p className="text-xs text-navy-950/40">Open Rate</p>
            </div>
            <div className="bg-sand-50 rounded-xl p-3">
              <p className="text-lg font-black text-blue-600">{previewCampaign.clickRate ?? "—"}%</p>
              <p className="text-xs text-navy-950/40">Click Rate</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  ) : null;

  // ── List View ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <PreviewModal />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-navy-950 flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-gold-600" /> Email Campaigns
          </h2>
          <p className="text-sm text-navy-950/50 mt-1">Send bulk emails and notifications to your users</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={fetchCampaigns} className="gap-2 rounded-xl text-xs">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
          <Button size="sm" onClick={() => setView("compose")} className="gap-2 rounded-xl bg-navy-950 hover:bg-gold-500 hover:text-navy-950 text-white">
            <Plus className="w-4 h-4" /> New Campaign
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total",     value: stats.total,     color: "text-navy-950",   icon: Megaphone },
          { label: "Sent",      value: stats.sent,      color: "text-emerald-600",icon: CheckCircle },
          { label: "Scheduled", value: stats.scheduled, color: "text-blue-600",   icon: Clock },
          { label: "Drafts",    value: stats.drafts,    color: "text-slate-500",  icon: FileText },
          { label: "Reached",   value: stats.reached,   color: "text-gold-600",   icon: Users },
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

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["ALL", "SENT", "SCHEDULED", "DRAFT", "FAILED"] as const).map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={cn("px-3 py-1.5 rounded-xl text-xs font-bold border transition-all",
              filterStatus === s ? "bg-navy-950 text-white border-navy-950" : "bg-white text-navy-950/50 border-sand-200 hover:border-navy-200"
            )}>
            {s === "ALL" ? "All" : STATUS_CFG[s]?.label || s}
          </button>
        ))}
      </div>

      {/* Campaign Cards */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-sand-100 p-5 animate-pulse">
              <div className="flex justify-between mb-3">
                <div className="h-4 w-48 bg-sand-200 rounded" />
                <div className="h-5 w-16 bg-sand-100 rounded-full" />
              </div>
              <div className="h-3 w-64 bg-sand-100 rounded mb-3" />
              <div className="flex gap-4">
                <div className="h-3 w-24 bg-sand-100 rounded" />
                <div className="h-3 w-20 bg-sand-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-sand-100 p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-sand-50 flex items-center justify-center mx-auto mb-4">
            <Megaphone className="w-8 h-8 text-sand-300" />
          </div>
          <h3 className="text-lg font-bold text-navy-950 mb-1">No campaigns yet</h3>
          <p className="text-sm text-navy-950/40 mb-4">Create your first email campaign to engage your users.</p>
          <Button size="sm" onClick={() => setView("compose")} className="gap-2 bg-navy-950 text-white rounded-xl">
            <Plus className="w-4 h-4" /> Create Campaign
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((c, idx) => {
              const cfg = STATUS_CFG[c.status];
              const aCfg = AUDIENCE_CFG[c.audience];
              return (
                <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: idx * 0.04 }}
                  className="bg-white rounded-2xl border border-sand-100 p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-sm font-bold text-navy-950 truncate">{c.title || c.subject}</h3>
                        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border", cfg.bg, cfg.color)}>
                          <cfg.icon className="w-2.5 h-2.5" /> {cfg.label}
                        </span>
                      </div>
                      <p className="text-xs text-navy-950/50 truncate mb-3">{c.subject}</p>
                      <div className="flex flex-wrap gap-4 text-xs text-navy-950/50">
                        <span className={cn("flex items-center gap-1", aCfg.color)}>
                          <aCfg.icon className="w-3.5 h-3.5" /> {aCfg.label}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-navy-950/30" /> {c.totalRecipients} recipients
                        </span>
                        {c.status === "SENT" && c.openRate != null && (
                          <span className="flex items-center gap-1 text-emerald-600">
                            <BarChart2 className="w-3.5 h-3.5" /> {c.openRate}% open rate
                          </span>
                        )}
                        {c.scheduledAt && (
                          <span className="flex items-center gap-1 text-blue-600">
                            <Calendar className="w-3.5 h-3.5" /> {new Date(c.scheduledAt).toLocaleDateString("en-IN")}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-navy-950/20" /> {new Date(c.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => setPreviewCampaign(c)}
                        className="p-2 rounded-xl border border-sand-200 text-navy-950/40 hover:text-navy-950 hover:border-navy-200 transition-all">
                        <Eye className="w-4 h-4" />
                      </button>
                      {c.status === "DRAFT" && (
                        <button onClick={() => handleDelete(c.id)}
                          className="p-2 rounded-xl border border-red-100 text-red-400 hover:text-red-600 hover:border-red-300 transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
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
