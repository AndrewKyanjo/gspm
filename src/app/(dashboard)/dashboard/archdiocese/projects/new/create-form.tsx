"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createContributionProject, type ContributionActionState } from "@/features/contributions/actions";
import { Button } from "@/components/ui/button";

type Option = { id: string; name: string; vicariateId?: string; deaneryId?: string };

type Props = {
  vicariates: Option[];
  deaneries: Option[];
  parishes: Option[];
};

const initialState: ContributionActionState = { error: null };
const inputClass = "w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface";

function SubmitButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Creating..." : "Create scoped project"}</Button>;
}

export function CreateProjectForm({ vicariates, deaneries, parishes }: Props) {
  const [state, action] = useActionState(createContributionProject, initialState);

  return (
    <form action={action} className="max-w-3xl space-y-6">
      {state.error ? (
        <div className="rounded-md bg-error-container p-3 text-sm text-on-error-container">{state.error}</div>
      ) : null}
      <input type="hidden" name="returnTo" value="/dashboard/archdiocese/projects" />

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 md:col-span-2">
          <span className="block text-sm font-medium text-on-surface">Project name</span>
          <input name="name" required placeholder="Fundraising run, wedding support, parish campaign" className={inputClass} />
        </label>
        <label className="space-y-2">
          <span className="block text-sm font-medium text-on-surface">Target amount</span>
          <input name="targetAmount" type="number" min={0} step={1} className={inputClass} />
        </label>
        <label className="space-y-2">
          <span className="block text-sm font-medium text-on-surface">Status</span>
          <select name="status" defaultValue="active" className={inputClass}>
            <option value="planned">Planned</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
        <label className="space-y-2">
          <span className="block text-sm font-medium text-on-surface">Start date</span>
          <input name="startDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className={inputClass} />
        </label>
        <label className="space-y-2">
          <span className="block text-sm font-medium text-on-surface">End date</span>
          <input name="endDate" type="date" className={inputClass} />
        </label>
      </div>

      <label className="space-y-2 block">
        <span className="block text-sm font-medium text-on-surface">Description</span>
        <textarea name="description" rows={4} className={inputClass} />
      </label>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="space-y-2">
          <span className="block text-sm font-medium text-on-surface">Scope</span>
          <select name="scopeLevel" defaultValue="archdiocese" className={inputClass}>
            <option value="archdiocese">Archdiocese-wide</option>
            <option value="vicariate">Single vicariate</option>
            <option value="deanery">Single deanery</option>
            <option value="parishes">Selected parishes</option>
          </select>
        </label>
        <label className="space-y-2">
          <span className="block text-sm font-medium text-on-surface">Vicariate scope</span>
          <select name="scopeVicariateId" className={inputClass}>
            <option value="">Choose when scope is vicariate</option>
            {vicariates.map((vicariate) => (
              <option key={vicariate.id} value={vicariate.id}>{vicariate.name}</option>
            ))}
          </select>
        </label>
        <label className="space-y-2">
          <span className="block text-sm font-medium text-on-surface">Deanery scope</span>
          <select name="scopeDeaneryId" className={inputClass}>
            <option value="">Choose when scope is deanery</option>
            {deaneries.map((deanery) => (
              <option key={deanery.id} value={deanery.id}>{deanery.name}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="space-y-2">
        <span className="block text-sm font-medium text-on-surface">Selected parish scope</span>
        <div className="grid max-h-72 gap-2 overflow-y-auto rounded-md border border-outline-variant bg-surface-container-lowest p-3 md:grid-cols-2">
          {parishes.map((parish) => (
            <label key={parish.id} className="flex items-center gap-2 text-sm text-on-surface">
              <input type="checkbox" name="scopeParishIds" value={parish.id} />
              <span>{parish.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <SubmitButton />
        <Button href="/dashboard/archdiocese/projects" variant="secondary">Cancel</Button>
      </div>
    </form>
  );
}
