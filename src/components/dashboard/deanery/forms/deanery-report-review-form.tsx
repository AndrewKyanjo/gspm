"use client";

import { useActionState } from "react";
import { reviewDeaneryReport, type DeaneryReportReviewState } from "@/features/deanery/reports/actions";
import { Button } from "@/components/ui/button";

const initialState: DeaneryReportReviewState = { error: null };

export function DeaneryReportReviewForm({ reportId }: { reportId: string }) {
  const [state, action, pending] = useActionState(reviewDeaneryReport, initialState);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="reportId" value={reportId} />
      {state.error ? (
        <div className="rounded-md bg-error-container p-3 text-sm text-on-error-container">{state.error}</div>
      ) : null}

      <label className="space-y-2">
        <span className="block text-sm font-medium text-on-surface">Review note</span>
        <textarea
          name="note"
          rows={5}
          className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface"
        />
      </label>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" name="action" value="commented" variant="secondary" disabled={pending}>
          Add comment
        </Button>
        <Button type="submit" name="action" value="approved" disabled={pending}>
          Approve
        </Button>
        <Button type="submit" name="action" value="returned" variant="warning" disabled={pending}>
          Return for revision
        </Button>
        <Button type="submit" name="action" value="rejected" variant="secondary" disabled={pending}>
          Reject
        </Button>
      </div>
    </form>
  );
}
