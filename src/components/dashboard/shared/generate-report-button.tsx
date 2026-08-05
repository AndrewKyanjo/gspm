"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateMonthlyReport } from "@/features/reports/actions";

type Props = {
  scopeLevel: string;
  scopeEntityId: string;
  year: number;
  month: number;
  label: string;
  variant?: "primary" | "secondary";
};

export function GenerateReportButton({ scopeLevel, scopeEntityId, year, month, label, variant = "primary" }: Props) {
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function handleClick() {
    setPending(true);
    try {
      const fd = new FormData();
      fd.set("scopeLevel", scopeLevel);
      fd.set("scopeEntityId", scopeEntityId);
      fd.set("year", String(year));
      fd.set("month", String(month));
      const result = await generateMonthlyReport(null, fd);
      if (result.success && result.reportId) {
        router.push(`/dashboard/${scopeLevel === "archdiocese" ? "archdiocese" : scopeLevel}/reports/monthly/${result.reportId}`);
        router.refresh();
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <Button onClick={handleClick} disabled={pending} variant={variant === "secondary" ? "secondary" : undefined}>
      <CalendarCheck className="h-4 w-4 mr-2" />
      {pending ? "Generating..." : label}
    </Button>
  );
}
