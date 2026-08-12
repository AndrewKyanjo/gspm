"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  updateParishContributionRates,
  type ContributionActionState,
} from "@/features/contributions/actions";
import { Button } from "@/components/ui/button";

const initialState: ContributionActionState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Saving…" : "Save parish rates"}
    </Button>
  );
}

export function ParishRateForm({
  parishId,
  monthlyAmount,
  goodSamaritanAmount,
  vicariateMonthlyAmount,
  vicariateGsdAmount,
  returnTo,
}: {
  parishId: string;
  monthlyAmount: number | null;
  goodSamaritanAmount: number | null;
  vicariateMonthlyAmount: number;
  vicariateGsdAmount: number;
  returnTo: string;
}) {
  const [state, action] = useActionState(updateParishContributionRates, initialState);

  return (
    <form action={action} className="space-y-3">
      {state.error ? (
        <div className="rounded-md bg-error-container p-2 text-xs text-on-error-container">
          {state.error}
        </div>
      ) : null}
      {state.message ? (
        <div className="rounded-md bg-green-50 p-2 text-xs text-green-800">
          {state.message}
        </div>
      ) : null}

      <input type="hidden" name="parishId" value={parishId} />
      <input type="hidden" name="returnTo" value={returnTo} />

      <p className="text-xs text-on-surface-variant">
        Leave blank to inherit from vicariate. Vicariate defaults:{" "}
        <strong>{vicariateMonthlyAmount.toLocaleString()} UGX/mo</strong> and{" "}
        <strong>{vicariateGsdAmount.toLocaleString()} UGX</strong>.
      </p>

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs font-medium text-on-surface-variant">
            Monthly Emitemwa (UGX)
          </span>
          <input
            name="monthlyEmitemwaAmount"
            type="number"
            min={0}
            step={1}
            placeholder={`Vicariate: ${vicariateMonthlyAmount}`}
            defaultValue={monthlyAmount ?? ""}
            className="w-full rounded-md border border-outline-variant bg-surface px-2 py-2 text-sm text-on-surface"
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-on-surface-variant">
            Good Samaritan Day (UGX)
          </span>
          <input
            name="goodSamaritanDayAmount"
            type="number"
            min={0}
            step={1}
            placeholder={`Vicariate: ${vicariateGsdAmount}`}
            defaultValue={goodSamaritanAmount ?? ""}
            className="w-full rounded-md border border-outline-variant bg-surface px-2 py-2 text-sm text-on-surface"
          />
        </label>
      </div>
      <div className="flex gap-2">
        <SubmitButton />
        {monthlyAmount != null && (
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            formAction={async (fd: FormData) => {
              fd.set("monthlyEmitemwaAmount", "");
              fd.set("goodSamaritanDayAmount", "");
            }}
          >
            Reset to vicariate rates
          </Button>
        )}
      </div>
    </form>
  );
}
