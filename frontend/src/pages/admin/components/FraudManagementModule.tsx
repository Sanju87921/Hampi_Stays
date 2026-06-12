import { useState, useEffect } from "react";
import { ShieldAlert, AlertTriangle, ShieldCheck, UserX, Loader2, RefreshCw } from "lucide-react";
import { apiClient } from "../../../utils/apiClient";
import toast from "react-hot-toast";
import { Button } from "../../../components/ui/Button";

type FlaggedEntity = {
  id: string;
  name: string;
  email: string;
  role?: string;
  fraudScore: number;
  fraudFlags: string[];
  deletedAt?: string | null;
  isActive?: boolean;
  type: 'user' | 'guide';
};

export function FraudManagementModule() {
  const [entities, setEntities] = useState<FlaggedEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchFraudData();
  }, []);

  const fetchFraudData = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.get<{ users: any[], guides: any[] }>('/admin/fraud-center');
      const users = (data?.users || []).map(u => ({ ...u, type: 'user' as const }));
      const guides = (data?.guides || []).map(g => ({
        ...g,
        name: g.user?.name || "Unknown Guide",
        email: g.user?.email || "Unknown",
        type: 'guide' as const
      }));
      setEntities([...users, ...guides].sort((a, b) => b.fraudScore - a.fraudScore));
    } catch (err: any) {
      toast.error(err.message || "Failed to load fraud center data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (id: string, type: 'user' | 'guide', action: 'SUSPEND' | 'CLEAR') => {
    if (action === 'SUSPEND' && !confirm(`Are you sure you want to suspend this ${type}?`)) return;
    
    setProcessingId(id);
    try {
      await apiClient.post(`/admin/fraud-center/${type}/${id}/action`, { action });
      toast.success(`${type.toUpperCase()} has been ${action === 'SUSPEND' ? 'suspended' : 'cleared'}`);
      
      // Update UI optimistically
      if (action === 'SUSPEND') {
        setEntities(prev => prev.map(e => e.id === id ? { ...e, deletedAt: new Date().toISOString(), isActive: false } : e));
      } else {
        setEntities(prev => prev.filter(e => e.id !== id));
      }
    } catch (err: any) {
      toast.error(err.message || `Failed to ${action} ${type}`);
    } finally {
      setProcessingId(null);
    }
  };

  const getRiskLevel = (score: number) => {
    if (score >= 80) return { label: 'CRITICAL RISK', color: 'text-red-700 bg-red-100 border-red-200' };
    if (score >= 50) return { label: 'HIGH RISK', color: 'text-orange-700 bg-orange-100 border-orange-200' };
    return { label: 'ELEVATED RISK', color: 'text-yellow-700 bg-yellow-100 border-yellow-200' };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-[2.5rem] p-8 border border-red-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-navy-950 flex items-center gap-3">
              <ShieldAlert className="w-7 h-7 text-red-500" /> Fraud & Risk Management
            </h2>
            <p className="text-sm text-navy-950/60 mt-1">
              Monitor and mitigate suspicious accounts, high-risk transactions, and platform abuse.
            </p>
          </div>
          <Button variant="outline" onClick={fetchFraudData} className="gap-2 rounded-xl">
            <RefreshCw className="w-4 h-4" /> Refresh Scan
          </Button>
        </div>

        {entities.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-emerald-200 rounded-3xl bg-emerald-50/50">
            <ShieldCheck className="w-12 h-12 mx-auto text-emerald-500 mb-4" />
            <h3 className="text-lg font-bold text-navy-950">System Secure</h3>
            <p className="text-sm text-navy-950/60 mt-2">No flagged accounts or suspicious activity detected.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {entities.map((entity) => {
              const risk = getRiskLevel(entity.fraudScore);
              const isSuspended = entity.deletedAt || entity.isActive === false;

              return (
                <div key={entity.id} className={`p-6 rounded-3xl border transition-colors ${isSuspended ? 'bg-sand-50/50 border-sand-200' : 'bg-white border-red-100 shadow-sm'}`}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-bold text-navy-950 text-lg flex items-center gap-2">
                          {entity.name} 
                          <span className="text-xs uppercase tracking-widest text-navy-950/40 font-bold bg-sand-100 px-2 py-0.5 rounded-full">{entity.type}</span>
                        </h4>
                        {!isSuspended && (
                          <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase border ${risk.color}`}>
                            {risk.label} ({entity.fraudScore}/100)
                          </span>
                        )}
                        {isSuspended && (
                          <span className="text-[10px] font-black px-3 py-1 rounded-full uppercase border text-navy-950/50 bg-sand-200 border-sand-300">
                            Suspended
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-navy-950/60 font-mono mb-4">{entity.email} • ID: {entity.id.slice(-8)}</p>
                      
                      <div className="flex flex-wrap gap-2">
                        {entity.fraudFlags.map((flag, idx) => (
                          <span key={idx} className="bg-red-50 text-red-600 border border-red-100 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase flex items-center gap-1.5">
                            <AlertTriangle className="w-3 h-3" /> {flag.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {!isSuspended && (
                        <>
                          <Button
                            variant="outline"
                            onClick={() => handleAction(entity.id, entity.type, 'CLEAR')}
                            disabled={processingId === entity.id}
                            className="bg-white border-emerald-200 text-emerald-600 hover:bg-emerald-50 rounded-xl"
                          >
                            <ShieldCheck className="w-4 h-4 mr-2" /> Clear Flags
                          </Button>
                          <Button
                            onClick={() => handleAction(entity.id, entity.type, 'SUSPEND')}
                            disabled={processingId === entity.id}
                            className="bg-red-600 text-white hover:bg-red-700 rounded-xl"
                          >
                            {processingId === entity.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <><UserX className="w-4 h-4 mr-2" /> Suspend Account</>
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
