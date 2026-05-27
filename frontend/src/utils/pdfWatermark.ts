import { jsPDF } from "jspdf";

interface WatermarkOptions {
  referenceNumber?: string;
  timestamp?: string;
}

/**
 * Applies a luxury, secure, print-safe watermark on every page of a jsPDF document.
 * 
 * @param doc The jsPDF instance to apply the watermark to.
 * @param options Meta-options containing reference numbers and timestamps.
 */
export function applyPdfWatermark(doc: jsPDF, options: WatermarkOptions = {}) {
  const pageCount = doc.getNumberOfPages();
  const ref = options.referenceNumber || "HST-SECURE";
  const timeStr = options.timestamp || new Date().toLocaleString("en-GB");

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Save graphics state to isolate changes
    doc.saveGraphicsState();

    // Set low-opacity transparency (5% opacity is hospitality-grade and print-safe)
    try {
      // jsPDF GState is standard for transparency/opacity
      const gState = new (doc as any).GState({ opacity: 0.05, "stroke-opacity": 0.05 });
      doc.setGState(gState);
    } catch (e) {
      console.warn("jsPDF GState is not available. Drawing with very light color fallback.");
    }

    // Drawing settings
    // Muted Gold tint (soft/warm hue)
    doc.setDrawColor(197, 160, 89);
    doc.setFillColor(197, 160, 89);
    doc.setTextColor(197, 160, 89);
    doc.setLineWidth(0.4);

    // Page A4 dimensions: 210 x 297 mm
    const cx = 105;
    const cy = 148.5;

    // --- 1. Luxury Circular Crest ---
    // Outer ornate circle
    doc.circle(cx, cy, 45, "S");
    // Inner crisp circle
    doc.circle(cx, cy, 42, "S");

    // Elegant internal diamond grid or star
    // Drawing a delicate 8-point star inside the circle
    doc.line(cx, cy - 42, cx, cy + 42); // vertical axis
    doc.line(cx - 42, cy, cx + 42, cy); // horizontal axis
    doc.line(cx - 30, cy - 30, cx + 30, cy + 30); // diagonal axis 1
    doc.line(cx - 30, cy + 30, cx + 30, cy - 30); // diagonal axis 2

    // Small interior solid dots for premium heritage seal texture
    doc.circle(cx, cy - 36, 1, "F");
    doc.circle(cx, cy + 36, 1, "F");
    doc.circle(cx - 36, cy, 1, "F");
    doc.circle(cx + 36, cy, 1, "F");
    
    // Draw outer boundary ring
    doc.circle(cx, cy, 48, "S");

    // --- 2. Centered Rotated Text Layer ---
    // 320 degrees (rotated slightly upwards)
    doc.setFont("times", "bold");
    doc.setFontSize(26);
    doc.text("HAMPISTAYS", cx, cy - 3, { align: "center", angle: 320 });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("LUXURY ECO-HOSPITALITY", cx, cy + 5, { align: "center", angle: 320 });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(`VERIFICATION REF: ${ref}`, cx, cy + 12, { align: "center", angle: 320 });

    doc.setFontSize(6.5);
    doc.text(`GENERATED: ${timeStr}`, cx, cy + 18, { align: "center", angle: 320 });
    doc.text("DIGITALLY SECURED BY HAMPISTAYS", cx, cy + 24, { align: "center", angle: 320 });

    // Restore graphics state so next elements aren't affected
    doc.restoreGraphicsState();
  }
}
