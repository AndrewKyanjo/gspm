"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateReportStatus } from "@/features/archdiocese/actions";
import { Button } from "@/components/ui/button";

export function ApproveReportButton({ reportId }: { reportId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleApprove() {
    setLoading(true);
    const result = await updateReportStatus(reportId, "approved");
    if (result.ok) {
      router.refresh();
    } else {
      alert(result.error ?? "Failed to approve report.");
    }
    setLoading(false);
  }

  return (
    <Button onClick={handleApprove} disabled={loading} variant="secondary">
      {loading ? "Approving..." : "Approve Report"}
    </Button>
  );
}
