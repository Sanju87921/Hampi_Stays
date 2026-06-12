import { useState, useEffect } from "react";
import { TrendingUp, Activity, IndianRupee, Loader2, Save, Map } from "lucide-react";
import { apiClient } from "../../../utils/apiClient";
import toast from "react-hot-toast";
import { Button } from "../../../components/ui/Button";

export function YieldManagementModule() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [multiplier, setMultiplier] = useState(1.0);

  useEffect(() => {
    fetchYieldData();
  }, []);

  const fetchYieldData = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get<any>('/admin/yield-management');
      setData(res);
      setMultiplier(res.globalSurgeMultiplier || 1.0);
    } catch (err: any) {
      toast.error(err.message || "Failed to load yield data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await apiClient.patch('/admin/yield-management', { globalSurgeMultiplier: multiplier });
      toast.success("Global Surge Pricing Updated!");
      fetchYieldData();
    } catch (err: any) {
      toast.error(err.message || "Failed to update surge pricing");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
      </div>
    );
  }

  const occupancyRate = data?.occupancyRate || 0;
  const isHighDemand = occupancyRate > 70;

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-[2.5rem] p-8 border border-sand-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-navy-950 flex items-center gap-3">
              <TrendingUp className="w-7 h-7 text-gold-500" /> Surge & Yield Management
            </h2>
            <p className="text-sm text-navy-950/60 mt-1">
              Monitor platform occupancy and adjust global pricing dynamically.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Heatmap/Stats */}
          <div className="space-y-6">
            <div className={`p-6 rounded-3xl border ${isHighDemand ? 'bg-orange-50 border-orange-200' : 'bg-emerald-50 border-emerald-200'} flex flex-col justify-center items-center h-48`}>
              <Activity className={`w-12 h-12 mb-4 ${isHighDemand ? 'text-orange-500' : 'text-emerald-500'}`} />
              <p className="text-xs font-bold uppercase tracking-widest text-navy-950/60 mb-2">Platform Occupancy (30 Days)</p>
              <h3 className={`text-4xl font-black ${isHighDemand ? 'text-orange-700' : 'text-emerald-700'}`}>
                {occupancyRate.toFixed(1)}%
              </h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-sand-50 p-4 rounded-2xl border border-sand-100">
                <p className="text-[10px] font-bold uppercase tracking-widest text-navy-950/50">Booked Rooms</p>
                <p className="text-xl font-black text-navy-950">{data?.bookedRooms || 0}</p>
              </div>
              <div className="bg-sand-50 p-4 rounded-2xl border border-sand-100">
                <p className="text-[10px] font-bold uppercase tracking-widest text-navy-950/50">Total Rooms</p>
                <p className="text-xl font-black text-navy-950">{data?.totalRooms || 0}</p>
              </div>
            </div>
          </div>

          {/* Right Column: Controls */}
          <div className="bg-sand-50 p-8 rounded-3xl border border-sand-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <IndianRupee className="w-5 h-5 text-gold-600" />
                <h3 className="font-bold text-navy-950 text-lg">Global Surge Multiplier</h3>
              </div>
              <p className="text-xs text-navy-950/60 mb-6">
                Adjusts the base price of all unbooked rooms across the platform. Use this during Hampi Utsav or long weekends to maximize commission yields.
              </p>

              <div className="space-y-4">
                <div className="flex justify-between text-sm font-bold text-navy-950">
                  <span>Current Setting</span>
                  <span>{multiplier.toFixed(2)}x</span>
                </div>
                <input 
                  type="range" 
                  min="0.5" 
                  max="3.0" 
                  step="0.05"
                  value={multiplier} 
                  onChange={(e) => setMultiplier(parseFloat(e.target.value))}
                  className="w-full accent-gold-500 h-2 bg-sand-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-navy-950/40 font-bold">
                  <span>0.5x (Off-Season)</span>
                  <span>1.0x (Normal)</span>
                  <span>3.0x (Peak Surge)</span>
                </div>
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={isSaving || multiplier === data?.globalSurgeMultiplier}
              className="w-full mt-8 bg-navy-950 text-white rounded-xl h-12 flex items-center justify-center gap-2"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Apply Global Surge Pricing
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
