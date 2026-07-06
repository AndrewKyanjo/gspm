"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { createParishReport, type ParishReportFormState } from "@/features/parish/reports/actions";
import type { ReportingPeriod } from "@/features/parish/types";

const initialState: ParishReportFormState = { error: null };

function SubmitButtons() {
  const { pending } = useFormStatus();

  return (
    <div className="flex flex-wrap gap-3">
      <Button type="submit" name="intent" value="draft" disabled={pending} variant="secondary">
        Save draft
      </Button>
      <Button type="submit" name="intent" value="submit" disabled={pending}>
        Submit report
      </Button>
    </div>
  );
}

function NumberField({ label, name, defaultValue = 0 }: { label: string; name: string; defaultValue?: number }) {
  return (
    <label className="space-y-2">
      <span className="block text-sm font-medium text-on-surface">{label}</span>
      <input
        name={name}
        type="number"
        min={0}
        step="1"
        defaultValue={defaultValue}
        className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface"
      />
    </label>
  );
}

export function ReportForm({ reportingPeriods }: { reportingPeriods: ReportingPeriod[] }) {
  const [state, action] = useActionState(createParishReport, initialState);
  const openPeriods = reportingPeriods.filter((period) => period.isOpen);
  const selectedPeriod = openPeriods[0] ?? reportingPeriods[0] ?? null;

  return (
    <form action={action} className="space-y-6">
      {state.error ? (
        <div className="rounded-md bg-error-container p-3 text-sm text-on-error-container">{state.error}</div>
      ) : null}

      <label className="space-y-2">
        <span className="block text-sm font-medium text-on-surface">Reporting period</span>
        <select
          name="reportingPeriodId"
          defaultValue={selectedPeriod?.id}
          className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface"
        >
          {reportingPeriods.map((period) => (
            <option key={period.id} value={period.id}>
              {period.month}/{period.year} {period.isOpen ? "- open" : ""}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <NumberField label="Total households" name="totalHouseholds" />
        <NumberField label="Total beneficiaries" name="totalBeneficiaries" />
        <NumberField label="Male beneficiaries" name="maleBeneficiaries" />
        <NumberField label="Female beneficiaries" name="femaleBeneficiaries" />
        <NumberField label="Youth beneficiaries" name="youthBeneficiaries" />
        <NumberField label="Elderly beneficiaries" name="elderlyBeneficiaries" />
        <NumberField label="Cases opened" name="totalCasesOpened" />
        <NumberField label="Cases closed" name="totalCasesClosed" />
        <NumberField label="Donations received" name="totalDonationsReceived" />
        <NumberField label="Amount disbursed" name="totalAmountDisbursed" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {[
          ["summary", "Summary"],
          ["challenges", "Challenges"],
          ["recommendations", "Recommendations"],
        ].map(([name, label]) => (
          <label key={name} className="space-y-2">
            <span className="block text-sm font-medium text-on-surface">{label}</span>
            <textarea
              name={name}
              rows={6}
              className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface"
            />
          </label>
        ))}
      </div>

      <SubmitButtons />
    </form>
  );
}
