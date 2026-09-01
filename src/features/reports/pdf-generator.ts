/**
 * PDF Report Generator using pdfkit.
 *
 * Generates contribution, monthly, and project reports with the GSPM logo.
 * In Next.js serverless/edge environments, the report is rendered to a Buffer
 * and returned for download via an API route.
 */

import path from "path";
import fs from "fs";
import PDFDocument from "pdfkit";

// ── Helpers ────────────────────────────────────────────────

/** Path to the logo SVG file in public/ */
const LOGO_PATH = path.join(process.cwd(), "public", "logo.svg");

/** Read the logo file as a Buffer (returns null if not found) */
function getLogoBuffer(): Buffer | null {
  try {
    return fs.readFileSync(LOGO_PATH);
  } catch {
    return null;
  }
}

/** Format currency in UGX */
function formatCurrency(amount: number | null | undefined): string {
  if (amount == null || !Number.isFinite(amount)) return "0";
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    maximumFractionDigits: 0,
  }).format(amount);
}

function numberValue(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function recordValue(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
}

// ── Report Types ───────────────────────────────────────────

export type ContributionReportRow = {
  parishName: string;
  vicariateName?: string;
  deaneryName?: string;
  monthlyRate: number;
  gsdRate: number;
  totalEmitemwaPaid: number;
  gsdPaid: number;
  remaining: number;
};

export type ContributionReportInput = {
  title: string;
  subtitle?: string;
  year: number;
  rows: ContributionReportRow[];
  totals: {
    totalEmitemwa: number;
    totalGsd: number;
    totalRemaining: number;
  };
};

export type MonthlyReportInput = {
  title: string;
  subtitle?: string;
  year: number;
  month: number;
  financialData: Record<string, unknown>;
  projectData: Record<string, unknown>;
  documentData: Record<string, unknown>;
};

// ── Report Generators ──────────────────────────────────────

/**
 * Generate a PDF contribution rollup report.
 */
export async function generateContributionReportPDF(input: ContributionReportInput): Promise<Buffer> {
  const logo = getLogoBuffer();

  return new Promise((resolve) => {
    const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 30 });
    const buffers: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));

    // ── Header ──
    if (logo) {
      doc.image(logo, 30, 20, { width: 60 });
    }
    doc.fontSize(16).font("Helvetica-Bold").text(input.title, logo ? 100 : 30, 30, { continued: false });
    if (input.subtitle) {
      doc.fontSize(10).font("Helvetica").text(input.subtitle, logo ? 100 : 30, 52);
    }
    doc.fontSize(9).font("Helvetica").text(`Year: ${input.year}  •  Generated: ${new Date().toLocaleDateString("en-UG")}`, logo ? 100 : 30, 66);
    doc.moveDown(2);

    // ── Table ──
    const startY = 90;
    const colX = [30, 180, 270, 340, 410, 500, 580, 660];
    const colHeaders = ["Parish", "Vicariate", "Rate/mo", "GSD Rate", "Emitemwa Paid", "GSD Paid", "Remaining", "Status"];

    // Table header background
    doc.rect(30, startY - 5, 740, 20).fill("#002045");
    doc.fillColor("#ffffff").fontSize(8).font("Helvetica-Bold");
    colHeaders.forEach((h, i) => doc.text(h, colX[i], startY, { width: colX[i + 1] ? colX[i + 1] - colX[i] - 5 : 100 }));
    doc.fillColor("#0b1c30").font("Helvetica");

    // Table rows
    let y = startY + 20;
    input.rows.forEach((row, idx) => {
      if (y > 520) {
        doc.addPage();
        y = 40;
      }
      // Alternating row background
      if (idx % 2 === 0) {
        doc.rect(30, y - 4, 740, 18).fill("#eff4ff");
        doc.fillColor("#0b1c30");
      }
      doc.fontSize(8);
      doc.text(row.parishName, colX[0], y, { width: 140 });
      doc.text(row.vicariateName ?? "-", colX[1], y, { width: 80 });
      doc.text(formatCurrency(row.monthlyRate), colX[2], y, { width: 60 });
      doc.text(formatCurrency(row.gsdRate), colX[3], y, { width: 60 });
      doc.text(formatCurrency(row.totalEmitemwaPaid), colX[4], y, { width: 70 });
      doc.text(formatCurrency(row.gsdPaid), colX[5], y, { width: 70 });
      doc.text(formatCurrency(row.remaining), colX[6], y, { width: 70 });
      const status = row.remaining > 0 ? "Outstanding" : "Cleared";
      doc.fillColor(row.remaining > 0 ? "#ba1a1a" : "#2d6f3c");
      doc.text(status, colX[7], y, { width: 70 });
      doc.fillColor("#0b1c30");
      y += 18;
    });

    // Totals row
    doc.rect(30, y, 740, 20).fill("#d3e4fe");
    doc.fillColor("#002045").font("Helvetica-Bold").fontSize(9);
    doc.text("TOTALS", colX[0], y + 4, { width: 140 });
    doc.text("", colX[1], y + 4);
    doc.text("", colX[2], y + 4);
    doc.text("", colX[3], y + 4);
    doc.text(formatCurrency(input.totals.totalEmitemwa), colX[4], y + 4, { width: 70 });
    doc.text(formatCurrency(input.totals.totalGsd), colX[5], y + 4, { width: 70 });
    doc.text(formatCurrency(input.totals.totalRemaining), colX[6], y + 4, { width: 70 });
    doc.text("", colX[7], y + 4);

    // ── Footer ──
    doc.fontSize(7).font("Helvetica").fillColor("#74777f");
    const pageCount = doc.bufferedPageRange().count;
    for (let p = 0; p < pageCount; p++) {
      doc.switchToPage(p);
      doc.text(`Page ${p + 1} of ${pageCount}  •  GSPM Portal  •  Kampala Archdiocese`, 30, 560, { align: "center", width: 740 });
    }

    doc.end();
  });
}

/**
 * Generate a PDF for a generated monthly report.
 */
export async function generateMonthlyReportPDF(input: MonthlyReportInput): Promise<Buffer> {
  const logo = getLogoBuffer();
  const doc = new PDFDocument({ size: "A4", margin: 40 });
  const buffers: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => buffers.push(chunk));
  const pdfPromise = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(buffers)));
  });

  // Header
  if (logo) {
    doc.image(logo, 40, 30, { width: 50 });
  }
  const monthName = new Date(input.year, input.month - 1).toLocaleString("en-UG", { month: "long" });
  doc.fontSize(14).font("Helvetica-Bold").text(input.title, logo ? 100 : 40, 35);
  doc.fontSize(9).font("Helvetica").fillColor("#43474e");
  doc.text(`${monthName} ${input.year}  •  Generated: ${new Date().toLocaleDateString("en-UG")}`, logo ? 100 : 40, 55);
  doc.moveDown(2);

  let y = 80;
  doc.fillColor("#0b1c30");

  // Financial Section
  doc.fontSize(11).font("Helvetica-Bold").text("Financial Summary", 40, y);
  y += 20;
  const fin = input.financialData;
  if (Object.keys(fin).length > 0) {
    doc.fontSize(9).font("Helvetica");
    const items = [
      ["Total Emitemwa Collected", formatCurrency(numberValue(fin.totalEmitemwaPaid ?? fin.totalEmitemwaAmount))],
      ["Good Samaritan Day Collected", formatCurrency(numberValue(fin.goodSamaritanPaid ?? fin.totalGsdAmount))],
      ["Project Contributions", formatCurrency(numberValue(input.projectData.totalRaisedThisMonth ?? fin.totalProjectAmount))],
      ["Arrears Outstanding", formatCurrency(numberValue(fin.arrearsTotal ?? fin.totalArrears))],
    ] as const;
    items.forEach(([label, value]) => {
      doc.text(label, 50, y, { width: 300 });
      doc.text(String(value), 350, y, { width: 150, align: "right" });
      y += 16;
    });
  }
  y += 10;

  // Project Section
  doc.fontSize(11).font("Helvetica-Bold").text("Projects", 40, y);
  y += 20;
  const projects = input.projectData.byProject ?? input.projectData.projects;
  if (Array.isArray(projects)) {
    doc.fontSize(9).font("Helvetica");
    projects.forEach((project) => {
      const row = recordValue(project);
      doc.text(String(row.name ?? row.title ?? "Project"), 50, y, { width: 300 });
      doc.text(formatCurrency(numberValue(row.raisedThisMonth ?? row.amountRaised ?? row.total)), 350, y, { width: 150, align: "right" });
      y += 16;
    });
  }
  y += 10;

  // Document Section
  doc.fontSize(11).font("Helvetica-Bold").text("Documents", 40, y);
  y += 20;
  const documents = input.documentData.documents;
  if (Array.isArray(documents)) {
    doc.fontSize(9).font("Helvetica");
    documents.forEach((document) => {
      const row = recordValue(document);
      doc.text(String(row.title ?? row.name ?? "Document"), 50, y, { width: 400 });
      y += 14;
    });
  } else {
    doc.fontSize(9).text("No documents for this period.", 50, y);
  }

  // Footer
  doc.fontSize(7).font("Helvetica").fillColor("#74777f");
  const pages = doc.bufferedPageRange().count;
  for (let p = 0; p < pages; p++) {
    doc.switchToPage(p);
    doc.text(`Page ${p + 1} of ${pages}  •  GSPM Portal  •  Kampala Archdiocese Good Samaritans`, 40, 570, { align: "center", width: 515 });
  }

  doc.end();
  return pdfPromise;
}
