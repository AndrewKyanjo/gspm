import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/requireAuth";

export default async function ArchdioceseLayout({ children }: { children: ReactNode }) {
  const context = await requireAuth({
    roles: ["super_admin", "archdiocese_admin", "archdiocese_data_entry"],
  });

  if (!context.archdioceseId) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
