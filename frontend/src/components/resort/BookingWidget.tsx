import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Users, Info, ArrowRight } from "lucide-react";
import { Button } from "../ui/Button";
import type { Resort } from "../../types/resort";

interface BookingWidgetProps {
  resort: Resort;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialAdults?: number;
  selectedRoomId: string | null;
}

import { useAuth } from "../../context/AuthContext";
import { useProtectedAction } from "../../hooks/useProtectedAction";

export function BookingWidget({ 
  resort, 
  initialCheckIn, 
  initialCheckOut, 
  initialAdults = 2,
  selectedRoomId 
}: BookingWidgetProps) {
  const navigate = useNavigate();
  const { protect } = useProtectedAction();
  const [checkIn, setCheckIn] = useState(initialCheckIn || "");
  const [checkOut, setCheckOut] = useState(initialCheckOut || "");
  const [adults, setAdults] = useState(initialAdults);

  const selectedRoom = resort.roomTypes.find(r => r.id === selectedRoomId);
  
  // Calculate dynamic price based on dates
  const calculateStayDetails = () => {
    if (!checkIn || !checkOut || !selectedRoom) {
      return { 
        baseTotal: selectedRoom?.pricePerNight || 0, 
        taxes: Math.round((selectedRoom?.pricePerNight || 0) * 0.12),
        total: (selectedRoom?.pricePerNight || 0) + Math.round((selectedRoom?.pricePerNight || 0) * 0.12),
        nights: 1,
        isBlocked: false,
        minNightsViolated: false
      };
    }

    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    if (nights <= 0) return { baseTotal: 0, taxes: 0, total: 0, nights: 0, isBlocked: false, minNightsViolated: false };

    let baseTotal = 0;
    let isBlocked = false;
    let maxMinNights = selectedRoom.minNights || 1;

    for (let i = 0; i < nights; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const dateStr = date.toDateString();

      // Check for blockings
      const blocking = selectedRoom.blockings?.find((b: any) => new Date(b.date).toDateString() === dateStr);
      if (blocking) isBlocked = true;

      // Check for price overrides
      const override = selectedRoom.priceOverrides?.find((o: any) => new Date(o.date).toDateString() === dateStr);
      if (override) {
        baseTotal += override.price;
        if (override.minNights && override.minNights > maxMinNights) {
          maxMinNights = override.minNights;
        }
      } else {
        baseTotal += selectedRoom.pricePerNight;
      }
    }

    const taxes = Math.round(baseTotal * 0.12);
    return { 
      baseTotal, 
      taxes, 
      total: baseTotal + taxes, 
      nights, 
      isBlocked,
      minNightsViolated: nights < maxMinNights,
      requiredMinNights: maxMinNights
    };
  };

  const { baseTotal, taxes, total, nights, isBlocked, minNightsViolated, requiredMinNights } = calculateStayDetails();

  const handleBook = () => {
    if (!selectedRoomId || !checkIn || !checkOut) return;
    
    protect(() => {
      navigate("/checkout", {
        state: {
          resortId: resort.id,
          resortName: resort.name,
          roomId: selectedRoomId,
          roomName: selectedRoom?.name,
          checkIn,
          checkOut,
          adults,
          totalPrice: total,
          baseNightlyPrice: baseTotal / (nights || 1),
          image: resort.images[0]
        }
      });
    }, { message: "Complete Your Reservation", view: "register" });
  };

  return (
    <div className="bg-white rounded-[2.5rem] border border-sand-200 shadow-luxury p-8">
      <div className="flex items-baseline justify-between mb-8 pb-6 border-b border-sand-100">
        <div>
          <span className="text-3xl font-serif font-bold text-navy-950">₹{(baseTotal / (nights || 1)).toLocaleString()}</span>
          <span className="text-sm text-navy-950/50 font-medium"> / night</span>
        </div>
        <div className="flex items-center gap-1 text-gold-600 font-bold text-xs">
          <Info className="w-3.5 h-3.5" />
          <span>Best Price Guarantee</span>
        </div>
      </div>

      <div className="space-y-4 mb-8">
        <div className="grid grid-cols-2 gap-2">
          <div className="p-4 bg-sand-50 rounded-2xl border border-sand-100">
            <p className="text-[10px] font-bold text-navy-800/40 uppercase tracking-widest mb-1">Check-in</p>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gold-600" />
              <input 
                type="date" 
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="bg-transparent text-sm font-bold text-navy-950 outline-none w-full" 
              />
            </div>
          </div>
          <div className="p-4 bg-sand-50 rounded-2xl border border-sand-100">
            <p className="text-[10px] font-bold text-navy-800/40 uppercase tracking-widest mb-1">Check-out</p>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gold-600" />
              <input 
                type="date" 
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="bg-transparent text-sm font-bold text-navy-950 outline-none w-full" 
              />
            </div>
          </div>
        </div>

        <div className="p-4 bg-sand-50 rounded-2xl border border-sand-100">
          <p className="text-[10px] font-bold text-navy-800/40 uppercase tracking-widest mb-1">Guests</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gold-600" />
              <span className="text-sm font-bold text-navy-950">{adults} Guests</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setAdults(Math.max(1, adults - 1))}
                className="w-8 h-8 rounded-full border border-sand-200 flex items-center justify-center text-navy-950 hover:bg-white transition-colors"
              >-</button>
              <button 
                onClick={() => setAdults(adults + 1)}
                className="w-8 h-8 rounded-full border border-sand-200 flex items-center justify-center text-navy-950 hover:bg-white transition-colors"
              >+</button>
            </div>
          </div>
        </div>
      </div>

      {!selectedRoomId && (
        <div className="mb-8 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3 items-start">
          <Info className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-xs font-medium text-amber-800">Please select a room type below to proceed with your booking.</p>
        </div>
      )}

      {selectedRoomId && isBlocked && (
        <div className="mb-8 p-4 bg-red-50 rounded-2xl border border-red-100 flex gap-3 items-start">
          <Info className="w-5 h-5 text-red-600 shrink-0" />
          <p className="text-xs font-medium text-red-800">One or more selected dates are unavailable. Please choose different dates.</p>
        </div>
      )}

      {selectedRoomId && !isBlocked && minNightsViolated && (
        <div className="mb-8 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3 items-start">
          <Info className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-xs font-medium text-amber-800">Minimum stay for these dates is {requiredMinNights} nights.</p>
        </div>
      )}

      <div className="space-y-3 mb-8">
        <div className="flex justify-between text-sm">
          <span className="text-navy-950/60 font-medium">{nights} night{nights !== 1 ? 's' : ''} stay</span>
          <span className="text-navy-950 font-bold">₹{baseTotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-navy-950/60 font-medium">Service & GST (12%)</span>
          <span className="text-navy-950 font-bold">₹{taxes.toLocaleString()}</span>
        </div>
        <div className="pt-3 border-t border-sand-100 flex justify-between">
          <span className="text-lg font-bold text-navy-950">Total</span>
          <span className="text-lg font-bold text-navy-950">₹{total.toLocaleString()}</span>
        </div>
      </div>

      <Button 
        className="w-full h-14 text-lg rounded-2xl gap-2 shadow-gold"
        disabled={!selectedRoomId || !checkIn || !checkOut || isBlocked || minNightsViolated}
        onClick={handleBook}
      >
        Complete Booking
        <ArrowRight className="w-5 h-5" />
      </Button>

      <p className="text-center text-[10px] font-bold text-navy-950/40 uppercase tracking-widest mt-6">
        Secure Payment via Razorpay
      </p>
    </div>
  );
}
