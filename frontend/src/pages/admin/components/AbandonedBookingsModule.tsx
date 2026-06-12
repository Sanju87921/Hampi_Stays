import { useState, useEffect } from "react";
import { ShoppingCart, Send, Loader2, AlertCircle, TrendingUp } from "lucide-react";
import { apiClient } from "../../../utils/apiClient";
import toast from "react-hot-toast";
import { Button } from "../../../components/ui/Button";

export function AbandonedBookingsModule() {
  const [abandonedBookings, setAbandonedBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchAbandonedBookings();
  }, []);

  const fetchAbandonedBookings = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.get<any[]>('/admin/bookings/abandoned');
      setAbandonedBookings(data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load abandoned bookings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendCoupon = async (bookingId: string) => {
    setProcessingId(bookingId);
    try {
      // 15% discount for comeback
      await apiClient.post('/admin/crm/send-coupon', {
        bookingId,
        discountPercentage: 15
      });
      toast.success("Comeback coupon generated and sent!");
      // Optionally remove from list or mark as sent
      setAbandonedBookings(prev => prev.filter(b => b.id !== bookingId));
    } catch (err: any) {
      toast.error(err.message || "Failed to send coupon");
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-[2.5rem] p-8 border border-sand-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-navy-950 flex items-center gap-3">
              <ShoppingCart className="w-6 h-6 text-gold-500" /> Abandoned Checkout CRM
            </h2>
            <p className="text-sm text-navy-950/60 mt-1">
              Recover lost revenue. Send automated discount codes to users who left bookings pending.
            </p>
          </div>
          <div className="bg-sand-50 p-4 rounded-2xl border border-sand-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-gold-600 font-bold text-lg shadow-sm">
              {abandonedBookings.length}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-navy-950/60">Pending Checkouts</p>
              <p className="text-sm font-bold text-navy-950">Est. Value: ₹{abandonedBookings.reduce((acc, curr) => acc + curr.totalPrice, 0).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {abandonedBookings.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-sand-200 rounded-3xl bg-sand-50/50">
            <TrendingUp className="w-12 h-12 mx-auto text-emerald-500 opacity-50 mb-4" />
            <h3 className="text-lg font-bold text-navy-950">No Abandoned Checkouts!</h3>
            <p className="text-sm text-navy-950/60 mt-2">All recent checkouts were completed successfully.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {abandonedBookings.map((booking) => (
              <div key={booking.id} className="p-6 rounded-3xl border border-sand-200 hover:border-gold-300 transition-colors bg-white shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-navy-950 text-lg">{booking.user?.name}</h4>
                      <p className="text-xs text-navy-950/60 font-mono">{booking.user?.email}</p>
                    </div>
                    <span className="bg-red-50 text-red-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Dropped Off
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-6 bg-sand-50 p-4 rounded-2xl">
                    <p className="text-xs text-navy-950"><span className="font-bold">Resort:</span> {booking.resort?.name}</p>
                    <p className="text-xs text-navy-950"><span className="font-bold">Total:</span> ₹{booking.totalPrice.toLocaleString()}</p>
                    <p className="text-xs text-navy-950"><span className="font-bold">Date:</span> {new Date(booking.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                <Button
                  onClick={() => handleSendCoupon(booking.id)}
                  disabled={processingId === booking.id}
                  className="w-full bg-navy-950 text-white rounded-2xl h-12 flex items-center justify-center gap-2"
                >
                  {processingId === booking.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Send 15% Comeback Coupon
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
