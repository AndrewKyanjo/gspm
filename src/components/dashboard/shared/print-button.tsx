"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintButton({ label = "Print / Save PDF" }: { label?: string }) {
  return (
    <Button type="button" onClick={() => window.print()} variant="secondary">
      <Printer className="h-4 w-4" />
      {label}
    </Button>
  );
}
