import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { QrCode, CheckCircle2, XCircle, Clock, MapPin, Users, Calendar, AlertTriangle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '../../../utils/apiClient';
import { motion } from 'framer-motion';
import { useModal } from '../../../components/shared/ModalProvider';

export function QRScannerModule() {
  const { confirm } = useModal();
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScanning, setIsScanning] = useState(true);

  const scannerRef = React.useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (!isScanning) return;
    if (scannerRef.current) return;

    const scanner = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        rememberLastUsedCamera: true
      },
      false
    );

    scannerRef.current = scanner;

    scanner.render(
      async (decodedText) => {
        // Stop scanning to prevent multiple scans
        if (scannerRef.current) {
          scannerRef.current.pause(true);
        }
        setIsScanning(false);
        await handleScan(decodedText);
        if (scannerRef.current) {
          scannerRef.current.clear();
          scannerRef.current = null;
        }
      },
      (error) => {
        // Ignore normal scan errors (no QR found in frame)
      }
    );

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, [isScanning]);

  const handleScan = async (token: string) => {
    setIsProcessing(true);
    setScanError(null);
    setScanResult(null);

    try {
      // Validate token without checking in
      const res = await apiClient.post<any>('/bookings/qr/validate', { token });
      setScanResult(res);
      toast.success("QR Scanned Successfully");
    } catch (err: any) {
      console.error(err);
      setScanError(err.message || "Invalid Stay Pass");
      toast.error(err.message || "Invalid Stay Pass");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmCheckIn = async () => {
    if (!scanResult) return;
    
    const confirmed = await confirm({
      title: "Confirm Check-In",
      message: `Are you sure you want to check in ${scanResult.guestName}?`
    });

    if (!confirmed) return;

    setIsProcessing(true);
    try {
      await apiClient.post('/bookings/qr/scan', { token: scanResult.token });
      toast.success(`${scanResult.guestName} Successfully Checked In!`);
      setScanResult(null);
      setIsScanning(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to confirm check-in");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    setScanResult(null);
    setScanError(null);
    setIsScanning(true);
  };

  return (
    <div className="bg-white rounded-[2.5rem] border border-sand-200 shadow-sm p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-navy-950 rounded-xl flex items-center justify-center">
          <QrCode className="w-6 h-6 text-gold-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-navy-950">Contactless Check-In</h2>
          <p className="text-navy-950/60 font-medium">Scan digital stay passes to securely check-in guests</p>
        </div>
      </div>

      <div className="bg-sand-50 rounded-3xl p-6 border border-sand-200">
        {isScanning ? (
          <div className="w-full max-w-sm mx-auto overflow-hidden rounded-2xl shadow-inner border-2 border-sand-200 relative">
            <div id="reader" className="w-full"></div>
            <div className="absolute inset-0 border-4 border-gold-400/50 rounded-2xl pointer-events-none z-10" />
            <div className="text-center py-4 text-xs font-bold text-navy-950/60 uppercase tracking-widest absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur z-20 pointer-events-none">
              Align QR code within frame
            </div>
          </div>
        ) : isProcessing ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 text-gold-500 animate-spin mb-4" />
            <p className="text-navy-950 font-bold uppercase tracking-widest text-sm">Validating Pass...</p>
          </div>
        ) : scanError ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-8">
            <div className="w-20 h-20 bg-red-50 border-2 border-red-200 rounded-full flex items-center justify-center mb-6">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-navy-950 mb-2">{scanError}</h3>
            <p className="text-sm text-navy-950/60 text-center max-w-xs mb-8">This QR pass cannot be used for check-in at this time.</p>
            <button onClick={handleCancel} className="px-8 py-3 bg-navy-950 text-white rounded-full font-bold uppercase tracking-widest text-sm hover:bg-gold-600 transition-colors">
              Scan Another Pass
            </button>
          </motion.div>
        ) : scanResult ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex items-center justify-center gap-3 mb-6">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              <h3 className="text-xl font-bold text-emerald-600">Ready For Check-In</h3>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-white p-6 rounded-2xl border border-sand-200">
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

            <div className="flex items-center gap-4 pt-4">
              <button onClick={handleCancel} className="flex-1 py-4 rounded-xl font-bold uppercase tracking-widest text-sm text-navy-950 bg-white border border-sand-200 hover:bg-sand-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleConfirmCheckIn} className="flex-1 py-4 rounded-xl font-bold uppercase tracking-widest text-sm text-white bg-navy-950 hover:bg-gold-600 transition-colors shadow-lg">
                Confirm Check-In
              </button>
            </div>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}
