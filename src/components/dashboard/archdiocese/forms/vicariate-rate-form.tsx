"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  updateVicariateContributionRates,
  type ContributionActionState,
} from "@/features/contributions/actions";
import { Button } from "@/components/ui/button";

const initialState: ContributionActionState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Saving..." : "Save rates"}
    </Button>
  );
}

export function VicariateRateForm({
  vicariateId,
  monthlyAmount,
  goodSamaritanAmount,
  returnTo,
}: {
  vicariateId: string;
  monthlyAmount: number;
  goodSamaritanAmount: number;
  returnTo: string;
}) {
  const [state, action] = useActionState(updateVicariateContributionRates, initialState);

  return (
    <form action={action} className="space-y-3">
      {state.error ? (
        <div className="rounded-md bg-error-container p-2 text-xs text-on-error-container">{state.error}</div>
      ) : null}
      <input type="hidden" name="vicariateId" value={vicariateId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs font-medium text-on-surface-variant">Monthly</span>
          <input
            name="monthlyEmitemwaAmount"
            type="number"
            min={0}
            step={1}
            defaultValue={monthlyAmount}
            className="w-full rounded-md border border-outline-variant bg-surface px-2 py-2 text-sm text-on-surface"
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-on-surface-variant">Good Samaritan Day</span>
          <input
            name="goodSamaritanDayAmount"
            type="number"
            min={0}
            step={1}
            defaultValue={goodSamaritanAmount}
            className="w-full rounded-md border border-outline-variant bg-surface px-2 py-2 text-sm text-on-surface"
          />
        </label>
      </div>
      <SubmitButton />
    </form>
  );
}
