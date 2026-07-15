"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  recordMandatoryContribution,
  recordProjectContribution,
  type ContributionActionState,
} from "@/features/contributions/actions";
import type { ArchdioceseParishOverview } from "@/features/archdiocese/types";
import type { ContributionProjectOverview } from "@/features/contributions/types";
import { Button } from "@/components/ui/button";

type Props = {
  parishes: ArchdioceseParishOverview[];
  projects: ContributionProjectOverview[];
};

const initialState: ContributionActionState = { error: null };
const inputClass = "w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Saving..." : label}</Button>;
}

function ParishSelect({ parishes }: { parishes: ArchdioceseParishOverview[] }) {
  return (
    <label className="space-y-2 md:col-span-2">
      <span className="block text-sm font-medium text-on-surface">Parish</span>
      <select name="parishId" required className={inputClass}>
        <option value="">Select parish</option>
        {parishes.map((parish) => (
          <option key={parish.id} value={parish.id}>
            {parish.name} ({parish.deaneryName ?? "Deanery"} - {parish.vicariateName ?? "Vicariate"})
          </option>
        ))}
      </select>
    </label>
  );
}

export function CreateContributionForm({ parishes, projects }: Props) {
  const [mandatoryState, mandatoryAction] = useActionState(recordMandatoryContribution, initialState);
  const [projectState, projectAction] = useActionState(recordProjectContribution, initialState);
  const year = new Date().getUTCFullYear();

  return (
    <section className="grid gap-6 xl:grid-cols-2">
      <form action={mandatoryAction} className="space-y-5 rounded-md border border-outline-variant bg-surface-container-lowest p-5">
        <div>
          <h2 className="text-base font-semibold text-on-surface">Mandatory payment</h2>
          <p className="mt-1 text-sm text-on-surface-variant">Record Emitemwa or Good Samaritan Day for any parish.</p>
        </div>
        {mandatoryState.error ? (
          <div className="rounded-md bg-error-container p-3 text-sm text-on-error-container">{mandatoryState.error}</div>
        ) : null}
        <input type="hidden" name="returnTo" value="/dashboard/archdiocese/contributions" />
        <input type="hidden" name="sourceChannel" value="system" />
        <div className="grid gap-4 md:grid-cols-2">
          <ParishSelect parishes={parishes} />
          <label className="space-y-2">
            <span className="block text-sm font-medium text-on-surface">Payment type</span>
            <select name="paymentKind" defaultValue="monthly" className={inputClass}>
              <option value="monthly">Monthly Emitemwa</option>
              <option value="good_samaritan_day">Good Samaritan Day</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="block text-sm font-medium text-on-surface">Year</span>
            <input name="contributionYear" type="number" defaultValue={year} min={2000} max={2100} className={inputClass} />
          </label>
          <label className="space-y-2">
            <span className="block text-sm font-medium text-on-surface">Month</span>
            <select name="contributionMonth" defaultValue={new Date().getUTCMonth() + 1} className={inputClass}>
              {Array.from({ length: 12 }, (_, index) => (
                <option key={index + 1} value={index + 1}>{index + 1}</option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="block text-sm font-medium text-on-surface">Amount</span>
            <input name="amount" type="number" min={1} step={1} required className={inputClass} />
          </label>
          <label className="space-y-2">
            <span className="block text-sm font-medium text-on-surface">Payment date</span>
            <input name="paidOn" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required className={inputClass} />
          </label>
          <label className="space-y-2">
            <span className="block text-sm font-medium text-on-surface">Currency</span>
            <input name="currency" defaultValue="UGX" className={inputClass} />
          </label>
        </div>
        <textarea name="notes" rows={3} placeholder="Notes" className={inputClass} />
        <SubmitButton label="Save mandatory payment" />
      </form>

      <form action={projectAction} className="space-y-5 rounded-md border border-outline-variant bg-surface-container-lowest p-5">
        <div>
          <h2 className="text-base font-semibold text-on-surface">Project payment</h2>
          <p className="mt-1 text-sm text-on-surface-variant">Record a parish contribution toward a scoped project.</p>
        </div>
        {projectState.error ? (
          <div className="rounded-md bg-error-container p-3 text-sm text-on-error-container">{projectState.error}</div>
        ) : null}
        <input type="hidden" name="returnTo" value="/dashboard/archdiocese/contributions" />
        <input type="hidden" name="sourceChannel" value="system" />
        <div className="grid gap-4 md:grid-cols-2">
          <ParishSelect parishes={parishes} />
          <label className="space-y-2 md:col-span-2">
            <span className="block text-sm font-medium text-on-surface">Project</span>
            <select name="projectId" required className={inputClass}>
              <option value="">Select project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name} ({project.scopeLevel})
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="block text-sm font-medium text-on-surface">Amount</span>
            <input name="amount" type="number" min={1} step={1} required className={inputClass} />
          </label>
          <label className="space-y-2">
            <span className="block text-sm font-medium text-on-surface">Payment date</span>
            <input name="paidOn" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required className={inputClass} />
          </label>
          <label className="space-y-2">
            <span className="block text-sm font-medium text-on-surface">Currency</span>
            <input name="currency" defaultValue="UGX" className={inputClass} />
          </label>
          <label className="space-y-2">
            <span className="block text-sm font-medium text-on-surface">Reference</span>
            <input name="referenceNumber" className={inputClass} />
          </label>
        </div>
        <textarea name="notes" rows={3} placeholder="Notes" className={inputClass} />
        <SubmitButton label="Save project payment" />
      </form>
    </section>
  );
}
