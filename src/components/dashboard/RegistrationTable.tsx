"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveRegistration, rejectRegistration } from "@/features/registrations/actions";
import { LEVEL_LABELS, ROLE_LABELS } from "@/lib/permissions/roles";
import type { HierarchyLevel } from "@/types/hierarchy";
import type { AppRole } from "@/types/roles";

export interface RegistrationRequestRow {
  id: string;
  requested_role: AppRole;
  requested_level: HierarchyLevel;
  requested_archdiocese_id: string | null;
  requested_vicariate_id: string | null;
  requested_deanery_id: string | null;
  requested_parish_id: string | null;
  created_at: string;
  profile: { full_name: string; email: string; phone: string | null } | null;
  vicariate: { name: string } | null;
  deanery: { name: string } | null;
  parish: { name: string } | null;
}

export default function RegistrationTable({ requests }: { requests: RegistrationRequestRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const unitName = (request: RegistrationRequestRow) =>
    request.vicariate?.name ?? request.deanery?.name ?? request.parish?.name ?? "-";

  const closeReview = () => {
    setActiveId(null);
    setNotes("");
  };

  const handleApprove = (request: RegistrationRequestRow) => {
    setError(null);
    startTransition(async () => {
      const result = await approveRegistration({
        requestId: request.id,
        finalRole: request.requested_role,
        finalLevel: request.requested_level,
        archdioceseId: request.requested_archdiocese_id,
        vicariateId: request.requested_vicariate_id,
        deaneryId: request.requested_deanery_id,
        parishId: request.requested_parish_id,
        reviewNotes: activeId === request.id ? notes || null : null,
      });

      if (!result.ok) {
        setError(result.error ?? "Something went wrong.");
        return;
      }

      closeReview();
      router.refresh();
    });
  };

  const handleReject = (request: RegistrationRequestRow) => {
    setError(null);
    startTransition(async () => {
      const result = await rejectRegistration(
        request.id,
        activeId === request.id ? notes || undefined : undefined
      );

      if (!result.ok) {
        setError(result.error ?? "Something went wrong.");
        return;
      }

      closeReview();
      router.refresh();
    });
  };

  if (requests.length === 0) {
    return (
      <div className="py-16 text-center text-on-surface-variant">
        <span className="material-symbols-outlined mb-2 block text-4xl">task_alt</span>
        No pending registrations right now.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg bg-error-container p-3 text-sm text-on-error-container">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-outline-variant">
        <table className="w-full text-sm">
          <thead className="bg-surface-container text-left text-on-surface-variant">
            <tr>
              <th className="p-4 font-medium">Applicant</th>
              <th className="p-4 font-medium">Requested Role</th>
              <th className="p-4 font-medium">Office</th>
              <th className="p-4 font-medium">Submitted</th>
              <th className="p-4 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.id} className="align-top border-t border-outline-variant">
                <td className="p-4">
                  <div className="font-medium text-on-surface">
                    {request.profile?.full_name ?? "Unknown"}
                  </div>
                  <div className="text-xs text-on-surface-variant">{request.profile?.email}</div>
                  {request.profile?.phone && (
                    <div className="text-xs text-on-surface-variant">{request.profile.phone}</div>
                  )}
                </td>
                <td className="p-4">{ROLE_LABELS[request.requested_role]}</td>
                <td className="p-4">
                  {LEVEL_LABELS[request.requested_level]} - {unitName(request)}
                </td>
                <td className="p-4 text-on-surface-variant">
                  {new Date(request.created_at).toLocaleDateString()}
                </td>
                <td className="p-4">
                  {activeId === request.id ? (
                    <div className="min-w-[220px] space-y-2">
                      <textarea
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                        placeholder="Notes (optional)"
                        className="w-full rounded-lg border border-outline-variant p-2 text-xs"
                        rows={2}
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={closeReview}
                          className="rounded-lg border border-outline-variant px-3 py-1.5 text-xs"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleReject(request)}
                          className="rounded-lg bg-error-container px-3 py-1.5 text-xs text-on-error-container"
                        >
                          Confirm Reject
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleApprove(request)}
                          className="rounded-lg bg-primary px-3 py-1.5 text-xs text-on-primary"
                        >
                          Confirm Approve
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/dashboard/archdiocese/users/approvals/${request.id}`}
                        className="rounded-lg border border-outline-variant px-3 py-1.5 text-xs hover:bg-surface-container"
                      >
                        Open
                      </Link>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => setActiveId(request.id)}
                        className="rounded-lg border border-outline-variant px-3 py-1.5 text-xs hover:bg-surface-container"
                      >
                        Review
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
