"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveRegistration, rejectRegistration } from "@/features/registrations/actions";
import { LEVEL_LABELS, ROLE_LABELS } from "@/lib/permissions/roles";
import type { RegistrationRequestRow } from "./RegistrationTable";

export default function RegistrationReviewForm({
  request,
}: {
  request: RegistrationRequestRow;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const unitName =
    request.parish?.name ?? request.deanery?.name ?? request.vicariate?.name ?? "Archdiocese";

  const handleApprove = () => {
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
        reviewNotes: notes || null,
      });

      if (!result.ok) {
        setError(result.error ?? "Could not approve this registration.");
        return;
      }

      router.push("/dashboard/archdiocese/users/approvals");
      router.refresh();
    });
  };

  const handleReject = () => {
    setError(null);
    startTransition(async () => {
      const result = await rejectRegistration(request.id, notes || undefined);

      if (!result.ok) {
        setError(result.error ?? "Could not reject this registration.");
        return;
      }

      router.push("/dashboard/archdiocese/users/approvals");
      router.refresh();
    });
  };

  return (
    <div className="space-y-6 rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-primary">
            Review Request
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-on-surface">
            {request.profile?.full_name ?? "Unknown applicant"}
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            {request.profile?.email ?? "No email on file"}
          </p>
          {request.profile?.phone ? (
            <p className="text-sm text-on-surface-variant">{request.profile.phone}</p>
          ) : null}
        </div>

        <Link
          href="/dashboard/archdiocese/users/approvals"
          className="rounded-lg border border-outline-variant px-3 py-2 text-sm text-on-surface hover:bg-surface-container"
        >
          Back to queue
        </Link>
      </div>

      {error ? (
        <div className="rounded-lg bg-error-container p-3 text-sm text-on-error-container">
          {error}
        </div>
      ) : null}

      <dl className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg bg-surface-container p-4">
          <dt className="text-xs uppercase tracking-wide text-on-surface-variant">Requested role</dt>
          <dd className="mt-2 text-sm font-medium text-on-surface">
            {ROLE_LABELS[request.requested_role]}
          </dd>
        </div>

        <div className="rounded-lg bg-surface-container p-4">
          <dt className="text-xs uppercase tracking-wide text-on-surface-variant">Requested level</dt>
          <dd className="mt-2 text-sm font-medium text-on-surface">
            {LEVEL_LABELS[request.requested_level]}
          </dd>
        </div>

        <div className="rounded-lg bg-surface-container p-4">
          <dt className="text-xs uppercase tracking-wide text-on-surface-variant">Requested office</dt>
          <dd className="mt-2 text-sm font-medium text-on-surface">{unitName}</dd>
        </div>

        <div className="rounded-lg bg-surface-container p-4">
          <dt className="text-xs uppercase tracking-wide text-on-surface-variant">Submitted</dt>
          <dd className="mt-2 text-sm font-medium text-on-surface">
            {new Date(request.created_at).toLocaleString()}
          </dd>
        </div>
      </dl>

      <div className="space-y-2">
        <label htmlFor="review-notes" className="text-sm font-medium text-on-surface">
          Review notes
        </label>
        <textarea
          id="review-notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={5}
          placeholder="Add any identity-check or scope notes here."
          className="w-full rounded-lg border border-outline-variant bg-surface p-3 text-sm text-on-surface"
        />
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        <button
          type="button"
          disabled={isPending}
          onClick={handleReject}
          className="rounded-lg bg-error-container px-4 py-2 text-sm font-medium text-on-error-container disabled:opacity-60"
        >
          Reject request
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={handleApprove}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-on-primary disabled:opacity-60"
        >
          Approve request
        </button>
      </div>
    </div>
  );
}
