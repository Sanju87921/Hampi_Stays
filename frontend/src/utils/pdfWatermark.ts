import { jsPDF } from "jspdf";

interface WatermarkOptions {
  referenceNumber?: string;
  timestamp?: string;
}

/**
 * Applies a refined, luxury-grade, print-safe watermark on every page of a jsPDF document.
 * Matches premium resort stationery aesthetic (Taj Hotels / Aman Resorts style).
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

    // A4 dimensions: 210 x 297 mm
    const cx = 105;
    const cy = 148.5;

    // --- 1. PREMIUM LAID-PAPER TEXTURE GRID (1% - 1.5% Opacity) ---
    try {
      const textureGState = new (doc as any).GState({ opacity: 0.015, "stroke-opacity": 0.015 });
      doc.setGState(textureGState);
    } catch (e) {
      console.warn("jsPDF GState is not available.");
    }

    doc.setDrawColor(197, 160, 89);
    doc.setLineWidth(0.15);

    // Draw horizontal texture lines
    for (let y = cy - 70; y <= cy + 70; y += 12) {
      doc.line(cx - 65, y, cx + 65, y);
    }
    // Draw vertical texture lines
    for (let x = cx - 65; x <= cx + 65; x += 12) {
      doc.line(x, cy - 70, x, cy + 70);
    }

    // --- 2. FEATHERED GOLDEN-RATIO DIAMOND FRAME (4% - 6% Opacity) ---
    // We achieve a feathered/blended outline by rendering nested shapes with descending opacity
    const drawDiamond = (r: number) => {
      doc.line(cx, cy - r, cx + r, cy);
      doc.line(cx + r, cy, cx, cy + r);
      doc.line(cx, cy + r, cx - r, cy);
      doc.line(cx - r, cy, cx, cy - r);
    };

    // Innermost Diamond (6% Opacity)
    try {
      const gStateInner = new (doc as any).GState({ opacity: 0.06, "stroke-opacity": 0.06 });
      doc.setGState(gStateInner);
    } catch (e) {}
    doc.setLineWidth(0.3);
    drawDiamond(44);

    // Middle Diamond (4% Opacity)
    try {
      const gStateMiddle = new (doc as any).GState({ opacity: 0.04, "stroke-opacity": 0.04 });
      doc.setGState(gStateMiddle);
    } catch (e) {}
    doc.setLineWidth(0.2);
    drawDiamond(47);

    // Outermost Diamond (2% Opacity for feathered edge)
    try {
      const gStateOuter = new (doc as any).GState({ opacity: 0.02, "stroke-opacity": 0.02 });
      doc.setGState(gStateOuter);
    } catch (e) {}
    doc.setLineWidth(0.1);
    drawDiamond(50);

    // --- 3. ELEGANT HERITAGE LOGO / ARCH EMBLEM (5% - 6% Opacity) ---
    try {
      const logoGState = new (doc as any).GState({ opacity: 0.055, "stroke-opacity": 0.055 });
      doc.setGState(logoGState);
    } catch (e) {}
    
    doc.setDrawColor(197, 160, 89);
    doc.setFillColor(197, 160, 89);
    doc.setTextColor(197, 160, 89);

    // Draw luxury crown/temple arch pinnacle at top-center of the diamonds
    // Base dome
    doc.setLineWidth(0.35);
    doc.line(cx - 8, cy - 28, cx + 8, cy - 28);
    // Left pillar top
    doc.line(cx - 6, cy - 28, cx - 6, cy - 31);
    // Right pillar top
    doc.line(cx + 6, cy - 28, cx + 6, cy - 31);
    // Center pinnacle triangle
    doc.triangle(cx - 4, cy - 31, cx + 4, cy - 31, cx, cy - 38, "S");
    // Little solid crown gem
    doc.circle(cx, cy - 39.5, 0.6, "F");

    // --- 4. CENTERED DIAGONAL BRANDING (5.5% Opacity) ---
    // 322 degrees rotation angle
    const rotateAngle = 322;

    // Classic wide-spaced luxury text (Taj / Aman Resorts style)
    doc.setFont("times", "bold");
    doc.setFontSize(21);
    doc.text("H A M P I S T A Y S", cx, cy - 4, { align: "center", angle: rotateAngle });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text("LUXURY ECO-HOSPITALITY", cx, cy + 3, { align: "center", angle: rotateAngle });

    // Faint security metadata
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.text(`AUTHENTICATION REF: ${ref}`, cx, cy + 9, { align: "center", angle: rotateAngle });

    doc.setFontSize(6);
    doc.text(`VERIFIED RECORD: ${timeStr}`, cx, cy + 14, { align: "center", angle: rotateAngle });

    // --- 5. AUTHENTICITY FOOTER LAYER (8% Opacity for elegant readability) ---
    try {
      const footerGState = new (doc as any).GState({ opacity: 0.08, "stroke-opacity": 0.08 });
      doc.setGState(footerGState);
    } catch (e) {}

    // Tiny, clean, centered authenticity footer
    doc.setFont("times", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 100, 100); // Slate gray/bronze feel
    doc.text(`Digitally Generated & Verified by HampiStays  |  Reference: ${ref}`, cx, 284, { align: "center" });

    // Restore graphics state so subsequent elements aren't affected
    doc.restoreGraphicsState();
  }
}
