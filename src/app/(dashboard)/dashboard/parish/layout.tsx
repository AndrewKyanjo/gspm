import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/requireAuth";

export default async function ParishLayout({
  children,
}: {
  children: ReactNode;
  params: Promise<Record<string, never>>;
}) {
  const context = await requireAuth({
    roles: ["parish_head", "parish_data_entry"],
  });

  if (!context.parishId) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
