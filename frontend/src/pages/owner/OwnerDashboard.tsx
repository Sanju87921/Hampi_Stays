import { useState, useEffect } from "react";
import { luxuryConfirm } from "../../utils/luxuryConfirm";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, Plus, Calendar as CalIcon,
  Trash2, CheckCircle, AlertCircle, Loader2,
  IndianRupee, CalendarCheck, Users, TrendingUp, ChevronRight, X, Mail, Star, User, QrCode
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Select";
import { Input } from "../../components/ui/Input";
import { useNavigate, useSearchParams } from "react-router-dom";
import { cn } from "../../utils/cn";
import { ProfileIncompleteBanner } from "../../components/shared/ProfileIncompleteBanner";
import { KycUploadSection } from "../../components/shared/KycUploadSection";
import { QRScannerModule } from "../admin/components/QRScannerModule";
import { apiClient } from "../../utils/apiClient";
import { compressImageFile } from "../../utils/image";
import { uploadToCloudinary } from "../../utils/cloudinary";
import { Eye, RefreshCw, Image as ImageIcon, ChevronLeft } from "lucide-react";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as QRCode from "qrcode";
import { applyPdfWatermark } from "../../utils/pdfWatermark";

const downloadPdf = (doc: any, filename: string) => {
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export function OwnerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [resorts, setResorts] = useState<any[]>([]);
  const [activeResortIdx, setActiveResortIdx] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [isAddingRoom, setIsLoadingAddingRoom] = useState(false);
  const [roomFormData, setRoomFormData] = useState({
    name: "",
    description: "",
    pricePerNight: "",
    capacity: "2",
    availableCount: "1"
  });
  const [isUpdatingResortPhotos, setIsUpdatingResortPhotos] = useState(false);
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";
  const [showBookingsModal, setShowBookingsModal] = useState(false);
  const [activeMessageBooking, setActiveMessageBooking] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("RECEPTIONIST");
  const [pendingInvitations, setPendingInvitations] = useState<any[]>([]);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  
  // New States for Edit / Block functionalities
  const [showEditRoom, setShowEditRoom] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [showBlockRoom, setShowBlockRoom] = useState(false);
  const [blockingFormData, setBlockingFormData] = useState({ date: "", reason: "", roomId: "" });
  
  const [showEditBooking, setShowEditBooking] = useState(false);
  const [editingBooking, setEditingBooking] = useState<any | null>(null);
  const [bookingFormData, setBookingFormData] = useState({ checkIn: "", checkOut: "", guests: "", roomId: "", totalPrice: "" });

  // Dining Modal States
  const [showDiningModal, setShowDiningModal] = useState(false);
  const [diningPackages, setDiningPackages] = useState<any[]>([]);

  const [housekeeping, setHousekeeping] = useState([
    { id: '1', room: '101', type: 'Heritage Suite', status: 'DIRTY', color: 'bg-red-500', lastCleaned: '2h ago', staff: 'Unassigned' },
    { id: '2', room: '104', type: 'Riverside Cottage', status: 'CLEANING', color: 'bg-blue-500', lastCleaned: '45m ago', staff: 'Priya D.' },
    { id: '3', room: '202', type: 'Garden Villa', status: 'READY', color: 'bg-emerald-500', lastCleaned: 'Just now', staff: 'Sanjay K.' }
  ]);

  const fetchResorts = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    try {
      const data = await apiClient.get<any[]>(`/owners/${user.id}/resorts`);
      setResorts(data);
    } catch (error) {
      console.error("Error fetching resorts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResorts();
    
    // Command Center Pulse: Refresh owner data every 30 seconds for real-time operations
    const pulse = setInterval(fetchResorts, 30000);
    return () => clearInterval(pulse);
  }, [user]);

  const resort = resorts[activeResortIdx];

  const totalRevenue = resort?.bookings
    ?.filter((b: any) => b.status !== "CANCELLED")
    .reduce((sum: number, b: any) => sum + b.totalPrice, 0) || 0;

  const activeBookingsCount = resort?.bookings
    ?.filter((b: any) => b.status === "CONFIRMED" || b.status === "PENDING").length || 0;

  const stats = [
    { label: "Total Revenue", value: resort ? `₹${totalRevenue.toLocaleString("en-IN")}` : "₹0", icon: IndianRupee, trend: "+12.5%", color: "text-green-600 bg-green-50" },
    { label: "Active Bookings", value: resort ? activeBookingsCount.toString() : "0", icon: CalendarCheck, trend: "+3", color: "text-blue-600 bg-blue-50", onClick: () => setShowBookingsModal(true) },
    { label: "Guest Satisfaction", value: resort ? (resort.rating || "N/A").toString() + "/5" : "N/A", icon: Users, trend: "+0.2", color: "text-gold-600 bg-gold-50" },
    { label: "Resort Views", value: resort ? "12.8k" : "0", icon: TrendingUp, trend: "+18%", color: "text-purple-600 bg-purple-50" },
  ];

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resort) return;
    setIsLoadingAddingRoom(true);
    try {
      await apiClient.post(`/resorts/${resort.id}/rooms`, {
        ...roomFormData,
        pricePerNight: parseFloat(roomFormData.pricePerNight),
        capacity: parseInt(roomFormData.capacity),
        availableCount: parseInt(roomFormData.availableCount)
      });
      setShowAddRoom(false);
      setRoomFormData({ name: "", description: "", pricePerNight: "", capacity: "2", availableCount: "1" });
      fetchResorts();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingAddingRoom(false);
    }
  };

  const handleEditRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoomId) return;
    setIsLoadingAddingRoom(true);
    try {
      await apiClient.patch(`/rooms/${editingRoomId}`, {
        ...roomFormData,
        pricePerNight: parseFloat(roomFormData.pricePerNight),
        capacity: parseInt(roomFormData.capacity),
        availableCount: parseInt(roomFormData.availableCount)
      });
      setShowEditRoom(false);
      setEditingRoomId(null);
      setRoomFormData({ name: "", description: "", pricePerNight: "", capacity: "2", availableCount: "1" });
      fetchResorts();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingAddingRoom(false);
    }
  };

  const handleBlockRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockingFormData.roomId) return;
    try {
      await apiClient.post(`/rooms/${blockingFormData.roomId}/blockings`, {
        date: blockingFormData.date,
        reason: blockingFormData.reason
      });
      setShowBlockRoom(false);
      setBlockingFormData({ date: "", reason: "", roomId: "" });
      toast.success("Room successfully blocked.");
      fetchResorts();
    } catch (error) {
      console.error(error);
      toast.error("Failed to block room.");
    }
  };

  const handleEditBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooking) return;
    try {
      await apiClient.patch(`/bookings/${editingBooking.id}`, {
        ...bookingFormData,
        guests: parseInt(bookingFormData.guests),
        totalPrice: parseFloat(bookingFormData.totalPrice)
      });
      setShowEditBooking(false);
      setEditingBooking(null);
      toast.success("Booking updated");
      fetchResorts();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update booking.");
    }
  };

  const handleDeletePhoto = async (resortId: string, photoUrl: string) => {
    try {
      await apiClient.delete(`/resorts/${resortId}/photos`, { data: { url: photoUrl } });
      fetchResorts();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteRoomPhoto = async (roomId: string, photoId: string) => {
    try {
      await apiClient.delete(`/rooms/${roomId}/photos/${photoId}`);
      fetchResorts();
      toast.success("Photo deleted.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete photo.");
    }
  };

  const handleRoomPhotoUpload = async (file: File | undefined, roomId: string) => {
    if (!file) return;
    const tId = toast.loading("Uploading photo...");
    try {
      const { url } = await uploadToCloudinary(file, 'room_photo');
      const room = resorts[activeResortIdx]?.roomTypes?.find((r: any) => r.id === roomId);
      const sortOrder = room?.photos?.length || 0;
      await apiClient.post(`/rooms/${roomId}/photos`, {
        imageUrl: url,
        isCover: sortOrder === 0, // make cover if it's the first photo
        sortOrder
      });
      fetchResorts();
      toast.success("Room photo uploaded successfully!", { id: tId });
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload photo", { id: tId });
    }
  };

  const setRoomCoverPhoto = async (roomId: string, photoId: string) => {
    try {
      await apiClient.patch(`/rooms/${roomId}/photos/${photoId}`, { isCover: true });
      fetchResorts();
      toast.success("Cover photo updated.");
    } catch (e) {
      toast.error("Failed to set cover photo");
    }
  };

  const handleMoveRoomPhoto = async (roomId: string, photoId: string, direction: 'left' | 'right') => {
    const room = resorts[activeResortIdx]?.roomTypes?.find((r: any) => r.id === roomId);
    if (!room || !room.photos) return;
    const photos = [...room.photos].sort((a, b) => a.sortOrder - b.sortOrder);
    const currentIndex = photos.findIndex((p: any) => p.id === photoId);
    if (currentIndex === -1) return;
    if (direction === 'left' && currentIndex === 0) return;
    if (direction === 'right' && currentIndex === photos.length - 1) return;

    const targetIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
    // Swap sort orders
    const currentOrder = photos[currentIndex].sortOrder;
    const targetOrder = photos[targetIndex].sortOrder;
    
    photos[currentIndex].sortOrder = targetOrder;
    photos[targetIndex].sortOrder = currentOrder;

    try {
      await apiClient.post(`/rooms/${roomId}/photos/reorder`, {
        updates: [
          { id: photos[currentIndex].id, sortOrder: photos[currentIndex].sortOrder },
          { id: photos[targetIndex].id, sortOrder: photos[targetIndex].sortOrder }
        ]
      });
      fetchResorts();
    } catch (e) {
      toast.error("Failed to reorder photos");
    }
  };

  const handleResortPhotoUpload = async (file: File | undefined, resortId: string) => {
    if (!file) return;
    try {
      const { url } = await uploadToCloudinary(file, 'resort_photo');
      await apiClient.post(`/resorts/${resortId}/photos`, { url });
      fetchResorts();
      toast.success("Resort photo uploaded!");
    } catch(e) {
      toast.error("Failed to upload resort photo");
    }
  };

  const handleDeleteResort = async (resortId: string) => {
    try {
      await apiClient.delete(`/resorts/${resortId}`);
      setActiveResortIdx(0);
      fetchResorts();
    } catch (err) {
      toast.error("Failed to delete resort.");
    }
  };

  const handleDownloadInvoice = async (booking: any) => {
    if (!resort || !booking) return;
    const doc = new jsPDF();
    const safeRef = booking.referenceNumber || `HS-${Math.random().toString(36).toUpperCase().substring(2, 10)}`;
    const issueDate = new Date().toLocaleDateString("en-GB");
    
    // Brand Colors
    const navy: [number, number, number] = [10, 15, 30];   // #0A0F1E
    const gold: [number, number, number] = [184, 134, 11]; // #B8860B
    const sand: [number, number, number] = [245, 245, 240]; // #F5F5F0

    // --- 1. PREMIUM HEADER ---
    doc.setFillColor(navy[0], navy[1], navy[2]);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("times", "bold");
    doc.setFontSize(28);
    doc.text("HAMPISTAYS", 15, 22);
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(180, 180, 180);
    doc.text("PARTNER NETWORK | SETTLEMENT INVOICE", 15, 28);

    doc.setTextColor(gold[0], gold[1], gold[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("OFFICIAL SETTLEMENT", 195, 18, { align: 'right' });
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Ref: INV-${safeRef}`, 195, 24, { align: 'right' });
    doc.text(`Date: ${issueDate}`, 195, 29, { align: 'right' });

    // --- 2. LUXURY BORDER & TITLE ---
    doc.setDrawColor(gold[0], gold[1], gold[2]);
    doc.setLineWidth(0.5);
    doc.line(15, 50, 195, 50);

    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.setFont("times", "bolditalic");
    doc.setFontSize(18);
    doc.text("Settlement Advice", 105, 62, { align: 'center' });

    // --- 3. TWO-COLUMN DETAILS SECTION ---
    let currentY = 75;
    
    // Column 1: Partner Info
    doc.setFillColor(sand[0], sand[1], sand[2]);
    doc.rect(15, currentY, 85, 35, 'F');
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(gold[0], gold[1], gold[2]);
    doc.text("PARTNER DETAILS", 20, currentY + 8);
    
    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(resort.name, 20, currentY + 16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Ref: ${safeRef}`, 20, currentY + 22);
    doc.text(`Date: ${issueDate}`, 20, currentY + 28);

    // Column 2: Booking Summary
    doc.setFillColor(sand[0], sand[1], sand[2]);
    doc.rect(110, currentY, 85, 35, 'F');
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(gold[0], gold[1], gold[2]);
    doc.text("STAY SUMMARY", 115, currentY + 8);
    
    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(booking.user?.name || 'Guest', 115, currentY + 16);
    doc.setFont("helvetica", "normal");
    doc.text(`Check-in: ${new Date(booking.checkIn).toLocaleDateString("en-IN")}`, 115, currentY + 22);
    doc.text(`Check-out: ${new Date(booking.checkOut).toLocaleDateString("en-IN")}`, 115, currentY + 28);

    // --- 4. ITEMIZATION TABLE ---
    currentY += 45;
    const currentComm = booking.commissionRate || 7.0;
    const commAmt = (booking.totalPrice * currentComm) / 100;
    const netPayout = booking.totalPrice - commAmt;

    autoTable(doc, {
      startY: currentY,
      head: [['DESCRIPTION', 'AMOUNT']],
      body: [
        ['Accommodation Charges (Gross)', `INR ${booking.totalPrice?.toLocaleString("en-IN")}`],
        [`Platform Service Fee (${currentComm}%)`, `(-) INR ${commAmt.toLocaleString("en-IN")}`],
        ['NET PARTNER PAYOUT', `INR ${netPayout.toLocaleString("en-IN")}`],
      ],
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 8 },
      headStyles: { fillColor: [240, 240, 240], textColor: navy, fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { textColor: navy },
      columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right', fontStyle: 'bold', fontSize: 11 } },
      margin: { left: 15, right: 15 },
    });

    // --- 5. VERIFICATION & FOOTER ---
    currentY = (doc as any).lastAutoTable.finalY + 15;
    doc.setDrawColor(230, 230, 230);
    doc.rect(15, currentY, 180, 50);

    doc.setFont("times", "bold");
    doc.setFontSize(11);
    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.text("Business Verification", 22, currentY + 10);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text("• This receipt is electronically generated for tax compliance.", 22, currentY + 18);
    doc.text("• Payouts are settled within 48 hours of guest check-out.", 22, currentY + 24);
    doc.text("• For billing disputes, contact partner.support@hampistays.com", 22, currentY + 30);

    try {
      const qrUrl = `${window.location.origin}/dashboard/bookings`;
      const qrCode = await QRCode.toDataURL(qrUrl, { 
        margin: 1, 
        width: 150,
        color: { dark: '#0A0F1E', light: '#FFFFFF' },
        errorCorrectionLevel: 'H'
      });
      doc.addImage(qrCode, 'PNG', 155, currentY + 10, 30, 30);
    } catch (e) { console.error(e); }

    const footerY = 270;
    doc.setDrawColor(gold[0], gold[1], gold[2]);
    doc.line(40, footerY, 170, footerY);
    doc.setFont("times", "italic");
    doc.setFontSize(10);
    doc.text("Sustainable Luxury through Heritage Partnership.", 105, footerY + 8, { align: 'center' });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text("HampiStays Partner Network | Hampi, Karnataka | help@hampistays.com", 105, footerY + 14, { align: 'center' });

    // --- 7. APPLY LUXURY WATERMARK SYSTEM ---
    applyPdfWatermark(doc, { referenceNumber: safeRef });

    downloadPdf(doc, `HampiStays_Invoice_${safeRef}.pdf`);
  };

  const handleDownloadConfirmation = async (booking: any) => {
    const doc = new jsPDF();
    const safeRef = booking.referenceNumber || `HS-${Math.random().toString(36).toUpperCase().substring(2, 10)}`;
    const issueDate = new Date().toLocaleDateString("en-GB");
    
    // Brand Colors
    const navy: [number, number, number] = [10, 15, 30];   // #0A0F1E
    const gold: [number, number, number] = [184, 134, 11]; // #B8860B
    const sand: [number, number, number] = [245, 245, 240]; // #F5F5F0

    // --- 1. PREMIUM HEADER ---
    doc.setFillColor(navy[0], navy[1], navy[2]);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("times", "bold");
    doc.setFontSize(28);
    doc.text("HAMPISTAYS", 15, 22);
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(180, 180, 180);
    doc.text("LUXURY ECO-HOSPITALITY | HAMPI, INDIA", 15, 28);

    doc.setTextColor(gold[0], gold[1], gold[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("OFFICIAL CONFIRMATION", 195, 18, { align: 'right' });
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Ref: ${safeRef}`, 195, 24, { align: 'right' });
    doc.text(`Date: ${issueDate}`, 195, 29, { align: 'right' });

    // --- 2. LUXURY BORDER & TITLE ---
    doc.setDrawColor(gold[0], gold[1], gold[2]);
    doc.setLineWidth(0.5);
    doc.line(15, 50, 195, 50);

    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.setFont("times", "bolditalic");
    doc.setFontSize(18);
    doc.text("Your Royal Retreat is Confirmed", 105, 62, { align: 'center' });

    // --- 3. TWO-COLUMN DETAILS SECTION ---
    let currentY = 75;
    
    // Column 1: Guest Info
    doc.setFillColor(sand[0], sand[1], sand[2]);
    doc.rect(15, currentY, 85, 35, 'F');
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(gold[0], gold[1], gold[2]);
    doc.text("GUEST & BOOKING", 20, currentY + 8);
    
    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(booking.user?.name || 'Guest', 20, currentY + 16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Status: CONFIRMED`, 20, currentY + 22);
    doc.text(`Reference: ${safeRef}`, 20, currentY + 28);

    // Column 2: Accommodation
    doc.setFillColor(sand[0], sand[1], sand[2]);
    doc.rect(110, currentY, 85, 35, 'F');
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(gold[0], gold[1], gold[2]);
    doc.text("ACCOMMODATION", 115, currentY + 8);
    
    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(resort.name, 115, currentY + 16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(booking.room?.name || 'Premium Heritage Room', 115, currentY + 22);
    doc.text(`${Math.ceil((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 60 * 60 * 24))} Night(s) Stay`, 115, currentY + 28);

    // --- 4. STAY SUMMARY TABLE ---
    currentY += 45;
    autoTable(doc, {
      startY: currentY,
      head: [['CHECK-IN', 'CHECK-OUT', 'GUESTS', 'TOTAL PAID']],
      body: [[
        `${new Date(booking.checkIn).toLocaleDateString("en-GB")}\n14:00 PM`,
        `${new Date(booking.checkOut).toLocaleDateString("en-GB")}\n11:00 AM`,
        `${booking.guests} Adult(s)`,
        `INR ${booking.totalPrice?.toLocaleString("en-IN")}`
      ]],
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 6, halign: 'center' },
      headStyles: { 
        fillColor: [240, 240, 240], 
        textColor: navy, 
        fontStyle: 'bold', 
        fontSize: 8,
        lineWidth: 0.1,
        lineColor: [200, 200, 200]
      },
      bodyStyles: { textColor: navy, fontStyle: 'bold', fontSize: 11 },
      margin: { left: 15, right: 15 },
    });

    // --- 5. IMPORTANT INFO & QR (SIDE-BY-SIDE) ---
    currentY = (doc as any).lastAutoTable.finalY + 15;
    doc.setDrawColor(230, 230, 230);
    doc.rect(15, currentY, 180, 55);

    doc.setFont("times", "bold");
    doc.setFontSize(11);
    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.text("Essential Information", 22, currentY + 10);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(80, 80, 80);
    const infoPoints = [
      "• Present a valid Govt ID (Aadhar/Passport) at check-in.",
      "• Cancellation: Free up to 48 hours prior to arrival.",
      "• HampiStays is a plastic-free sanctuary.",
      "• Standard Check-in 2 PM | Check-out 11 AM."
    ];
    infoPoints.forEach((point, i) => {
      doc.text(point, 22, currentY + 18 + (i * 6));
    });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(gold[0], gold[1], gold[2]);
    doc.text("SCAN TO VERIFY", 165, currentY + 10, { align: 'center' });
    
    try {
      const qrUrl = `${window.location.origin}/dashboard/bookings`;
      const qrCode = await QRCode.toDataURL(qrUrl, { 
        margin: 1, 
        width: 200,
        color: { dark: '#0A0F1E', light: '#FFFFFF' },
        errorCorrectionLevel: 'H'
      });
      doc.addImage(qrCode, 'PNG', 150, currentY + 13, 30, 30);
    } catch (e) { console.error(e); }

    // --- 6. LUXURY FOOTER ---
    const footerY = 270;
    doc.setDrawColor(gold[0], gold[1], gold[2]);
    doc.setLineWidth(0.1);
    doc.line(40, footerY, 170, footerY);
    doc.setFont("times", "italic");
    doc.setFontSize(10);
    doc.text("We look forward to welcoming you to the heart of Hampi's heritage.", 105, footerY + 8, { align: 'center' });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text("Main Road, Hampi, Karnataka 583239 | +91 99000 88000 | help@hampistays.com", 105, footerY + 14, { align: 'center' });

    // --- 7. APPLY LUXURY WATERMARK SYSTEM ---
    applyPdfWatermark(doc, { referenceNumber: safeRef });

    downloadPdf(doc, `HampiStays_Confirmation_${safeRef}.pdf`);
  };

  const fetchStaffData = async () => {
    if (!resorts.length) return;
    try {
      const data = await apiClient.get<any[]>(`/admin/staff/invitations/${resorts[0].id}`);
      setPendingInvitations(data);
    } catch (error) {
      console.error("Failed to fetch staff data:", error);
    }
  };

  const handleSendInvite = async () => {
    if (!inviteEmail || !resorts.length) return;
    try {
      await apiClient.post('/admin/staff/invite', {
        email: inviteEmail,
        role: inviteRole,
        resortId: resorts?.[0]?.id
      });
      setInviteEmail("");
      setIsInviteModalOpen(false);
      fetchStaffData();
    } catch (error) {
      console.error("Failed to send invite:", error);
    }
  };

  useEffect(() => {
    if (resorts.length) fetchStaffData();
  }, [resorts]);

  const handleHousekeepingStatus = (id: string) => {
    const statusCycle: Record<string, { next: string; color: string }> = {
      'DIRTY': { next: 'CLEANING', color: 'bg-blue-500' },
      'CLEANING': { next: 'READY', color: 'bg-emerald-500' },
      'READY': { next: 'DIRTY', color: 'bg-red-500' }
    };
    
    setHousekeeping(prev => prev.map(item => {
      if (item.id === id) {
        const nextState = statusCycle[item.status];
        return { ...item, status: nextState.next, color: nextState.color, lastCleaned: 'Just now' };
      }
      return item;
    }));
  };

  const handleBookingAction = async (bookingId: string, action: 'confirm' | 'reject' | 'checkin' | 'checkout') => {
    setActionLoadingId(bookingId);
    try {
      const endpoint = action === 'confirm' || action === 'reject' 
        ? `/bookings/${bookingId}/${action}`
        : `/bookings/${bookingId}/status`;
      
      const payload = action === 'checkin' || action === 'checkout' 
        ? { status: action === 'checkin' ? 'CHECKED_IN' : 'COMPLETED' } 
        : undefined;

      await apiClient.patch(endpoint, payload);
      
      // If check-in is successful, trigger the welcome greeting
      if (action === 'checkin') {
        try {
          await apiClient.post(`/bookings/${bookingId}/welcome-greet`);
        } catch (err) {
          console.error("Failed to trigger welcome greeting:", err);
        }
      }
      await fetchResorts();
    } catch (error) {
      console.error("Booking action failed:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update booking status.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeMessageBooking) return;
    
    try {
      const savedMsg = await apiClient.post<any>('/messages', {
        text: newMessage,
        senderId: user?.id,
        bookingId: activeMessageBooking.id
      });
      setMessages(prev => [...prev, savedMsg]);
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTab === 'inbox' && activeMessageBooking) {
      const fetchMessages = async () => {
        try {
          const data = await apiClient.get<any[]>(`/messages/${activeMessageBooking.id}`);
          setMessages(data);
        } catch (err) {
          console.error("Poll failed", err);
        }
      };
      fetchMessages();
      interval = setInterval(fetchMessages, 5000); // Poll every 5 seconds
    }
    return () => clearInterval(interval);
  }, [activeTab, activeMessageBooking]);

  const handleSaveDining = async () => {
    if (!resort) return;
    try {
      await apiClient.patch(`/resorts/${resort.id}/meal-packages`, diningPackages);
      toast.success("Meal packages updated");
      setShowDiningModal(false);
      fetchResorts();
    } catch (err) {
      toast.error("Failed to update meal packages");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-sand-50 pt-24 pb-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="animate-pulse space-y-12">
            {/* Header Skeleton */}
            <div className="flex flex-col md:flex-row justify-between gap-6">
              <div>
                <div className="h-10 w-64 bg-sand-200 rounded-lg mb-4"></div>
                <div className="h-4 w-48 bg-sand-200 rounded"></div>
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="h-12 w-32 bg-sand-200 rounded-xl"></div>
                <div className="h-12 w-32 bg-sand-200 rounded-xl"></div>
                <div className="h-12 w-32 bg-sand-200 rounded-xl"></div>
                <div className="h-12 w-32 bg-sand-200 rounded-xl"></div>
              </div>
            </div>
            {/* Stats Grid Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-[2rem] border border-sand-100 h-36 flex flex-col justify-between">
                  <div className="h-12 w-12 bg-sand-100 rounded-2xl"></div>
                  <div>
                    <div className="h-4 w-24 bg-sand-200 rounded mb-2"></div>
                    <div className="h-8 w-32 bg-sand-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
            {/* Split Section Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="h-96 bg-white rounded-[2.5rem] border border-sand-100 p-8">
                  <div className="h-8 w-48 bg-sand-200 rounded mb-8"></div>
                  <div className="space-y-4">
                     <div className="h-16 bg-sand-100 rounded-2xl"></div>
                     <div className="h-16 bg-sand-100 rounded-2xl"></div>
                     <div className="h-16 bg-sand-100 rounded-2xl"></div>
                  </div>
               </div>
               <div className="h-96 bg-white rounded-[2.5rem] border border-sand-100 p-8">
                  <div className="h-8 w-48 bg-sand-200 rounded mb-8"></div>
                  <div className="space-y-4">
                     <div className="h-16 bg-sand-100 rounded-2xl"></div>
                     <div className="h-16 bg-sand-100 rounded-2xl"></div>
                     <div className="h-16 bg-sand-100 rounded-2xl"></div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (resorts.length === 0) {
    return (
      <div className="relative min-h-screen pt-24 pb-12 flex items-center justify-center overflow-hidden bg-navy-950">
        <img 
          src="/hampi-temple.png" 
          alt="Hampi Temple Background" 
          className="absolute inset-0 w-full h-full object-cover opacity-40" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/20 to-transparent" />
        
        <div className="relative container mx-auto px-4 text-center z-10">
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl mx-auto bg-sand-50/95 backdrop-blur-xl rounded-[3rem] p-12 shadow-2xl border border-sand-100">
            <div className="w-20 h-20 bg-gold-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-gold relative overflow-hidden">
              <Building2 className="w-10 h-10 text-navy-950 relative z-10" />
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
            <h1 className="text-4xl font-serif font-bold text-navy-950 mb-4">
              Welcome to <span className="italic text-gold-600">Hampi Resorts</span>
            </h1>
            <p className="text-navy-950/60 mb-10 leading-relaxed text-lg font-medium">
              Hello {user?.name}! We're thrilled to have you as a partner. To start welcoming guests to your sanctuary, let's set up your resort details.
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <Button size="lg" className="rounded-2xl px-10 py-6 text-lg shadow-gold transition-transform hover:scale-105" onClick={() => navigate("/dashboard/resort-setup")}>
                List Your Resort Now
              </Button>
              <Button variant="outline" size="lg" className="rounded-2xl px-10 py-6 text-lg border-navy-200 text-navy-950 hover:bg-navy-50">
                View Partner Guide
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand-50 pt-24 pb-12">
      <div className="container mx-auto px-4 md:px-6">
        {/* Multi-resort Switcher (if more than one) */}
        {resorts.length > 1 && (
          <div className="flex gap-2 mb-8 p-1.5 bg-white rounded-2xl border border-sand-100 w-fit">
            {resorts.map((r, idx) => (
              <button key={r.id} onClick={() => setActiveResortIdx(idx)}
                className={cn("px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
                  activeResortIdx === idx ? "bg-navy-950 text-white shadow" : "text-navy-950/40 hover:text-navy-950")}>
                {r.name}
              </button>
            ))}
          </div>
        )}

        <ProfileIncompleteBanner />

        {!resort.owner?.isVerified && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-4 shadow-sm"
          >
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-red-900 font-bold mb-1">Account Verification Pending</h3>
              <p className="text-red-700 text-sm mb-3">
                Your account is pending KYC verification. Until approved, your resort remains hidden from travellers and you cannot accept new bookings.
              </p>
              <Button 
                onClick={() => navigate("/dashboard?tab=kyc")}
                className="bg-red-600 hover:bg-red-700 text-white border-none text-xs h-8 px-4"
              >
                Complete KYC Verification
              </Button>
            </div>
          </motion.div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-serif font-bold text-navy-950">{resort.name}</h1>
              <span className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border flex items-center gap-1.5",
                resort.status === "APPROVED" ? "bg-green-50 text-green-700 border-green-100" : 
                resort.status === "REJECTED" ? "bg-red-50 text-red-700 border-red-100" :
                "bg-gold-50 text-gold-700 border-gold-100")}>
                {resort.status === "APPROVED" ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                {resort.status}
              </span>
            </div>
            <p className="text-navy-950/50 flex items-center gap-2">
              <Building2 className="w-4 h-4" /> {resort.locationArea}, Hampi • <span className="text-gold-600 font-medium capitalize">{resort.category || resort.type}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button 
              variant="outline" 
              className="rounded-xl border-sand-200 text-navy-950 whitespace-nowrap"
              onClick={() => navigate("/dashboard/inventory")}
            >
              <CalIcon className="w-4 h-4 mr-2" /> Manage Pricing
            </Button>
            <Button 
              variant="outline" 
              className="rounded-xl border-sand-200 text-navy-950 whitespace-nowrap"
              onClick={() => navigate("/dashboard/profile")}
            >
              <Users className="w-4 h-4 mr-2" /> My Profile
            </Button>
            <Button 
              variant="outline" 
              className={cn("rounded-xl border-sand-200 text-navy-950 whitespace-nowrap", activeTab === "staff" && "bg-navy-950 text-white")}
              onClick={() => navigate("/dashboard?tab=staff")}
            >
              <Users className="w-4 h-4 mr-2" /> Staff & Ops
            </Button>
            <Button 
              variant="outline" 
              className={cn("rounded-xl border-sand-200 text-navy-950 whitespace-nowrap", activeTab === "analytics" && "bg-navy-950 text-white")}
              onClick={() => navigate("/dashboard?tab=analytics")}
            >
              <TrendingUp className="w-4 h-4 mr-2" /> Analytics
            </Button>
            <Button 
              variant="outline" 
              className={cn("rounded-xl border-sand-200 text-navy-950 whitespace-nowrap", activeTab === "bookings" && "bg-navy-950 text-white")}
              onClick={() => navigate("/dashboard?tab=bookings")}
            >
              <CalendarCheck className="w-4 h-4 mr-2" /> Bookings
            </Button>
            <Button 
              variant="outline" 
              className={cn("rounded-xl border-sand-200 text-navy-950 whitespace-nowrap", activeTab === "finance" && "bg-navy-950 text-white")}
              onClick={() => navigate("/dashboard?tab=finance")}
            >
              <IndianRupee className="w-4 h-4 mr-2" /> Finance & Payouts
            </Button>
            <Button 
              variant="outline" 
              className={cn("rounded-xl border-sand-200 text-navy-950 whitespace-nowrap", activeTab === "reviews" && "bg-navy-950 text-white")}
              onClick={() => navigate("/dashboard?tab=reviews")}
            >
              <Star className="w-4 h-4 mr-2" /> Reviews
            </Button>
            <Button 
              variant="outline" 
              className={cn("rounded-xl border-sand-200 text-navy-950 whitespace-nowrap", activeTab === "settings" && "bg-navy-950 text-white")}
              onClick={() => navigate("/dashboard?tab=settings")}
            >
              <Building2 className="w-4 h-4 mr-2" /> Settings
            </Button>
            <Button 
              variant="outline" 
              className={cn("rounded-xl border-sand-200 text-navy-950 whitespace-nowrap", activeTab === "kyc" && "bg-navy-950 text-white")}
              onClick={() => navigate("/dashboard?tab=kyc")}
            >
              <CheckCircle className="w-4 h-4 mr-2" /> KYC & Verification
            </Button>
            <Button 
              variant="outline" 
              className={cn("rounded-xl border-sand-200 text-navy-950 whitespace-nowrap", activeTab === "qr-scanner" && "bg-navy-950 text-white")}
              onClick={() => navigate("/dashboard?tab=qr-scanner")}
            >
              <QrCode className="w-4 h-4 mr-2" /> QR Scanner
            </Button>
            <Button className="rounded-xl shadow-gold whitespace-nowrap" onClick={() => navigate("/dashboard/resort-setup")}>
              <Plus className="w-4 h-4 mr-2" /> Add Property
            </Button>
            <Button 
              variant="outline"
              className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 hover:text-red-700"
              onClick={() => {
                luxuryConfirm({
                  title: "Delete Resort",
                  description: "Are you sure you want to permanently delete this resort and all its data? This cannot be undone.",
                  onConfirm: () => handleDeleteResort(resort.id)
                });
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" /> Delete Property
            </Button>
          </div>
        </div>

        {/* Status Message */}
        {resort.status === "PENDING" && (
          <div className="mb-10 p-6 bg-gold-50 rounded-[2rem] border border-gold-100 flex items-start gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shrink-0 border border-gold-200">
              <Loader2 className="w-6 h-6 text-gold-600 animate-spin" />
            </div>
            <div>
              <p className="font-bold text-navy-950">Under Review</p>
              <p className="text-sm text-navy-950/60 mt-0.5">Our admin team is verifying your resort details. Once approved, your sanctuary will be visible to thousands of travellers.</p>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              onClick={stat.onClick}
              className={cn("bg-white p-6 rounded-[2rem] border border-sand-100 shadow-sm transition-all", stat.onClick && "cursor-pointer hover:border-gold-300 hover:shadow-md")}>
              <div className="flex items-center justify-between mb-4">
                <div className={cn("p-3 rounded-2xl", stat.color)}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">{stat.trend}</span>
              </div>
              <p className="text-sm font-medium text-navy-950/40 mb-1">{stat.label}</p>
              <p className="text-3xl font-serif font-bold text-navy-950">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Daily Activity Tracker */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Arrivals Today */}
          <div className="bg-white rounded-[2.5rem] border border-sand-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-sand-100 bg-green-50/30 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-serif font-bold text-navy-950">Today's Arrivals</h3>
                <p className="text-xs text-green-700 font-bold uppercase tracking-widest mt-1">Checking in Today</p>
              </div>
              <div 
                className="w-12 h-12 rounded-2xl bg-white border border-green-100 flex items-center justify-center text-green-600 shadow-sm cursor-pointer hover:bg-green-50 transition-colors"
                onClick={() => navigate("/dashboard?tab=bookings")}
                title="View All Bookings"
              >
                <CalendarCheck className="w-6 h-6" />
              </div>
            </div>
            <div className="p-8 space-y-4">
              {resort?.bookings?.filter((b: any) => {
                const today = new Date().toDateString();
                return new Date(b.checkIn).toDateString() === today && b.status !== 'CANCELLED';
              }).length > 0 ? (
                resort.bookings?.filter((b: any) => {
                  const today = new Date().toDateString();
                  return new Date(b.checkIn).toDateString() === today && b.status !== 'CANCELLED';
                }).map((booking: any) => (
                  <div key={booking.id} className="flex items-center justify-between p-5 rounded-2xl bg-sand-50/50 border border-sand-100 hover:border-green-300 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center font-bold text-navy-950 border border-sand-200">
                        {(booking.user?.name?.charAt(0) || 'U')}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-navy-950">{booking.user?.name}</p>
                        <p className="text-[10px] text-navy-950/40 font-bold uppercase tracking-widest">{booking.guests} Guests • {booking.status}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setShowBookingsModal(true)} className="h-8 rounded-lg text-[10px] px-3">Details</Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-navy-950/30 italic text-sm font-medium">No arrivals scheduled for today.</div>
              )}
            </div>
          </div>

          {/* Departures Today */}
          <div className="bg-white rounded-[2.5rem] border border-sand-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-sand-100 bg-red-50/30 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-serif font-bold text-navy-950">Today's Departures</h3>
                <p className="text-xs text-red-700 font-bold uppercase tracking-widest mt-1">Checking out Today</p>
              </div>
              <div 
                className="w-12 h-12 rounded-2xl bg-white border border-red-100 flex items-center justify-center text-red-600 shadow-sm cursor-pointer hover:bg-red-50 transition-colors"
                onClick={() => navigate("/dashboard?tab=bookings")}
                title="View All Bookings"
              >
                <ChevronRight className="rotate-180 w-6 h-6" />
              </div>
            </div>
            <div className="p-8 space-y-4">
              {resort?.bookings?.filter((b: any) => {
                const today = new Date().toDateString();
                return new Date(b.checkOut).toDateString() === today && b.status !== 'CANCELLED';
              }).length > 0 ? (
                resort.bookings?.filter((b: any) => {
                  const today = new Date().toDateString();
                  return new Date(b.checkOut).toDateString() === today && b.status !== 'CANCELLED';
                }).map((booking: any) => (
                  <div key={booking.id} className="flex items-center justify-between p-5 rounded-2xl bg-sand-50/50 border border-sand-100 hover:border-red-300 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center font-bold text-navy-950 border border-sand-200">
                        {(booking.user?.name?.charAt(0) || 'U')}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-navy-950">{booking.user?.name}</p>
                        <p className="text-[10px] text-navy-950/40 font-bold uppercase tracking-widest">{booking.guests} Guests • Room {(booking.id || '').slice(-4).toUpperCase()}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleDownloadInvoice(booking)} className="h-8 rounded-lg text-[10px] px-3 border-red-200 text-red-600 hover:bg-red-50">Invoice</Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-navy-950/30 italic text-sm font-medium">No departures scheduled for today.</div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Content Area */}
          <div className={cn("lg:col-span-12 space-y-10")}>
            {(activeTab === "overview" || activeTab === "properties") && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 space-y-10">
                  {/* Room Inventory */}
                  <div className="bg-white rounded-[3rem] border border-sand-100 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-sand-100 flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-serif font-bold text-navy-950">Room Inventory</h2>
                        <p className="text-sm text-navy-950/40 mt-1">Manage your room types, pricing and availability.</p>
                      </div>
                      <Button size="sm" className="rounded-xl px-5" onClick={() => setShowAddRoom(true)}>
                        <Plus className="w-4 h-4 mr-2" /> Add Room Type
                      </Button>
                    </div>

                    <div className="p-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {resort.roomTypes?.map((room: any) => (
                          <div key={room.id} className="p-6 rounded-[2.5rem] border-2 border-sand-50 bg-sand-50/30 hover:border-gold-200 transition-all group">
                            <div className="flex items-start justify-between mb-4">
                              <h4 className="text-xl font-bold text-navy-950">{room.name}</h4>
                              <span className="text-gold-600 font-bold">₹{room.pricePerNight?.toLocaleString()}</span>
                            </div>
                            <p className="text-sm text-navy-950/50 mb-6 line-clamp-2 italic">{room.description}</p>
                            <div className="flex items-center gap-6 text-xs font-bold uppercase tracking-widest text-navy-950/40">
                              <span className="flex items-center gap-2"><Users className="w-4 h-4" /> Max {room.capacity}</span>
                              <span className="flex items-center gap-2"><Building2 className="w-4 h-4" /> {room.availableCount} Available</span>
                            </div>
                            <div className="flex gap-2 mt-4">
                              <Button 
                                variant="outline" size="sm" className="h-8 rounded-lg text-xs px-3 border-sand-200"
                                onClick={() => { 
                                  setEditingRoomId(room.id); 
                                  setRoomFormData({ name: room.name, description: room.description, pricePerNight: (room.pricePerNight || 0).toString(), capacity: (room.capacity || 0).toString(), availableCount: (room.availableCount || 0).toString() }); 
                                  setShowEditRoom(true); 
                                }}
                              >
                                Edit Room
                              </Button>
                              <Button 
                                variant="outline" size="sm" className="h-8 rounded-lg text-xs px-3 border-red-200 text-red-600 hover:bg-red-50"
                                onClick={() => { 
                                  setBlockingFormData(prev => ({...prev, roomId: room.id})); 
                                  setShowBlockRoom(true); 
                                }}
                              >
                                Block Inventory
                              </Button>
                            </div>
                            
                            {/* Room Photos Manager */}
                              <div className="mt-6 pt-6 border-t border-sand-100">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-navy-950/30 mb-3">Room Gallery</p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  {room.photos && [...room.photos].sort((a: any, b: any) => a.sortOrder - b.sortOrder).map((photo: any, i: number) => (
                                    <div key={photo.id} className="relative aspect-[4/3] rounded-xl overflow-hidden group border border-sand-200 bg-sand-50">
                                      <img src={photo.imageUrl} className="w-full h-full object-cover" />
                                      {photo.isCover && (
                                        <div className="absolute top-2 left-2 bg-gold-500 text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                                          <Star className="w-3 h-3" fill="currentColor" /> Cover
                                        </div>
                                      )}
                                      <div className="absolute inset-0 bg-navy-950/80 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 transition-opacity p-2">
                                        <div className="flex items-center gap-2">
                                          <button onClick={() => window.open(photo.imageUrl, '_blank')} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors" title="View Image">
                                            <Eye className="w-4 h-4" />
                                          </button>
                                          <button onClick={() => setRoomCoverPhoto(room.id, photo.id)} className="p-2 bg-white/10 hover:bg-gold-500 rounded-lg text-white transition-colors" title="Set Cover Image">
                                            <Star className="w-4 h-4" />
                                          </button>
                                          <button 
                                            onClick={() => {
                                              luxuryConfirm({
                                                title: "Delete Room Photo",
                                                onConfirm: () => handleDeleteRoomPhoto(room.id, photo.id)
                                              });
                                            }}
                                            className="p-2 bg-red-500/80 hover:bg-red-600 rounded-lg text-white transition-colors" title="Delete Image"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                          <button onClick={() => handleMoveRoomPhoto(room.id, photo.id, 'left')} disabled={i === 0} className="p-1 bg-white/10 hover:bg-white/20 disabled:opacity-30 rounded-lg text-white transition-colors" title="Move Left">
                                            <ChevronLeft className="w-4 h-4" />
                                          </button>
                                          <button onClick={() => handleMoveRoomPhoto(room.id, photo.id, 'right')} disabled={i === room.photos.length - 1} className="p-1 bg-white/10 hover:bg-white/20 disabled:opacity-30 rounded-lg text-white transition-colors" title="Move Right">
                                            <ChevronRight className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                  {(!room.photos || room.photos.length < 20) && (
                                    <label className="aspect-[4/3] rounded-xl border-2 border-dashed border-sand-200 flex flex-col items-center justify-center text-navy-950/40 hover:border-gold-300 hover:text-gold-500 hover:bg-gold-50/50 transition-all cursor-pointer">
                                      <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => handleRoomPhotoUpload(e.target.files?.[0], room.id)} />
                                      <Plus className="w-6 h-6 mb-2" />
                                      <span className="text-xs font-bold uppercase tracking-widest">Add Photo</span>
                                    </label>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Property Gallery */}
                    <div className="bg-white rounded-[3rem] border border-sand-100 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-sand-100 flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold font-serif text-navy-950">Property Gallery</h3>
                        <p className="text-sm text-navy-950/40 mt-1">Manage the high-resolution photos shown to guests.</p>
                      </div>
                      <div className="flex gap-2">
                        <label className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-colors bg-navy-950 text-white hover:bg-navy-900/90 h-10 px-4 cursor-pointer disabled:opacity-50 disabled:pointer-events-none">
                          <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={isUpdatingResortPhotos} onChange={async (e) => {
                              setIsUpdatingResortPhotos(true);
                              await handleResortPhotoUpload(e.target.files?.[0], resort.id);
                              setIsUpdatingResortPhotos(false);
                            }} />
                            {isUpdatingResortPhotos ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Add Photo"}
                          </label>
                      </div>
                    </div>
                    <div className="p-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                      {resort.images?.map((img: string, i: number) => (
                        <div key={i} className="relative aspect-[4/3] rounded-2xl overflow-hidden group">
                          <img src={img} className="w-full h-full object-cover rounded-2xl" />
                          <button 
                            onClick={() => {
                              luxuryConfirm({
                                title: "Delete Property Photo",
                                onConfirm: () => handleDeletePhoto(resort.id, img)
                              });
                            }} 
                            className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-lg text-red-500 shadow-sm transition-all hover:bg-red-500 hover:text-white"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-4 space-y-10">
                  {/* Recent Activity */}
                  <div className="bg-white rounded-[3rem] border border-sand-100 shadow-sm p-8">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xl font-serif font-bold text-navy-950">Recent Stays</h3>
                      <button onClick={() => setShowBookingsModal(true)} className="text-xs font-bold text-gold-600 uppercase tracking-widest hover:text-gold-700">View All</button>
                    </div>
                    <div className="space-y-6">
                      {(resort.bookings?.length > 0 ? resort.bookings : []).slice(0, 4).map((booking: any) => (
                        <div key={booking.id} className="flex items-center gap-4 group cursor-pointer">
                          <div className="w-12 h-12 rounded-2xl bg-sand-50 flex items-center justify-center font-bold text-navy-950 border border-sand-100 group-hover:border-gold-300 transition-all">
                            {(booking.user?.name?.charAt(0) || 'U').toUpperCase()}
                          </div>
                          <div className="flex-grow">
                            <p className="text-sm font-bold text-navy-950">{booking.user?.name}</p>
                            <p className="text-[10px] text-navy-950/40 uppercase tracking-widest">
                              {new Date(booking.checkIn).toLocaleDateString()} • {booking.status}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-sand-300 group-hover:text-gold-500 transition-all" />
                        </div>
                      ))}
                      {(!resort.bookings || resort.bookings.length === 0) && (
                        <div className="text-center py-6 text-navy-950/30 italic text-sm">No bookings yet</div>
                      )}
                    </div>
                  </div>

                  {/* Meal Packages Display */}
                  <div className="bg-navy-950 rounded-[3rem] p-8 text-white">
                    <h3 className="text-xl font-serif font-bold mb-6">Meal Packages</h3>
                    <div className="space-y-4">
                      {(resort.mealPackages || []).map((pkg: any, i: number) => (
                        <div key={i} className="p-4 rounded-2xl border border-white/10 bg-white/5">
                          <div className="flex justify-between items-center mb-1">
                            <p className="font-bold text-gold-400">{pkg.name}</p>
                            <span className="text-gold-400 font-bold">₹{pkg.price}</span>
                          </div>
                          <p className="text-[10px] text-white/40 italic">{pkg.description}</p>
                        </div>
                      ))}
                      {(!resort.mealPackages || resort.mealPackages.length === 0) && (
                        <p className="text-xs text-white/30 italic text-center py-4">No meal packages defined</p>
                      )}
                      <Button variant="outline" className="w-full rounded-xl border-white/20 text-white hover:bg-white hover:text-navy-950 mt-4" onClick={() => {
                        setDiningPackages(resort.mealPackages || []);
                        setShowDiningModal(true);
                      }}>
                        Manage Dining
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "bookings" && (
              <div className="bg-white rounded-[3rem] border border-sand-100 shadow-sm p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-serif font-bold text-navy-950">Manage Bookings</h2>
                </div>
                <div className="space-y-4">
                  {(resort.bookings || []).length > 0 ? (
                    (resort.bookings || []).map((booking: any) => (
                      <div key={booking.id} className="flex items-center justify-between p-6 rounded-[2rem] border border-sand-50 bg-sand-50/30">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center font-bold text-navy-950 border border-sand-200">
                            {(booking.user?.name?.charAt(0) || 'U').toUpperCase()}
                          </div>
                          <div>
                            <p className="text-lg font-bold text-navy-950">{booking.user?.name}</p>
                            <p className="text-xs text-navy-950/40 uppercase tracking-widest">
                              {new Date(booking.checkIn).toLocaleDateString()} — {booking.guests} Guests
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-2">
                          <span className={cn("px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                            booking.status === "CONFIRMED" ? "bg-green-50 text-green-700 border-green-100" :
                            booking.status === "CANCELLED" ? "bg-red-50 text-red-700 border-red-100" :
                            "bg-gold-50 text-gold-700 border-gold-100")}>
                            {booking.status}
                          </span>
                          {booking.status === "PENDING" && (
                            <div className="flex gap-2 mt-2">
                              <Button 
                                size="sm" 
                                variant="success"
                                onClick={() => handleBookingAction(booking.id, 'confirm')} 
                                isLoading={actionLoadingId === booking.id}
                                className=""
                              >
                                Accept
                              </Button>
                              <Button 
                                size="sm" 
                                variant="danger" 
                                onClick={() => handleBookingAction(booking.id, 'reject')} 
                                isLoading={actionLoadingId === booking.id}
                                className=""
                              >
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-20 text-navy-950/30 italic">No bookings yet.</div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "staff" && (
              <div className="space-y-8">
                {/* Staff Management Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                   <div>
                      <h2 className="text-2xl font-serif font-bold text-navy-950">Staff & Operations</h2>
                      <p className="text-sm text-navy-950/40 mt-1">Manage your team and daily resort operations.</p>
                   </div>
                   <div className="flex gap-3">
                      <Button onClick={() => setIsInviteModalOpen(true)} className="rounded-xl px-6 h-12 shadow-gold">
                         <Plus className="w-4 h-4 mr-2" /> Invite Staff
                      </Button>
                   </div>
                </div>

                {/* Invite Modal */}
                {isInviteModalOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/40 backdrop-blur-sm">
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-luxury border border-sand-200"
                    >
                      <h3 className="text-2xl font-serif font-bold text-navy-950 mb-2">Invite Team Member</h3>
                      <p className="text-sm text-navy-950/40 mb-8 italic">Send a secure role-based invitation code.</p>
                      
                      <div className="space-y-6">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-navy-950/40 mb-2">Email Address</label>
                          <input 
                            type="email" 
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder="staff@hampistays.com"
                            className="w-full bg-sand-50 border border-sand-200 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-gold-500 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-navy-950/40 mb-2">Assigned Role</label>
                          <Select 
                            value={inviteRole}
                            onChange={(val) => setInviteRole(val)}
                            options={[
                              { value: "RECEPTIONIST", label: "Receptionist" },
                              { value: "MANAGER", label: "Manager" },
                              { value: "HOUSEKEEPING", label: "Housekeeping" }
                            ]}
                          />
                        </div>
                        <div className="flex gap-4 pt-4">
                          <Button variant="outline" onClick={() => setIsInviteModalOpen(false)} className="flex-1 h-14 rounded-2xl">Cancel</Button>
                          <Button onClick={handleSendInvite} className="flex-1 h-14 rounded-2xl shadow-gold">Send Invitation</Button>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                   {/* Staff List */}
                   <div className="lg:col-span-7 space-y-6">
                      <div className="bg-white rounded-[2.5rem] border border-sand-100 shadow-sm overflow-hidden">
                         <div className="p-8 border-b border-sand-100">
                            <h3 className="text-lg font-bold text-navy-950">Active Team</h3>
                         </div>
                         <div className="divide-y divide-sand-50">
                            {[
                               { name: 'Sanjay Kumar', role: 'General Manager', email: 'sanjay@hampi.com', status: 'Active' },
                               { name: 'Priya Das', role: 'Receptionist', email: 'priya@hampi.com', status: 'On Shift' }
                            ].map((member, i) => (
                               <div key={i} className="p-6 flex items-center justify-between hover:bg-sand-50 transition-colors">
                                  <div className="flex items-center gap-4">
                                     <div className="w-12 h-12 rounded-2xl bg-sand-100 flex items-center justify-center font-bold text-navy-950">
                                        {member.name[0]}
                                     </div>
                                     <div>
                                        <p className="text-sm font-bold text-navy-950">{member.name}</p>
                                        <p className="text-[10px] text-navy-950/40 font-bold uppercase tracking-widest">{member.role}</p>
                                     </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                     <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-[10px] font-bold uppercase tracking-widest">
                                        {member.status}
                                     </span>
                                     <div className="relative group">
                                       <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg opacity-50 cursor-not-allowed" disabled>
                                          <Trash2 className="w-4 h-4 text-red-500" />
                                       </Button>
                                       <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-navy-950 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                         Coming Soon
                                       </div>
                                     </div>
                                  </div>
                               </div>
                            ))}
                         </div>
                      </div>

                      {/* Pending Invitations */}
                      {pendingInvitations.length > 0 && (
                        <div className="bg-white rounded-[2.5rem] border border-sand-100 shadow-sm overflow-hidden mt-8">
                           <div className="p-8 border-b border-sand-100 flex items-center justify-between bg-sand-50/30">
                              <h3 className="text-sm font-bold text-navy-950 uppercase tracking-widest">Pending Invitations</h3>
                              <span className="w-6 h-6 bg-gold-100 text-gold-700 rounded-full flex items-center justify-center text-[10px] font-bold">{pendingInvitations.length}</span>
                           </div>
                           <div className="divide-y divide-sand-50">
                              {pendingInvitations.map((invite: any, i: number) => (
                                 <div key={i} className="p-6 flex items-center justify-between">
                                    <div>
                                       <p className="text-sm font-bold text-navy-950">{invite.email}</p>
                                       <div className="flex items-center gap-2 mt-1">
                                          <span className="text-[10px] text-navy-950/40 font-bold uppercase tracking-widest">{invite.role}</span>
                                          <span className="text-[10px] text-gold-600 font-mono font-bold tracking-widest">[{invite.code}]</span>
                                       </div>
                                    </div>
                                    <span className="px-3 py-1 bg-sand-100 text-navy-950/40 rounded-full text-[9px] font-bold uppercase tracking-widest animate-pulse">
                                       Waiting...
                                    </span>
                                 </div>
                              ))}
                           </div>
                        </div>
                      )}
                   </div>

                   {/* Housekeeping Board */}
                   <div className="lg:col-span-5 space-y-6">
                      <div className="bg-navy-950 rounded-[2.5rem] p-8 text-white">
                         <div className="flex items-center justify-between mb-8">
                            <h3 className="text-lg font-bold text-gold-400">Housekeeping</h3>
                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Live Status</span>
                         </div>
                         <div className="space-y-4">
                            {housekeeping.map((task) => (
                               <div key={task.id} 
                                 onClick={() => handleHousekeepingStatus(task.id)}
                                 className="p-5 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-between group hover:bg-white/10 transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
                               >
                                  <div className="flex-grow">
                                     <div className="flex items-center gap-2 mb-1">
                                        <p className="text-sm font-bold">Room {task.room}</p>
                                        <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">• {task.lastCleaned}</span>
                                     </div>
                                     <div className="flex items-center gap-4">
                                        <p className="text-[9px] text-white/40 uppercase tracking-widest">{task.type}</p>
                                        <div className="flex items-center gap-1.5">
                                           <div className="w-3 h-3 bg-white/10 rounded-full flex items-center justify-center">
                                              <User className="w-2 h-2 text-gold-400" />
                                           </div>
                                           <span className="text-[8px] font-bold text-white/30 uppercase">{task.staff}</span>
                                        </div>
                                     </div>
                                  </div>
                                  <div className="flex flex-col items-end gap-2">
                                     <div className={cn("px-4 py-1.5 rounded-xl flex items-center gap-2 border", 
                                        task.status === 'DIRTY' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                        task.status === 'CLEANING' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                                        'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                     )}>
                                        <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", task.color)} />
                                        <span className="text-[9px] font-bold uppercase tracking-widest">{task.status}</span>
                                     </div>
                                     <p className="text-[7px] font-bold text-white/20 uppercase">Click to Update</p>
                                  </div>
                               </div>
                            ))}
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            )}

            {activeTab === "analytics" && (
              <div className="space-y-8 lg:col-span-12">
                {/* Top Row: Main Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Revenue Growth Chart */}
                  <div className="lg:col-span-8 bg-white rounded-[3rem] border border-sand-100 shadow-sm p-10 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-10">
                      <div>
                        <h3 className="text-2xl font-serif font-bold text-navy-950">Financial Overview</h3>
                        <p className="text-xs text-navy-950/40 font-bold uppercase tracking-widest mt-1">Monthly Revenue Streams</p>
                      </div>
                      <div className="flex gap-2">
                        <span className="px-4 py-2 bg-sand-50 rounded-xl text-[10px] font-bold text-navy-950/60 uppercase tracking-widest">Last 6 Months</span>
                      </div>
                    </div>
                    
                    {/* Custom CSS Chart Simulation */}
                    <div className="h-64 flex items-end gap-4 relative">
                       {/* Grid Lines */}
                       <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-5">
                          {[...Array(5)].map((_, i) => <div key={i} className="border-t border-navy-950 w-full" />)}
                       </div>
                       
                       {[
                         { month: 'Jan', val: 45, amt: '1.2L' },
                         { month: 'Feb', val: 65, amt: '1.8L' },
                         { month: 'Mar', val: 55, amt: '1.5L' },
                         { month: 'Apr', val: 85, amt: '2.4L' },
                         { month: 'May', val: 95, amt: '2.8L' },
                         { month: 'Jun', val: 100, amt: '3.1L' }
                       ].map((data, i) => (
                         <div key={data.month} className="flex-grow flex flex-col items-center group relative h-full justify-end">
                            <motion.div 
                              initial={{ height: 0 }}
                              animate={{ height: `${data.val}%` }}
                              transition={{ delay: i * 0.1, duration: 1 }}
                              className="w-full bg-gradient-to-t from-gold-600/20 to-gold-500 rounded-t-2xl relative group-hover:from-navy-950 group-hover:to-navy-800 transition-all duration-500 shadow-sm"
                            >
                               <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-navy-950 text-white text-[10px] font-bold py-1 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                                  ₹{data.amt}
                               </div>
                            </motion.div>
                            <p className="mt-4 text-[10px] font-bold text-navy-950/40 uppercase tracking-widest">{data.month}</p>
                         </div>
                       ))}
                    </div>
                  </div>

                  {/* Occupancy Circular Progress */}
                  <div className="lg:col-span-4 bg-navy-950 rounded-[3rem] p-10 text-white flex flex-col items-center justify-center text-center relative overflow-hidden shadow-2xl">
                     <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
                     <h3 className="text-xl font-bold mb-8 relative z-10 font-serif italic">Live Occupancy</h3>
                     <div className="relative w-48 h-48 flex items-center justify-center mb-8">
                        <svg className="w-full h-full -rotate-90">
                           <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-white/10" />
                           <motion.circle 
                              cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" 
                              strokeDasharray={552.92}
                              initial={{ strokeDashoffset: 552.92 }}
                              animate={{ strokeDashoffset: 552.92 * (1 - 0.78) }}
                              transition={{ duration: 2, ease: "easeOut" }}
                              className="text-gold-500" 
                              strokeLinecap="round"
                           />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                           <span className="text-4xl font-serif font-bold italic text-gold-500">78%</span>
                           <span className="text-[8px] font-bold uppercase tracking-[0.2em] opacity-40 mt-1">Full House</span>
                        </div>
                     </div>
                     <p className="text-xs text-white/60 max-w-[180px] leading-relaxed relative z-10 font-medium">
                        Higher than last month's average of 64%
                     </p>
                  </div>
                </div>

                {/* Bottom Row: Distribution & Insights */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                   <div className="bg-white rounded-[2.5rem] p-8 border border-sand-100 shadow-sm">
                      <h4 className="text-sm font-bold text-navy-950 mb-6 uppercase tracking-widest flex items-center gap-2">
                        <Star className="w-4 h-4 text-gold-500" /> Room Performance
                      </h4>
                      <div className="space-y-6">
                         {[
                           { name: 'Heritage Suite', val: 85, color: 'bg-gold-500' },
                           { name: 'Riverside Cottage', val: 62, color: 'bg-navy-950' },
                           { name: 'Garden Villa', val: 45, color: 'bg-sand-300' }
                         ].map(room => (
                           <div key={room.name}>
                             <div className="flex justify-between text-[10px] font-bold mb-2 uppercase tracking-wide">
                                <span>{room.name}</span>
                                <span>{room.val}%</span>
                             </div>
                             <div className="h-1.5 bg-sand-50 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${room.val}%` }}
                                  className={cn("h-full rounded-full", room.color)}
                                />
                             </div>
                           </div>
                         ))}
                      </div>
                   </div>

                   <div className="bg-white rounded-[2.5rem] p-8 border border-sand-100 shadow-sm flex flex-col justify-between">
                      <h4 className="text-sm font-bold text-navy-950 mb-4 uppercase tracking-widest">Booking Source</h4>
                      <div className="flex-grow flex items-center justify-center">
                         <div className="flex gap-4">
                            <div className="text-center">
                               <div className="w-16 h-16 rounded-2xl bg-sand-50 flex items-center justify-center mb-2 border border-sand-100 shadow-sm">
                                  <span className="text-lg font-bold">42%</span>
                               </div>
                               <p className="text-[8px] font-bold opacity-40 uppercase">Direct</p>
                            </div>
                            <div className="text-center">
                               <div className="w-16 h-16 rounded-2xl bg-gold-500/10 flex items-center justify-center mb-2 border border-gold-500/20 shadow-sm">
                                  <span className="text-lg font-bold text-gold-700">38%</span>
                               </div>
                               <p className="text-[8px] font-bold opacity-40 uppercase">HampiStays</p>
                            </div>
                            <div className="text-center">
                               <div className="w-16 h-16 rounded-2xl bg-navy-950 flex items-center justify-center mb-2 shadow-lg">
                                  <span className="text-lg font-bold text-white">20%</span>
                               </div>
                               <p className="text-[8px] font-bold opacity-40 uppercase">Other</p>
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="bg-gradient-to-br from-gold-500 to-gold-600 rounded-[2.5rem] p-8 text-navy-950 flex flex-col justify-between shadow-xl shadow-gold-500/20 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                           <TrendingUp className="w-4 h-4" />
                           <p className="text-[10px] font-bold uppercase tracking-widest">Smart Insight</p>
                        </div>
                        <h4 className="text-xl font-serif font-bold italic leading-tight mb-4">
                           Bookings are 24% higher for weekends.
                        </h4>
                      </div>
                      <p className="text-sm font-medium opacity-90 leading-relaxed">
                         Consider increasing your weekend "Riverside Cottage" rates by 10% to maximize revenue.
                      </p>
                      <Button variant="outline" className="bg-white/20 border-white/40 text-navy-950 rounded-xl mt-6 font-bold hover:bg-white/40 transition-all shadow-sm">
                         Apply Auto-Pricing
                      </Button>
                   </div>
                </div>
              </div>
            )}

            {activeTab === "inbox" && (
              <div className="bg-white rounded-[3.5rem] border border-sand-200 shadow-xl overflow-hidden flex h-[700px]">
                {/* Sidebar */}
                <div className="w-1/3 border-r border-sand-100 flex flex-col bg-sand-50/30">
                  <div className="p-8 border-b border-sand-100">
                    <h3 className="text-2xl font-serif font-bold text-navy-950 mb-1">Guest Inbox</h3>
                    <p className="text-[10px] text-navy-950/40 uppercase tracking-widest font-bold">Active Conversations</p>
                  </div>
                  <div className="flex-grow overflow-y-auto p-4 space-y-3">
                    {(resort.bookings || []).filter((b: any) => b.status === "CONFIRMED" || b.status === "CHECKED_IN").map((booking: any) => (
                      <button 
                        key={booking.id}
                        onClick={() => setActiveMessageBooking(booking)}
                        className={cn("w-full text-left p-5 rounded-[2rem] border transition-all duration-300", 
                          activeMessageBooking?.id === booking.id 
                            ? "bg-navy-950 border-navy-950 shadow-lg shadow-navy-950/20" 
                            : "bg-white border-sand-100 hover:border-gold-300 hover:shadow-md")}
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shadow-sm", 
                            activeMessageBooking?.id === booking.id ? "bg-gold-500 text-navy-950" : "bg-sand-100 text-navy-950")}>
                            {(booking.user?.name?.[0] || 'U')}
                          </div>
                          <div className="overflow-hidden">
                            <p className={cn("text-sm font-bold truncate", activeMessageBooking?.id === booking.id ? "text-white" : "text-navy-950")}>
                              {booking.user?.name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={cn("text-[9px] font-bold uppercase tracking-widest", activeMessageBooking?.id === booking.id ? "text-gold-400" : "text-navy-950/40")}>
                                {booking.referenceNumber}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                    {(resort.bookings || []).filter((b: any) => b.status === "CONFIRMED" || b.status === "CHECKED_IN").length === 0 && (
                      <div className="text-center py-20 px-8">
                        <div className="w-16 h-16 bg-sand-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Mail className="w-8 h-8 text-sand-300" />
                        </div>
                        <p className="text-sm text-navy-950/30 italic font-medium">No active stays to message.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Chat Area */}
                <div className="flex-grow flex flex-col bg-white relative">
                  {activeMessageBooking ? (
                    <>
                      <div className="p-8 border-b border-sand-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
                        <div className="flex items-center gap-4">
                           <div className="w-14 h-14 rounded-2xl bg-navy-950 text-gold-500 flex items-center justify-center font-bold text-xl shadow-inner">
                             {(activeMessageBooking.user?.name?.[0] || 'U')}
                           </div>
                           <div>
                             <p className="text-lg font-bold text-navy-950">{activeMessageBooking.user?.name}</p>
                             <div className="flex items-center gap-2">
                               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                               <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Active Now</p>
                             </div>
                           </div>
                        </div>
                        <div className="flex gap-3">
                          <Button variant="outline" className="h-10 w-10 p-0 rounded-xl border-sand-200">
                             <TrendingUp className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex-grow p-8 overflow-y-auto space-y-8 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
                        {messages.filter(m => m.bookingId === activeMessageBooking.id).map((msg, i) => (
                          <motion.div 
                            key={msg.id} 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className={cn("flex flex-col", msg.senderId === user?.id ? "items-end" : "items-start")}
                          >
                            <div className={cn("max-w-[80%] p-6 rounded-[2rem] shadow-xl relative group transition-all duration-300", 
                              msg.senderId === user?.id 
                                ? "bg-gradient-to-br from-navy-950 to-navy-800 text-white rounded-tr-none border border-white/10" 
                                : "bg-white border border-sand-200 text-navy-950 rounded-tl-none")}>
                              
                              {msg.senderId === user?.id && (
                                <div className="absolute top-0 right-0 w-8 h-8 bg-gold-500/10 rounded-full blur-xl -mr-4 -mt-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                              )}
                              
                              <p className={cn("text-sm leading-relaxed font-medium", msg.senderId === user?.id ? "!text-white" : "!text-navy-950")}>{msg.text}</p>
                              
                              <div className={cn("flex items-center gap-2 mt-3", msg.senderId === user?.id ? "justify-end" : "justify-start")}>
                                <span className={cn("text-[8px] font-bold uppercase tracking-widest", msg.senderId === user?.id ? "text-gold-400/80" : "text-navy-950/40")}>
                                  {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {msg.senderId === user?.id && <CheckCircle className="w-3 h-3 text-gold-500" />}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      <form onSubmit={handleSendMessage} className="p-8 border-t border-sand-100 bg-white">
                        <div className="flex gap-4 items-center bg-sand-50 p-2 rounded-[2.5rem] border border-sand-200 focus-within:border-gold-500 transition-all shadow-inner">
                          <input 
                            type="text" 
                            value={newMessage}
                            onChange={e => setNewMessage(e.target.value)}
                            placeholder={`Message ${activeMessageBooking.user?.name}...`}
                            className="flex-grow bg-transparent px-6 py-3 outline-none text-navy-950 font-medium placeholder:text-navy-950/30"
                          />
                          <Button type="submit" className="rounded-full w-14 h-14 p-0 shadow-gold group">
                            <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
                          </Button>
                        </div>
                      </form>
                    </>
                  ) : (
                    <div className="flex-grow flex flex-col items-center justify-center p-20 text-center">
                      <div className="w-24 h-24 bg-sand-50 rounded-[2.5rem] flex items-center justify-center mb-8 rotate-12 shadow-sm border border-sand-100">
                        <Mail className="w-10 h-10 text-gold-500 -rotate-12" />
                      </div>
                      <h3 className="text-2xl font-serif font-bold text-navy-950 mb-2">Private Guest Channel</h3>
                      <p className="text-navy-950/40 max-w-xs mx-auto text-sm leading-relaxed">
                        Select an active booking to begin your direct communication with the guest.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "finance" && (
              <div className="bg-white rounded-[3rem] border border-sand-100 shadow-sm p-12 space-y-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-serif font-bold text-navy-950">Finance & Payouts</h2>
                    <p className="text-sm text-navy-950/40 mt-1">Track your earnings, platform commissions, and payout schedules.</p>
                  </div>
                  <Button className="rounded-xl px-6">Download CSV</Button>
                </div>
                
                {/* Payout Tracking Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {['Pending', 'Processing', 'Paid', 'Failed'].map((status) => (
                    <div key={status} className="p-6 rounded-3xl border border-sand-100 bg-sand-50/50">
                      <p className="text-[10px] font-bold text-navy-950/40 uppercase tracking-widest mb-2">{status} Payouts</p>
                      <p className="text-2xl font-bold text-navy-950">
                        ₹{resort.bookings?.filter((b: any) => b.payoutStatus === status.toUpperCase()).reduce((acc: number, b: any) => acc + ((b.totalPrice || 0) * 0.93), 0).toLocaleString() || 0}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Ledger Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-sand-100 text-[10px] font-bold text-navy-950/40 uppercase tracking-widest">
                        <th className="py-4 font-bold">Booking Ref</th>
                        <th className="py-4 font-bold">Guest</th>
                        <th className="py-4 font-bold">Total Amount</th>
                        <th className="py-4 font-bold">Commission (7%)</th>
                        <th className="py-4 font-bold">Net Earnings</th>
                        <th className="py-4 font-bold">Payment Status</th>
                        <th className="py-4 font-bold">Payout Status</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {resort.bookings?.map((b: any) => (
                        <tr key={b.id} className="border-b border-sand-50/50 hover:bg-sand-50/30">
                          <td className="py-4 font-medium text-navy-950">{b.referenceNumber}</td>
                          <td className="py-4 text-navy-950/70">{b.user?.name}</td>
                          <td className="py-4 font-bold text-navy-950">₹{(b.totalPrice || 0).toLocaleString()}</td>
                          <td className="py-4 text-red-600 font-medium">-₹{((b.totalPrice || 0) * 0.07).toLocaleString()}</td>
                          <td className="py-4 text-green-600 font-bold">₹{((b.totalPrice || 0) * 0.93).toLocaleString()}</td>
                          <td className="py-4">
                            <span className={cn("px-2 py-1 rounded text-[10px] font-bold", b.paymentStatus === 'PAID' ? "bg-green-100 text-green-700" : "bg-sand-100 text-navy-950")}>{b.paymentStatus || 'PENDING'}</span>
                          </td>
                          <td className="py-4">
                            <span className={cn("px-2 py-1 rounded text-[10px] font-bold", b.payoutStatus === 'PAID' ? "bg-green-100 text-green-700" : "bg-gold-100 text-gold-700")}>{b.payoutStatus || 'PENDING'}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "bookings" && (
              <div className="bg-white rounded-[3rem] border border-sand-100 shadow-sm p-12 space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-serif font-bold text-navy-950">Bookings Management</h2>
                    <p className="text-sm text-navy-950/40 mt-1">View, search, and manage all resort reservations.</p>
                  </div>
                  <div className="flex gap-3">
                    <Input label="" placeholder="Search guests..." className="w-64" />
                    <Button variant="outline" className="rounded-xl px-6">Filter</Button>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-sand-100 text-[10px] font-bold text-navy-950/40 uppercase tracking-widest">
                        <th className="py-4 font-bold">Booking Ref</th>
                        <th className="py-4 font-bold">Guest</th>
                        <th className="py-4 font-bold">Check-In</th>
                        <th className="py-4 font-bold">Check-Out</th>
                        <th className="py-4 font-bold">Amount</th>
                        <th className="py-4 font-bold">Status</th>
                        <th className="py-4 font-bold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {resort.bookings?.map((b: any) => (
                        <tr key={b.id} className="border-b border-sand-50/50 hover:bg-sand-50/30">
                          <td className="py-4 font-bold text-navy-950">{b.referenceNumber}</td>
                          <td className="py-4 text-navy-950">{b.user?.name}</td>
                          <td className="py-4 text-navy-950/70">{new Date(b.checkIn).toLocaleDateString()}</td>
                          <td className="py-4 text-navy-950/70">{new Date(b.checkOut).toLocaleDateString()}</td>
                          <td className="py-4 font-bold text-navy-950">₹{(b.totalPrice || 0).toLocaleString()}</td>
                          <td className="py-4">
                            <span className={cn("px-2 py-1 rounded text-[10px] font-bold", b.status === 'CONFIRMED' ? "bg-green-100 text-green-700" : "bg-sand-100 text-navy-950")}>{b.status}</span>
                          </td>
                          <td className="py-4">
                             <button className="text-gold-600 hover:text-gold-700 font-bold text-xs uppercase tracking-widest" onClick={() => {
                               setShowBookingsModal(true);
                             }}>View</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination */}
                <div className="flex items-center justify-between pt-4 border-t border-sand-100">
                  <p className="text-xs text-navy-950/40 font-bold uppercase tracking-widest">Showing 1 to {resort.bookings?.length || 0} of {resort.bookings?.length || 0} entries</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="rounded-lg h-8 px-3" disabled>Previous</Button>
                    <Button variant="outline" size="sm" className="rounded-lg h-8 px-3 bg-navy-950 text-white border-navy-950">1</Button>
                    <Button variant="outline" size="sm" className="rounded-lg h-8 px-3" disabled>Next</Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="bg-white rounded-[3rem] border border-sand-100 shadow-sm p-12 space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-serif font-bold text-navy-950">Guest Reviews</h2>
                    <p className="text-sm text-navy-950/40 mt-1">Read and respond to feedback from your past guests.</p>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-gold-50 rounded-xl text-gold-700 font-bold">
                    <Star className="w-5 h-5 fill-current" /> {resort.rating || "N/A"} / 5
                  </div>
                </div>
                
                <div className="space-y-6">
                  {resort.reviews?.length > 0 ? resort.reviews.map((review: any) => (
                    <div key={review.id} className="p-6 rounded-2xl border border-sand-100 bg-sand-50/30 flex gap-6">
                      <div className="w-12 h-12 bg-white border border-sand-200 rounded-full flex items-center justify-center font-bold text-navy-950 shrink-0">
                         {review.user?.name?.[0] || "G"}
                      </div>
                      <div className="flex-grow">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-bold text-navy-950">{review.user?.name || "Guest"}</p>
                          <span className="text-xs text-navy-950/40 font-bold uppercase tracking-widest">{new Date(review.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex gap-1 text-gold-500 mb-3">
                          {[...Array(5)].map((_, i) => <Star key={i} className={cn("w-4 h-4", i < review.rating ? "fill-current" : "text-sand-200")} />)}
                        </div>
                        <p className="text-sm text-navy-950/70 italic mb-4">{review.comment}</p>
                        <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs px-4">Reply to Review</Button>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-16 text-navy-950/30 italic">No reviews received yet.</div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="bg-white rounded-[3rem] border border-sand-100 shadow-sm p-12">
                <h2 className="text-2xl font-serif font-bold text-navy-950 mb-8">Property Management</h2>
                <div className="space-y-10">
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-navy-950 border-b border-sand-100 pb-2">Basic Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input label="Resort Name" value={resort.name} readOnly />
                      <Input label="Category" value={resort.category || resort.type} readOnly className="capitalize" />
                      <Input label="Location Area" value={resort.locationArea} readOnly />
                      <Input label="GST Number" placeholder="Not set" />
                      <Input label="Contact Email" value={user?.email} readOnly />
                      <Input label="Contact Phone" placeholder="Not set" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-navy-950 uppercase tracking-widest">Description</label>
                      <textarea className="w-full bg-sand-50/50 border border-sand-200 rounded-2xl p-4 h-32 focus:outline-none focus:border-gold-500 transition-colors resize-none text-navy-950" value={resort.description || ""} readOnly />
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-navy-950 border-b border-sand-100 pb-2">Operations & Policies</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input label="Check-In Time" placeholder="e.g. 14:00" defaultValue="14:00" />
                      <Input label="Check-Out Time" placeholder="e.g. 11:00" defaultValue="11:00" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-navy-950 uppercase tracking-widest">House Rules</label>
                      <textarea className="w-full bg-sand-50/50 border border-sand-200 rounded-2xl p-4 h-24 focus:outline-none focus:border-gold-500 transition-colors resize-none text-navy-950" placeholder="e.g. No smoking, no pets allowed." defaultValue="No smoking indoors. Valid ID required." />
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-sand-100 flex justify-end">
                    <Button className="rounded-2xl px-10 shadow-gold">Save Property Changes</Button>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === "kyc" && (
              <KycUploadSection userType="resort" profileId={resort.id} />
            )}
            
            {activeTab === "qr-scanner" && (
              <div className="bg-white rounded-[3rem] border border-sand-100 shadow-sm p-12">
                <QRScannerModule />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Room Type Modal */}
      <AnimatePresence>
        {showAddRoom && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-navy-950/40 backdrop-blur-sm" onClick={() => setShowAddRoom(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-[3rem] p-8 md:p-12 max-w-2xl w-full shadow-luxury">
              <h2 className="text-3xl font-serif font-bold text-navy-950 mb-8">Add New Room Type</h2>
              <form onSubmit={handleAddRoom} className="space-y-6">
                <Input label="Room Type Name" placeholder="e.g. Royal Heritage Suite" value={roomFormData.name} onChange={e => setRoomFormData(p => ({...p, name: e.target.value}))} />
                <div className="space-y-2">
                  <label className="text-xs font-bold text-navy-800/40 uppercase tracking-widest ml-1">Room Description</label>
                  <textarea rows={3} className="w-full bg-sand-50 border border-sand-200 rounded-2xl p-4 focus:ring-2 focus:ring-gold-500/20 outline-none resize-none"
                    placeholder="Describe the amenities, view, and layout..." value={roomFormData.description} onChange={e => setRoomFormData(p => ({...p, description: e.target.value}))} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Input label="Price / Night (₹)" type="number" value={roomFormData.pricePerNight} onChange={e => setRoomFormData(p => ({...p, pricePerNight: e.target.value}))} />
                  <Input label="Max Guests" type="number" value={roomFormData.capacity} onChange={e => setRoomFormData(p => ({...p, capacity: e.target.value}))} />
                  <Input label="Total Rooms" type="number" value={roomFormData.availableCount} onChange={e => setRoomFormData(p => ({...p, availableCount: e.target.value}))} />
                </div>
                <div className="flex gap-4 pt-4">
                  <Button type="button" variant="outline" className="flex-1 rounded-2xl py-6" onClick={() => setShowAddRoom(false)}>Cancel</Button>
                  <Button type="submit" className="flex-1 rounded-2xl py-6 shadow-gold" isLoading={isAddingRoom}>Create Room Type</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* All Bookings Modal */}
      <AnimatePresence>
        {showBookingsModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-navy-950/40 backdrop-blur-sm" onClick={() => setShowBookingsModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-[3rem] p-8 md:p-12 max-w-4xl w-full shadow-luxury max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between mb-8 shrink-0">
                <div>
                  <h2 className="text-3xl font-serif font-bold text-navy-950">Guest Command Center</h2>
                  <p className="text-sm text-navy-950/40 mt-1">Manage all reservations and guest special requests.</p>
                </div>
                <button onClick={() => setShowBookingsModal(false)} className="w-12 h-12 bg-sand-50 rounded-full flex items-center justify-center text-navy-950/40 hover:bg-gold-50 hover:text-gold-600 transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="overflow-y-auto pr-2 space-y-6 flex-grow scrollbar-hide">
                {(resort.bookings || []).length > 0 ? (
                  (resort.bookings || []).map((booking: any) => (
                    <div key={booking.id} className="p-8 rounded-[2.5rem] border border-sand-100 bg-white hover:border-gold-300 hover:shadow-xl transition-all group">
                      <div className="flex flex-col md:flex-row gap-8">
                        {/* Guest Profile Info */}
                        <div className="w-full md:w-1/3 space-y-4">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-[1.5rem] bg-navy-950 flex items-center justify-center text-xl font-bold text-white shadow-lg">
                              {(booking.user?.name?.charAt(0) || 'U').toUpperCase()}
                            </div>
                            <div>
                              <p className="text-lg font-bold text-navy-950">{booking.user?.name}</p>
                              <p className="text-[10px] font-bold text-gold-600 uppercase tracking-widest">{booking.referenceNumber}</p>
                            </div>
                          </div>
                          <div className="p-4 rounded-2xl bg-sand-50/50 border border-sand-100 space-y-3">
                            <p className="text-[10px] font-bold text-navy-950/40 uppercase tracking-widest">Digital Check-In</p>
                            <div className="bg-white p-3 rounded-xl border border-sand-200 flex items-center justify-center">
                               {/* QR Code Simulation */}
                               <div className="w-24 h-24 bg-navy-950 p-2 rounded-lg relative group">
                                  <div className="w-full h-full border-2 border-white/20 border-dashed rounded-md flex items-center justify-center">
                                    <div className="grid grid-cols-2 gap-1 w-12 h-12 opacity-40">
                                      <div className="bg-white rounded-sm" /><div className="bg-white rounded-sm" />
                                      <div className="bg-white rounded-sm" /><div className="bg-white rounded-sm" />
                                    </div>
                                  </div>
                                  <div className="absolute inset-0 flex items-center justify-center bg-gold-600/90 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg cursor-pointer">
                                    <span className="text-[8px] font-bold text-white uppercase text-center leading-tight px-2">Click to Print QR Card</span>
                                  </div>
                               </div>
                            </div>
                            <p className="text-[8px] text-center text-navy-950/40 uppercase font-bold">Ref: {booking.referenceNumber}</p>
                          </div>
                          <div className="flex gap-2">
                             <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1 rounded-xl text-[10px] h-10 border-sand-200"
                              onClick={() => {
                                setShowBookingsModal(false);
                                navigate("/dashboard?tab=inbox");
                                setActiveMessageBooking(booking);
                              }}
                            >
                              Message
                            </Button>
                              <Button variant="outline" size="sm" className="flex-1 rounded-xl text-[10px] h-10 border-sand-200">History</Button>
                              <Button variant="outline" size="sm" className="flex-1 rounded-xl text-[10px] h-10 border-sand-200 text-gold-600 hover:bg-gold-50" onClick={() => {
                                setEditingBooking(booking);
                                setBookingFormData({
                                  checkIn: (booking.checkIn || "").split('T')[0],
                                  checkOut: (booking.checkOut || "").split('T')[0],
                                  guests: (booking.guests || 0).toString(),
                                  roomId: booking.roomId || '',
                                  totalPrice: (booking.totalPrice || 0).toString()
                                });
                                setShowBookingsModal(false);
                                setShowEditBooking(true);
                              }}>Edit Booking</Button>
                          </div>
                        </div>

                        {/* Booking & Requests Details */}
                        <div className="flex-grow space-y-6">
                          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold text-navy-950/40 uppercase tracking-widest">Check-In</p>
                              <p className="text-sm font-bold text-navy-950">{new Date(booking.checkIn).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold text-navy-950/40 uppercase tracking-widest">Check-Out</p>
                              <p className="text-sm font-bold text-navy-950">{new Date(booking.checkOut).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold text-navy-950/40 uppercase tracking-widest">Guests</p>
                              <p className="text-sm font-bold text-navy-950">{booking.guests} People</p>
                            </div>
                          </div>

                          {/* Special Requests Section */}
                          {(() => {
                            const text = booking.specialRequests;
                            if (!text) {
                              return (
                                <div className="p-6 rounded-3xl bg-gold-50/50 border border-gold-100 relative overflow-hidden">
                                  <p className="text-[10px] font-bold text-gold-700 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <AlertCircle className="w-3.5 h-3.5" /> Guest Special Requests
                                  </p>
                                  <p className="text-sm text-navy-950/40 font-medium italic">
                                    No special requests mentioned by the guest for this stay.
                                  </p>
                                </div>
                              );
                            }

                            const mealMatch = text.match(/^\[Selected Meals:\s*([^\]]+)\]/);
                            let meals: string[] = [];
                            let remainingText = text;
                            if (mealMatch) {
                              meals = mealMatch[1].split(";").map(m => m.trim());
                              remainingText = text.replace(mealMatch[0], "").trim();
                            }
                            const requests = remainingText.split(";").map(r => r.trim()).filter(Boolean);

                            return (
                              <div className="p-6 rounded-3xl bg-gold-50/50 border border-gold-100 relative overflow-hidden space-y-4">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-gold-500/5 rounded-full blur-xl -mr-8 -mt-8" />
                                {meals.length > 0 && (
                                  <div>
                                    <p className="text-[10px] font-bold text-gold-700 uppercase tracking-widest mb-2">Curated Meal Packages</p>
                                    <div className="flex flex-wrap gap-2">
                                      {meals.map((meal, index) => (
                                        <span key={index} className="px-3 py-1.5 bg-white border border-gold-200 text-xs font-semibold text-navy-950 rounded-xl flex items-center gap-1.5 shadow-sm">
                                          <span className="w-1.5 h-1.5 rounded-full bg-gold-500" />
                                          {meal}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {(requests.length > 0 || meals.length === 0) && (
                                  <div>
                                    <p className="text-[10px] font-bold text-gold-700 uppercase tracking-widest mb-2 flex items-center gap-2">
                                      <AlertCircle className="w-3.5 h-3.5" /> Guest Special Requests & Notes
                                    </p>
                                    <p className="text-sm text-navy-950/70 font-medium italic">
                                      {requests.join("; ") || "No additional requests."}
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          })()}

                           <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pt-6 border-t border-sand-100">
                              <div>
                                <p className="text-[10px] font-bold text-navy-950/40 uppercase tracking-widest mb-1">Status & Payment</p>
                                <div className="flex items-center gap-3">
                                  <span className={cn("px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                                    booking.status === "CONFIRMED" ? "bg-green-50 text-green-700 border-green-100" :
                                    booking.status === "CANCELLED" ? "bg-red-50 text-red-700 border-red-100" :
                                    "bg-gold-50 text-gold-700 border-gold-100")}>
                                    {booking.status}
                                  </span>
                                  <p className="text-lg font-serif font-bold text-navy-950">₹{booking.totalPrice?.toLocaleString("en-IN")}</p>
                                </div>
                              </div>
                              
                              <div className="flex flex-wrap items-center gap-3">
                                 {booking.status === "PENDING" && (
                                   <div className="flex flex-wrap gap-3">
                                     <Button size="sm" variant="danger" onClick={() => handleBookingAction(booking.id, 'reject')} isLoading={actionLoadingId === booking.id} className="rounded-xl px-6">Decline</Button>
                                     <Button size="sm" variant="success" onClick={() => handleBookingAction(booking.id, 'confirm')} isLoading={actionLoadingId === booking.id} className="rounded-xl px-8 shadow-lg">Accept Request</Button>
                                   </div>
                                 )}
                                 {booking.status === "CONFIRMED" && (
                                   <div className="flex flex-wrap items-center gap-3">
                                     <Button variant="outline" size="sm" onClick={() => handleDownloadInvoice(booking)} className="rounded-xl border-sand-200 text-xs px-4">Generate Invoice</Button>
                                     <Button variant="outline" size="sm" onClick={() => handleDownloadConfirmation(booking)} className="rounded-xl border-gold-200 text-gold-700 text-xs px-4">Download Confirmation</Button>
                                     <Button 
                                       size="sm" 
                                       onClick={() => handleBookingAction(booking.id, 'checkin')} 
                                       isLoading={actionLoadingId === booking.id}
                                       className="rounded-xl px-6 bg-gold-600 hover:bg-gold-700 text-white shadow-lg text-xs"
                                     >
                                       Check-In Guest
                                     </Button>
                                   </div>
                                 )}
                                {booking.status === "CHECKED_IN" && (
                                  <Button size="sm" onClick={() => handleBookingAction(booking.id, 'checkout')} isLoading={actionLoadingId === booking.id} className="rounded-xl px-8 bg-navy-950 hover:bg-navy-900 text-white shadow-lg">Process Check-Out</Button>
                                )}
                                {booking.status === "COMPLETED" && (
                                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" /> Guest Checked Out
                                  </span>
                                )}
                             </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-20 bg-sand-50/50 rounded-[3rem] border-2 border-dashed border-sand-200">
                    <CalIcon className="w-12 h-12 text-sand-300 mx-auto mb-4" />
                    <p className="text-lg font-serif font-bold text-navy-950/40">No active reservations found.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {showEditRoom && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-navy-950/40 backdrop-blur-sm" onClick={() => setShowEditRoom(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-[3rem] p-10 max-w-lg w-full shadow-2xl">
              <h2 className="text-2xl font-serif font-bold text-navy-950 mb-6">Edit Room</h2>
              <form onSubmit={handleEditRoom} className="space-y-4">
                <Input label="Room Name" value={roomFormData.name} onChange={e => setRoomFormData({...roomFormData, name: e.target.value})} required />
                <Input label="Description" value={roomFormData.description} onChange={e => setRoomFormData({...roomFormData, description: e.target.value})} />
                <Input label="Price Per Night" type="number" value={roomFormData.pricePerNight} onChange={e => setRoomFormData({...roomFormData, pricePerNight: e.target.value})} required />
                <Input label="Capacity" type="number" value={roomFormData.capacity} onChange={e => setRoomFormData({...roomFormData, capacity: e.target.value})} required />
                <Input label="Available Count" type="number" value={roomFormData.availableCount} onChange={e => setRoomFormData({...roomFormData, availableCount: e.target.value})} required />
                <div className="flex gap-4 mt-6">
                  <Button type="submit" className="flex-1" isLoading={isAddingRoom}>Save Changes</Button>
                  <Button variant="outline" className="flex-1" onClick={() => setShowEditRoom(false)}>Cancel</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showBlockRoom && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-navy-950/40 backdrop-blur-sm" onClick={() => setShowBlockRoom(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl">
              <h2 className="text-2xl font-serif font-bold text-navy-950 mb-6">Block Room Inventory</h2>
              <form onSubmit={handleBlockRoom} className="space-y-4">
                <Input label="Date" type="date" value={blockingFormData.date} onChange={e => setBlockingFormData({...blockingFormData, date: e.target.value})} required />
                <Input label="Reason (Optional)" value={blockingFormData.reason} onChange={e => setBlockingFormData({...blockingFormData, reason: e.target.value})} />
                <div className="flex gap-4 mt-6">
                  <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-700 text-white">Block Room</Button>
                  <Button variant="outline" className="flex-1" onClick={() => setShowBlockRoom(false)}>Cancel</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showEditBooking && editingBooking && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-navy-950/40 backdrop-blur-sm" onClick={() => setShowEditBooking(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-[3rem] p-10 max-w-lg w-full shadow-2xl">
              <h2 className="text-2xl font-serif font-bold text-navy-950 mb-6">Edit Booking</h2>
              <form onSubmit={handleEditBooking} className="space-y-4">
                <Input label="Check-In" type="date" value={bookingFormData.checkIn} onChange={e => setBookingFormData({...bookingFormData, checkIn: e.target.value})} />
                <Input label="Check-Out" type="date" value={bookingFormData.checkOut} onChange={e => setBookingFormData({...bookingFormData, checkOut: e.target.value})} />
                <Input label="Guests" type="number" value={bookingFormData.guests} onChange={e => setBookingFormData({...bookingFormData, guests: e.target.value})} />
                <Input label="Total Price" type="number" value={bookingFormData.totalPrice} onChange={e => setBookingFormData({...bookingFormData, totalPrice: e.target.value})} />
                <div className="flex gap-4 mt-6">
                  <Button type="submit" className="flex-1">Save Changes</Button>
                  <Button variant="outline" className="flex-1" onClick={() => setShowEditBooking(false)}>Cancel</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showDiningModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-navy-950/80 backdrop-blur-sm" onClick={() => setShowDiningModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-[3rem] p-10 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto border border-sand-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-serif font-bold text-navy-950">Manage Dining Packages</h2>
                <button type="button" onClick={() => setShowDiningModal(false)} className="p-2 hover:bg-sand-50 rounded-full transition-colors"><X className="w-6 h-6 text-navy-950/40" /></button>
              </div>
              
              <div className="space-y-4 mb-8">
                {diningPackages.map((pkg, idx) => (
                  <div key={idx} className="p-6 border border-sand-200 bg-sand-50/30 rounded-2xl flex items-start gap-4">
                    <div className="flex-1 space-y-4">
                      <Input label="Package Name" value={pkg.name} onChange={(e) => {
                        const newPkgs = [...diningPackages];
                        newPkgs[idx].name = e.target.value;
                        setDiningPackages(newPkgs);
                      }} />
                      <Input label="Price (₹)" type="number" value={pkg.price} onChange={(e) => {
                        const newPkgs = [...diningPackages];
                        newPkgs[idx].price = Number(e.target.value);
                        setDiningPackages(newPkgs);
                      }} />
                      <Input label="Description" value={pkg.description} onChange={(e) => {
                        const newPkgs = [...diningPackages];
                        newPkgs[idx].description = e.target.value;
                        setDiningPackages(newPkgs);
                      }} />
                    </div>
                    <button type="button" onClick={() => {
                      setDiningPackages(diningPackages.filter((_, i) => i !== idx));
                    }} className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0 border border-transparent hover:border-red-100">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
                {diningPackages.length === 0 && (
                  <div className="text-center py-12 text-navy-950/40 font-bold border-2 border-dashed border-sand-200 rounded-2xl">
                    No dining packages added yet.
                  </div>
                )}
              </div>
              
              <div className="flex gap-4 border-t border-sand-100 pt-6">
                <Button variant="outline" className="flex-1 border-dashed border-2 border-sand-200 hover:border-navy-950 hover:bg-sand-50" onClick={() => {
                  setDiningPackages([...diningPackages, { name: "", price: 0, description: "" }]);
                }}>
                  <Plus className="w-4 h-4 mr-2" /> Add Package
                </Button>
                <Button className="flex-1 bg-navy-950 text-white hover:bg-navy-900 shadow-luxury" onClick={handleSaveDining}>Save Changes</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
