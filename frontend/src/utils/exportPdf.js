/**
 * exportPdf.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Generates a branded PDF ATS Audit Report using jsPDF.
 *
 * Key addition: embeds an invisible marker string "%%ATS_AUDIT_REPORT%%"
 * as white-on-white text on page 1. The backend pdf_service.py reads this
 * marker and rejects the file with a clear error if someone tries to re-upload
 * their downloaded report instead of their actual resume.
 *
 * NO BACKEND CHANGES needed for the marker — pdf_service.py already checks for it.
 *
 * INSTALL (optional — works without npm install via CDN auto-load):
 *   npm install jspdf
 *   then replace loadJsPDF() with:  import jsPDF from 'jspdf';
 */

// ── Load jsPDF from CDN (skipped if already loaded) ──────────────────────────
function loadJsPDF() {
  return new Promise((resolve, reject) => {
    if (window.jspdf) return resolve(window.jspdf.jsPDF);
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.onload  = () => resolve(window.jspdf.jsPDF);
    script.onerror = () => reject(new Error('Failed to load jsPDF from CDN'));
    document.head.appendChild(script);
  });
}

// ── Colour palette ────────────────────────────────────────────────────────────
const C = {
  primary : [37,  99,  235],
  success : [5,   150, 105],
  danger  : [225, 29,  72 ],
  muted   : [100, 116, 139],
  light   : [241, 245, 249],
  white   : [255, 255, 255],
  dark    : [15,  23,  42 ],
  border  : [203, 213, 225],
};

// ── Tiny helpers ──────────────────────────────────────────────────────────────
const setFill  = (d, rgb) => d.setFillColor(...rgb);
const setDraw  = (d, rgb) => d.setDrawColor(...rgb);
const setColor = (d, rgb) => d.setTextColor(...rgb);

function filledRect(doc, x, y, w, h, rgb, r = 3) {
  setFill(doc, rgb);
  doc.roundedRect(x, y, w, h, r, r, 'F');
}

function printText(doc, text, x, y, { size = 10, color = C.dark, bold = false, maxWidth } = {}) {
  doc.setFontSize(size);
  setColor(doc, color);
  doc.setFont('helvetica', bold ? 'bold' : 'normal');
  const lines = maxWidth ? doc.splitTextToSize(String(text), maxWidth) : [String(text)];
  const lh = size * 0.45;
  lines.forEach(line => {
    if (y > 272) { doc.addPage(); y = 20; }
    doc.text(line, x, y);
    y += lh + 1.5;
  });
  return y;
}

function sectionHeader(doc, label, y) {
  if (y > 260) { doc.addPage(); y = 20; }
  filledRect(doc, 14, y - 5, 182, 10, C.light);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  setColor(doc, C.primary);
  doc.text(label, 18, y + 1.5);
  return y + 10;
}

function drawScoreRing(doc, score, cx, cy) {
  const r     = 18;
  const color = score >= 80 ? C.primary : score >= 50 ? [14, 165, 233] : C.muted;
  const pct   = Math.min(100, Math.max(0, score)) / 100;
  const start = -Math.PI / 2;
  const steps = Math.round(pct * 60);

  setDraw(doc, C.border);
  doc.setLineWidth(3);
  doc.circle(cx, cy, r, 'S');

  setDraw(doc, color);
  for (let i = 0; i < steps; i++) {
    const a1 = start + (i / 60) * 2 * Math.PI;
    const a2 = start + ((i + 1) / 60) * 2 * Math.PI;
    doc.line(cx + r * Math.cos(a1), cy + r * Math.sin(a1),
             cx + r * Math.cos(a2), cy + r * Math.sin(a2));
  }

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  setColor(doc, color);
  doc.text(String(score), cx, cy + 2, { align: 'center' });

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  setColor(doc, C.muted);
  doc.text('ATS SCORE', cx, cy + 7, { align: 'center' });
}

function drawPill(doc, label, x, y, variant = 'green') {
  const bg  = variant === 'green' ? [209, 250, 229] : [255, 228, 230];
  const txt = variant === 'green' ? C.success : C.danger;
  const w   = Math.min(doc.getTextWidth(label) * 2.5 + 6, 55);
  filledRect(doc, x, y - 4, w, 7, bg, 2);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  setColor(doc, txt);
  doc.text(label, x + 3, y + 0.2);
  return w + 3;
}

// ── Main export ───────────────────────────────────────────────────────────────
export async function downloadPDFReport(analysisData) {
  if (!analysisData) return;

  const jsPDF = await loadJsPDF();
  const doc   = new jsPDF({ unit: 'mm', format: 'a4' });
  const PW = 210, ML = 14, MR = 14, CW = PW - ML - MR;
  let y = 0;

  // ══════════════════════════════════════════════════════════════════
  // INVISIBLE MARKER — white text on page 1, position (0, 0)
  // PyMuPDF extracts ALL text including invisible text, so the backend
  // pdf_service.py will find this marker and block re-uploads of this
  // report with a friendly error message instead of a bad 400/500.
  // ══════════════════════════════════════════════════════════════════
  doc.setFontSize(1);
  setColor(doc, C.white);   // white on white — invisible to readers
  doc.text('%%ATS_AUDIT_REPORT%%', 0, 1);

  // Reset colour before drawing anything visible
  setColor(doc, C.dark);

  // ── Header banner ────────────────────────────────────────────────
  filledRect(doc, 0, 0, PW, 38, C.primary, 0);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  setColor(doc, C.white);
  doc.text('Resume ATS Audit Report', ML, 16);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleString()}`, ML, 23);
  doc.text('Powered by Groq AI', ML, 29);

  y = 50;

  // ── Score ring ────────────────────────────────────────────────────
  drawScoreRing(doc, analysisData.match_score, ML + 22, y + 10);

  const scoreLabel =
    analysisData.match_score >= 80 ? 'Strong match — you are in great shape!'
    : analysisData.match_score >= 50 ? 'Moderate match — a few gaps to close.'
    : 'Needs work — key keywords are missing.';
  const scoreColor =
    analysisData.match_score >= 80 ? C.primary
    : analysisData.match_score >= 50 ? [14, 165, 233]
    : C.muted;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  setColor(doc, C.dark);
  doc.text('ATS Compatibility', ML + 50, y + 5);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  setColor(doc, C.muted);
  doc.text('Based on keyword analysis against the job description', ML + 50, y + 11);

  filledRect(doc, ML + 50, y + 16, CW - 50, 3, C.border, 1.5);
  const barW = ((CW - 50) * Math.min(100, Math.max(0, analysisData.match_score))) / 100;
  filledRect(doc, ML + 50, y + 16, barW, 3, scoreColor, 1.5);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  setColor(doc, scoreColor);
  doc.text(scoreLabel, ML + 50, y + 25);

  y += 40;

  // ── Matched keywords ──────────────────────────────────────────────
  y = sectionHeader(doc, '✓  Matched Keywords', y);
  const matched = analysisData.matched_skills || [];
  if (!matched.length) {
    y = printText(doc, 'No matched keywords found.', ML, y, { color: C.muted });
  } else {
    let px = ML;
    matched.forEach(skill => {
      if (px + 60 > PW - MR) { px = ML; y += 10; }
      if (y > 272) { doc.addPage(); y = 20; px = ML; }
      px += drawPill(doc, skill, px, y, 'green');
    });
    y += 12;
  }

  // ── Missing keywords ──────────────────────────────────────────────
  y = sectionHeader(doc, '⚠  Missing Keywords', y);
  const missing = analysisData.missing_skills || [];
  if (!missing.length) {
    y = printText(doc, 'No missing keywords — your resume covers all key terms!', ML, y, { color: C.success });
  } else {
    missing.forEach(item => {
      if (y > 265) { doc.addPage(); y = 20; }
      const name = typeof item === 'object' ? item.skill : item;
      const loc  = typeof item === 'object' ? item.recommended_location : 'Experience Section';
      drawPill(doc, name, ML, y, 'red');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      setColor(doc, C.muted);
      doc.text(`Add to: ${loc}`, ML + 2, y + 8);
      y += 14;
    });
  }

  // ── Expert feedback ───────────────────────────────────────────────
  y = sectionHeader(doc, '⚡  Expert Feedback', y);
  (analysisData.ats_feedback || []).forEach(fb => {
    if (y > 265) { doc.addPage(); y = 20; }
    setFill(doc, C.primary);
    doc.circle(ML + 2, y - 1, 1.2, 'F');
    y = printText(doc, fb, ML + 6, y, { size: 9, color: C.dark, maxWidth: CW - 8 });
    y += 2;
  });

  // ── AI rewrite suggestions ────────────────────────────────────────
  y = sectionHeader(doc, '✏  AI Suggested Rewrites', y);
  const bullets = analysisData.rewritten_bullets || [];
  if (!bullets.length) {
    printText(doc, 'No rewrites suggested.', ML, y, { color: C.muted });
  } else {
    bullets.forEach(b => {
      if (y > 250) { doc.addPage(); y = 20; }
      filledRect(doc, ML, y - 4, CW, 28, C.light, 3);

      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      setColor(doc, C.muted);
      doc.text('ORIGINAL', ML + 3, y + 1);

      y = printText(doc, b.original, ML + 3, y + 5, { size: 8.5, color: C.muted, maxWidth: CW - 6 });

      setDraw(doc, C.border);
      doc.setLineWidth(0.3);
      doc.line(ML + 3, y + 1, ML + CW - 3, y + 1);
      y += 4;

      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      setColor(doc, C.primary);
      doc.text('AI REWRITE', ML + 3, y);

      y = printText(doc, b.rewritten, ML + 3, y + 4, { size: 8.5, color: C.dark, maxWidth: CW - 6 });
      y += 6;
    });
  }

  // ── Footer on every page ──────────────────────────────────────────
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    filledRect(doc, 0, 285, PW, 12, C.light, 0);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    setColor(doc, C.muted);
    doc.text('Resume ATS Audit — Confidential', ML, 292);
    doc.text(`Page ${p} of ${total}`, PW - MR, 292, { align: 'right' });
  }

  doc.save(`ATS_Report_${Date.now()}.pdf`);
}