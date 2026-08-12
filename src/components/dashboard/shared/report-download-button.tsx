"use client";

import { useState } from "react";
import { FileDown, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

type ReportType = "contribution";

type ReportDownloadButtonProps = {
  reportType: ReportType;
  reportData: unknown;
  label?: string;
};

export function ReportDownloadButton({
  reportType,
  reportData,
  label = "Download PDF Report",
}: ReportDownloadButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const res = await fetch("/api/reports/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: reportType, data: reportData }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Download failed" }));
        alert(err.error ?? "Failed to generate PDF report.");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `gspm-${reportType}-report-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Failed to download the report. Please try again.");
      console.error("Report download error:", e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <Button type="button" variant="secondary" onClick={handleDownload} disabled={loading}>
        <FileDown className="h-4 w-4" />
        {loading ? "Generating…" : label}
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={() => window.print()}>
        <Printer className="h-4 w-4" />
        <span className="hidden sm:inline">Print</span>
      </Button>
    </span>
  );
}
