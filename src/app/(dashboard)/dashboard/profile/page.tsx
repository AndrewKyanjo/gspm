import { redirect } from "next/navigation";
import { getAccessContext } from "@/lib/auth/getAccessContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  archdiocese_admin: "Archdiocese Admin",
  archdiocese_data_entry: "Archdiocese Data Entry",
  vicariate_head: "Vicariate Head",
  vicariate_staff: "Vicariate Staff",
  deanery_head: "Deanery Head",
  deanery_staff: "Deanery Staff",
  parish_head: "Parish Head",
  parish_data_entry: "Parish Data Entry",
};

export default async function ProfilePage() {
  const ctx = await getAccessContext();

  if (!ctx) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-5 py-8">
      <div>
        <h1 className="text-2xl font-semibold text-on-surface">Profile</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Your account details and assignments.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your personal details and role.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between border-b border-outline-variant pb-3">
            <span className="font-medium text-on-surface-variant">Name</span>
            <span className="text-on-surface">{ctx.fullName ?? "—"}</span>
          </div>
          <div className="flex justify-between border-b border-outline-variant pb-3">
            <span className="font-medium text-on-surface-variant">Email</span>
            <span className="text-on-surface">{ctx.email ?? "—"}</span>
          </div>
          <div className="flex justify-between border-b border-outline-variant pb-3">
            <span className="font-medium text-on-surface-variant">Role</span>
            <span className="rounded-full bg-primary-container px-3 py-0.5 text-xs font-medium text-on-primary-container">
              {ROLE_LABELS[ctx.role] ?? ctx.role}
            </span>
          </div>
          <div className="flex justify-between border-b border-outline-variant pb-3">
            <span className="font-medium text-on-surface-variant">Level</span>
            <span className="capitalize text-on-surface">{ctx.level}</span>
          </div>
          <div className="flex justify-between pb-1">
            <span className="font-medium text-on-surface-variant">Account Status</span>
            <span className={ctx.approved ? "text-green-700" : "text-amber-700"}>
              {ctx.approved ? "Approved" : "Pending Approval"}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hierarchy Scope</CardTitle>
          <CardDescription>Your assigned scope in the archdiocese hierarchy.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between border-b border-outline-variant pb-3">
            <span className="font-medium text-on-surface-variant">Archdiocese ID</span>
            <span className="font-mono text-xs text-on-surface">{ctx.archdioceseId ?? "—"}</span>
          </div>
          {ctx.vicariateId && (
            <div className="flex justify-between border-b border-outline-variant pb-3">
              <span className="font-medium text-on-surface-variant">Vicariate ID</span>
              <span className="font-mono text-xs text-on-surface">{ctx.vicariateId}</span>
            </div>
          )}
          {ctx.deaneryId && (
            <div className="flex justify-between border-b border-outline-variant pb-3">
              <span className="font-medium text-on-surface-variant">Deanery ID</span>
              <span className="font-mono text-xs text-on-surface">{ctx.deaneryId}</span>
            </div>
          )}
          {ctx.parishId && (
            <div className="flex justify-between border-b border-outline-variant pb-3">
              <span className="font-medium text-on-surface-variant">Parish ID</span>
              <span className="font-mono text-xs text-on-surface">{ctx.parishId}</span>
            </div>
          )}
          <div className="flex justify-between pb-1">
            <span className="font-medium text-on-surface-variant">User ID</span>
            <span className="font-mono text-xs text-on-surface">{ctx.userId}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
