"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateReportStatus } from "@/features/archdiocese/actions";
import { Button } from "@/components/ui/button";

export function ReturnReportButton({ reportId }: { reportId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleReturn() {
    const note = prompt("Reason for returning this report (optional):");
    setLoading(true);
    const result = await updateReportStatus(reportId, "returned", note ?? undefined);
    if (result.ok) {
      router.refresh();
    } else {
      alert(result.error ?? "Failed to return report.");
    }
    setLoading(false);
  }

  return (
    <Button onClick={handleReturn} disabled={loading} variant="secondary">
      {loading ? "Returning..." : "Return for Revision"}
    </Button>
  );
}
