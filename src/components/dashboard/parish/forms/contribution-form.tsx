"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  recordMandatoryContribution,
  recordProjectContribution,
  type ContributionActionState,
} from "@/features/contributions/actions";
import type { ParishContributionProject } from "@/features/contributions/types";
import { Button } from "@/components/ui/button";

const initialState: ContributionActionState = { error: null };

function SubmitButton({ children }: { children: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : children}
    </Button>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="block text-sm font-medium text-on-surface">{children}</span>;
}

const inputClass =
  "w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface";

export function MandatoryContributionForm({
  parishId,
  year,
  returnTo,
}: {
  parishId?: string;
  year: number;
  returnTo: string;
}) {
  const [state, action] = useActionState(recordMandatoryContribution, initialState);

  return (
    <form action={action} className="space-y-5">
      {state.error ? (
        <div className="rounded-md bg-error-container p-3 text-sm text-on-error-container">{state.error}</div>
      ) : null}
      {parishId ? <input type="hidden" name="parishId" value={parishId} /> : null}
      <input type="hidden" name="returnTo" value={returnTo} />
      <input type="hidden" name="sourceChannel" value="system" />

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <FieldLabel>Payment type</FieldLabel>
          <select name="paymentKind" defaultValue="monthly" className={inputClass}>
            <option value="monthly">Monthly Emitemwa</option>
            <option value="good_samaritan_day">Good Samaritan Day</option>
          </select>
        </label>
        <label className="space-y-2">
          <FieldLabel>Year</FieldLabel>
          <input name="contributionYear" type="number" defaultValue={year} min={2000} max={2100} className={inputClass} />
        </label>
        <label className="space-y-2">
          <FieldLabel>Month</FieldLabel>
          <select name="contributionMonth" defaultValue={new Date().getUTCMonth() + 1} className={inputClass}>
            {[
              "January",
              "February",
              "March",
              "April",
              "May",
              "June",
              "July",
              "August",
              "September",
              "October",
              "November",
              "December",
            ].map((label, index) => (
              <option key={label} value={index + 1}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2">
          <FieldLabel>Amount</FieldLabel>
          <input name="amount" type="number" min={1} step="1" className={inputClass} />
        </label>
        <label className="space-y-2">
          <FieldLabel>Payment date</FieldLabel>
          <input name="paidOn" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className={inputClass} />
        </label>
        <label className="space-y-2">
          <FieldLabel>Currency</FieldLabel>
          <input name="currency" defaultValue="UGX" className={inputClass} />
        </label>
        <label className="space-y-2">
          <FieldLabel>Payment method</FieldLabel>
          <input name="paymentMethod" placeholder="Cash, Mobile Money, Bank Transfer" className={inputClass} />
        </label>
        <label className="space-y-2">
          <FieldLabel>Reference number</FieldLabel>
          <input name="referenceNumber" className={inputClass} />
        </label>
      </div>

      <label className="space-y-2">
        <FieldLabel>Notes</FieldLabel>
        <textarea name="notes" rows={4} className={inputClass} />
      </label>

      <SubmitButton>Save mandatory payment</SubmitButton>
    </form>
  );
}

export function ProjectContributionForm({
  parishId,
  projects,
  returnTo,
}: {
  parishId?: string;
  projects: ParishContributionProject[];
  returnTo: string;
}) {
  const [state, action] = useActionState(recordProjectContribution, initialState);

  return (
    <form action={action} className="space-y-5">
      {state.error ? (
        <div className="rounded-md bg-error-container p-3 text-sm text-on-error-container">{state.error}</div>
      ) : null}
      {parishId ? <input type="hidden" name="parishId" value={parishId} /> : null}
      <input type="hidden" name="returnTo" value={returnTo} />
      <input type="hidden" name="sourceChannel" value="system" />

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 md:col-span-2">
          <FieldLabel>Project</FieldLabel>
          <select name="projectId" className={inputClass} disabled={projects.length === 0}>
            {projects.length === 0 ? <option>No active projects available</option> : null}
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2">
          <FieldLabel>Amount</FieldLabel>
          <input name="amount" type="number" min={1} step="1" className={inputClass} />
        </label>
        <label className="space-y-2">
          <FieldLabel>Payment date</FieldLabel>
          <input name="paidOn" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className={inputClass} />
        </label>
        <label className="space-y-2">
          <FieldLabel>Currency</FieldLabel>
          <input name="currency" defaultValue="UGX" className={inputClass} />
        </label>
        <label className="space-y-2">
          <FieldLabel>Payment method</FieldLabel>
          <input name="paymentMethod" placeholder="Cash, Mobile Money, Bank Transfer" className={inputClass} />
        </label>
      </div>

      <label className="space-y-2">
        <FieldLabel>Reference number</FieldLabel>
        <input name="referenceNumber" className={inputClass} />
      </label>

      <label className="space-y-2">
        <FieldLabel>Notes</FieldLabel>
        <textarea name="notes" rows={4} className={inputClass} />
      </label>

      <SubmitButton>Save project contribution</SubmitButton>
    </form>
  );
}

export function ContributionForm() {
  return (
    <MandatoryContributionForm
      year={new Date().getUTCFullYear()}
      returnTo="/dashboard/parish/contributions"
    />
  );
}
