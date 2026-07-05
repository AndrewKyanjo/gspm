"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { recordParishContribution, type ParishContributionFormState } from "@/features/parish/contributions/actions";
import { Button } from "@/components/ui/button";

const initialState: ParishContributionFormState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Record contribution"}</Button>;
}

export function ContributionForm() {
  const [state, action] = useActionState(recordParishContribution, initialState);

  return (
    <form action={action} className="space-y-6">
      {state.error ? (
        <div className="rounded-md bg-error-container p-3 text-sm text-on-error-container">{state.error}</div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="block text-sm font-medium text-on-surface">Contributor</span>
          <input name="contributorName" className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface" />
        </label>
        <label className="space-y-2">
          <span className="block text-sm font-medium text-on-surface">Contribution type</span>
          <select
            name="contributionType"
            defaultValue="Sunday offering"
            className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface"
          >
            <option>Sunday offering</option>
            <option>Building fund</option>
            <option>Special donation</option>
            <option>Tithe</option>
            <option>Other</option>
          </select>
        </label>
        <label className="space-y-2">
          <span className="block text-sm font-medium text-on-surface">Amount</span>
          <input name="amount" type="number" min={0} step="0.01" className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface" />
        </label>
        <label className="space-y-2">
          <span className="block text-sm font-medium text-on-surface">Currency</span>
          <input name="currency" defaultValue="UGX" className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface" />
        </label>
        <label className="space-y-2">
          <span className="block text-sm font-medium text-on-surface">Date</span>
          <input name="contributedOn" type="date" className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface" />
        </label>
        <label className="space-y-2">
          <span className="block text-sm font-medium text-on-surface">Payment method</span>
          <input name="paymentMethod" placeholder="Cash, Mobile Money, Bank Transfer" className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface" />
        </label>
      </div>

      <label className="space-y-2">
        <span className="block text-sm font-medium text-on-surface">Reference number</span>
        <input name="referenceNumber" className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface" />
      </label>

      <label className="space-y-2">
        <span className="block text-sm font-medium text-on-surface">Notes</span>
        <textarea name="notes" rows={5} className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface" />
      </label>

      <SubmitButton />
    </form>
  );
}
