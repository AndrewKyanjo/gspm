import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/requireAuth";

export default async function VicariateLayout({ children }: { children: ReactNode }) {
  const context = await requireAuth({ roles: ["vicariate_head", "vicariate_staff"] });
  if (!context.vicariateId) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
