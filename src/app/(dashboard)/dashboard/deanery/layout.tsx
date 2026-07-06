import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/requireAuth";

export default async function DeaneryLayout({ children }: { children: ReactNode }) {
  const context = await requireAuth({ roles: ["deanery_head", "deanery_staff"] });
  if (!context.deaneryId) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
