import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { QrCode, CheckCircle2, XCircle, Clock, MapPin, Users, Calendar, AlertTriangle, Loader2, Camera, RefreshCw, StopCircle, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '../../../utils/apiClient';
import { motion } from 'framer-motion';
import { useModal } from '../../../components/shared/ModalProvider';

export function QRScannerModule() {
  const { confirm } = useModal();
  const [scannerState, setScannerState] = useState<'IDLE' | 'SCANNING' | 'PROCESSING' | 'PREVIEW' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [scanSuccessResult, setScanSuccessResult] = useState<any | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    fetchHistory();
    return () => {
      stopScanner().catch(console.error);
    };
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await apiClient.get<any>('/bookings/qr/history');
      if (res.history) {
        setHistory(res.history);
      }
    } catch (err) {
      console.error("Failed to fetch recent check-ins", err);
    }
  };

  const startScanner = async () => {
    setScannerState('SCANNING');
    setScanError(null);
    try {
      // Small timeout to allow the DOM to render the #reader div
      setTimeout(async () => {
        try {
          const html5QrCode = new Html5Qrcode("reader");
          html5QrCodeRef.current = html5QrCode;
          await html5QrCode.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            async (decodedText) => {
              if (html5QrCodeRef.current) {
                html5QrCodeRef.current.pause(true);
              }
              await stopScanner();
              handleScan(decodedText);
            },
            (error) => {
              // Ignore normal scanning errors
            }
          );
        } catch (startError: any) {
          console.error(startError);
          setScannerState('ERROR');
          setScanError("Camera Permission Denied or No Camera Found.");
        }
      }, 100);
    } catch (err: any) {
      setScannerState('ERROR');
      setScanError("Failed to initialize scanner.");
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
      } catch (e) {
        console.error(e);
      }
      html5QrCodeRef.current.clear();
      html5QrCodeRef.current = null;
    }
  };

  const handleStopClick = async () => {
    await stopScanner();
    setScannerState('IDLE');
  };

  const handleRestartClick = async () => {
    await stopScanner();
    startScanner();
  };

  const handleScan = async (token: string) => {
    setScannerState('PROCESSING');
    setScanError(null);
    setScanResult(null);

    try {
      const res = await apiClient.post<any>('/bookings/qr/validate', { token });
      setScanResult(res);
      setScannerState('PREVIEW');
    } catch (err: any) {
      console.error(err);
      let errorMsg = "Invalid Stay Pass";
      if (err.response?.status === 409) errorMsg = "Already Checked In";
      if (err.response?.status === 403) errorMsg = "Unauthorized Resort Access";
      if (err.response?.status === 404) errorMsg = "Booking Not Found";
      if (err.response?.status === 400) errorMsg = err.message || "Check-In Not Yet Available";
      
      setScanError(errorMsg);
      setScannerState('ERROR');
    }
  };

  const handleConfirmCheckIn = async () => {
    if (!scanResult) return;
    
    setScannerState('PROCESSING');
    try {
      await apiClient.post('/bookings/qr/scan', { token: scanResult.token });
      setScanSuccessResult({
        guestName: scanResult.guestName,
        bookingId: scanResult.bookingId,
        roomNumber: scanResult.roomType || 'Standard',
        checkInTime: new Date().toLocaleTimeString()
      });
      setScannerState('SUCCESS');
      fetchHistory(); // Refresh history
    } catch (err: any) {
      toast.error(err.message || "Failed to confirm check-in");
      setScannerState('PREVIEW');
    }
  };

  const handleCancel = () => {
    setScanResult(null);
    setScanError(null);
    setScannerState('IDLE');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Scanner Module */}
      <div className="bg-white rounded-[2.5rem] border border-sand-200 shadow-sm p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-navy-950 rounded-xl flex items-center justify-center">
            <QrCode className="w-6 h-6 text-gold-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-navy-950">Contactless Check-In</h2>
            <p className="text-navy-950/60 font-medium">Securely verify guest stay passes and complete check-in.</p>
          </div>
        </div>

        <div className="bg-sand-50 rounded-3xl p-6 border border-sand-200 min-h-[400px] flex flex-col justify-center">
          
          {/* IDLE LANDING SCREEN */}
          {scannerState === 'IDLE' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-20 h-20 bg-white border border-sand-200 shadow-sm rounded-full flex items-center justify-center mb-6">
                <Camera className="w-8 h-8 text-navy-950" />
              </div>
              <h3 className="text-xl font-bold text-navy-950 mb-2">Ready to Scan</h3>
              <p className="text-sm text-navy-950/60 max-w-xs mb-8">Position the guest's QR stay pass within the camera frame to verify their booking.</p>
              <button onClick={startScanner} className="px-8 py-4 bg-navy-950 text-white rounded-full font-bold uppercase tracking-widest text-sm hover:bg-gold-600 transition-colors shadow-lg">
                Start QR Scanner
              </button>
            </motion.div>
          )}

          {/* SCANNING */}
          {scannerState === 'SCANNING' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center">
              <div className="w-full max-w-sm mx-auto overflow-hidden rounded-2xl shadow-inner border-2 border-sand-200 relative bg-black">
                <div id="reader" className="w-full min-h-[300px]"></div>
                <div className="absolute inset-0 border-4 border-gold-400/50 rounded-2xl pointer-events-none z-10" />
                <div className="text-center py-4 text-xs font-bold text-white uppercase tracking-widest absolute bottom-0 left-0 right-0 bg-navy-950/80 backdrop-blur z-20 pointer-events-none">
                  Align QR code within frame
                </div>
              </div>
              
              <div className="mt-8 flex items-center gap-4">
                <button onClick={handleStopClick} className="flex items-center gap-2 px-6 py-3 bg-white border border-sand-200 text-navy-950 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-red-50 hover:text-red-600 transition-colors">
                  <StopCircle className="w-4 h-4" /> Stop Scanner
                </button>
                <button onClick={handleRestartClick} className="flex items-center gap-2 px-6 py-3 bg-white border border-sand-200 text-navy-950 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-sand-100 transition-colors">
                  <RefreshCw className="w-4 h-4" /> Restart
                </button>
              </div>
            </motion.div>
          )}

          {/* PROCESSING */}
          {scannerState === 'PROCESSING' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-12 h-12 text-gold-500 animate-spin mb-6" />
              <p className="text-navy-950 font-bold uppercase tracking-widest text-sm">Processing Data...</p>
            </motion.div>
          )}

          {/* ERROR */}
          {scannerState === 'ERROR' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-20 h-20 bg-red-50 border-2 border-red-200 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-navy-950 mb-2">{scanError}</h3>
              <p className="text-sm text-navy-950/60 max-w-xs mb-8">Please ask the guest to present a valid booking confirmation.</p>
              <button onClick={handleCancel} className="px-8 py-3 bg-navy-950 text-white rounded-full font-bold uppercase tracking-widest text-sm hover:bg-gold-600 transition-colors">
                Back to Scanner
              </button>
            </motion.div>
          )}

          {/* PREVIEW */}
          {scannerState === 'PREVIEW' && scanResult && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex flex-col items-center justify-center gap-2 mb-6 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-2" />
                <h3 className="text-2xl font-bold text-emerald-600">Booking Verified</h3>
                <p className="text-sm font-medium text-navy-950/60">Review details before checking in</p>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-white p-6 rounded-2xl border border-sand-200 shadow-sm">
                <div className="col-span-2">
                  <p className="text-[10px] text-navy-950/40 uppercase tracking-widest font-bold">Traveller Name</p>
                  <p className="font-bold text-navy-950 text-lg">{scanResult.guestName}</p>
                </div>
                <div>
                  <p className="text-[10px] text-navy-950/40 uppercase tracking-widest font-bold">Booking ID</p>
                  <p className="font-bold font-mono text-navy-950 text-sm">{scanResult.bookingId}</p>
                </div>
                <div>
                  <p className="text-[10px] text-navy-950/40 uppercase tracking-widest font-bold">Resort</p>
                  <p className="font-bold text-navy-950 text-sm flex items-center gap-1"><MapPin className="w-3 h-3 text-gold-500" /> {scanResult.resortName}</p>
                </div>
                <div>
                  <p className="text-[10px] text-navy-950/40 uppercase tracking-widest font-bold">Check-In</p>
                  <p className="font-bold text-navy-950 text-sm flex items-center gap-1"><Calendar className="w-3 h-3 text-gold-500" /> {new Date(scanResult.checkIn).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-navy-950/40 uppercase tracking-widest font-bold">Check-Out</p>
                  <p className="font-bold text-navy-950 text-sm flex items-center gap-1"><Calendar className="w-3 h-3 text-gold-500" /> {new Date(scanResult.checkOut).toLocaleDateString()}</p>
                </div>
                <div className="col-span-2 flex items-center justify-between pt-4 border-t border-sand-100">
                  <div>
                    <p className="text-[10px] text-navy-950/40 uppercase tracking-widest font-bold">Guests</p>
                    <p className="font-bold text-navy-950 text-sm flex items-center gap-1"><Users className="w-3 h-3 text-gold-500" /> {scanResult.guests}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-navy-950/40 uppercase tracking-widest font-bold">Status</p>
                    <span className="inline-block px-3 py-1 bg-gold-50 text-gold-600 rounded-full text-xs font-bold uppercase tracking-wider border border-gold-200 mt-1">
                      {scanResult.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <button onClick={handleCancel} className="flex-1 py-4 rounded-xl font-bold uppercase tracking-widest text-sm text-navy-950 bg-white border border-sand-200 hover:bg-sand-50 transition-colors">
                  Cancel
                </button>
                <button onClick={handleConfirmCheckIn} className="flex-1 py-4 rounded-xl font-bold uppercase tracking-widest text-sm text-white bg-navy-950 hover:bg-gold-600 transition-colors shadow-lg">
                  Confirm Check-In
                </button>
              </div>
            </motion.div>
          )}

          {/* SUCCESS */}
          {scannerState === 'SUCCESS' && scanSuccessResult && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-24 h-24 bg-emerald-50 border-4 border-emerald-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <Check className="w-12 h-12 text-emerald-500" />
              </div>
              <h3 className="text-2xl font-bold text-navy-950 mb-2">Guest Successfully Checked In</h3>
              
              <div className="w-full max-w-sm bg-white p-6 rounded-2xl border border-sand-200 my-8 space-y-4 text-left">
                <div className="flex justify-between items-center border-b border-sand-100 pb-3">
                  <span className="text-xs font-bold uppercase tracking-widest text-navy-950/40">Guest Name</span>
                  <span className="font-bold text-navy-950">{scanSuccessResult.guestName}</span>
                </div>
                <div className="flex justify-between items-center border-b border-sand-100 pb-3">
                  <span className="text-xs font-bold uppercase tracking-widest text-navy-950/40">Booking ID</span>
                  <span className="font-mono text-sm font-bold text-navy-950">{scanSuccessResult.bookingId}</span>
                </div>
                <div className="flex justify-between items-center border-b border-sand-100 pb-3">
                  <span className="text-xs font-bold uppercase tracking-widest text-navy-950/40">Room Type</span>
                  <span className="font-bold text-navy-950">{scanSuccessResult.roomNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-widest text-navy-950/40">Check-In Time</span>
                  <span className="font-bold text-navy-950">{scanSuccessResult.checkInTime}</span>
                </div>
              </div>

              <button onClick={handleCancel} className="px-10 py-4 bg-navy-950 text-white rounded-full font-bold uppercase tracking-widest text-sm hover:bg-gold-600 transition-colors shadow-lg">
                Scan Next Guest
              </button>
            </motion.div>
          )}

        </div>
      </div>

      {/* RECENT CHECK-INS */}
      <div className="bg-white rounded-[2.5rem] border border-sand-200 shadow-sm p-8">
        <div className="flex items-center gap-3 mb-6">
          <Clock className="w-5 h-5 text-gold-500" />
          <h3 className="text-lg font-bold text-navy-950">Recent Check-Ins</h3>
        </div>
        
        {history.length === 0 ? (
          <div className="text-center py-8 bg-sand-50 rounded-2xl border border-sand-100">
            <p className="text-sm text-navy-950/60 italic">No recent check-ins today.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-sand-200">
            <table className="w-full text-left">
              <thead className="bg-sand-50">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-navy-950/40">Guest</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-navy-950/40">Booking ID</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-navy-950/40 hidden sm:table-cell">Time</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-navy-950/40 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-100">
                {history.map((entry, idx) => (
                  <tr key={idx} className="hover:bg-sand-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-navy-950 text-sm">{entry.guestName}</div>
                      <div className="text-xs text-navy-950/40 sm:hidden">{new Date(entry.time).toLocaleTimeString()}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-navy-950/60">{entry.bookingId}</td>
                    <td className="px-6 py-4 text-xs text-navy-950/60 hidden sm:table-cell">{new Date(entry.time).toLocaleTimeString()}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-block px-2 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-wider border border-emerald-200">
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
