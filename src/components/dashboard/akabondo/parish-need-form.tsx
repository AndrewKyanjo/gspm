"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { AkabondoActionState } from "@/features/akabondo/actions";
import type { AssistanceType } from "@/features/akabondo/types";
import { Button } from "@/components/ui/button";

type Props = {
  action: (previousState: AkabondoActionState, formData: FormData) => Promise<AkabondoActionState>;
  parishId?: string;
  defaults?: {
    needType?: AssistanceType;
    title?: string;
    estimatedHouseholds?: number;
    priority?: "medium" | "high" | "urgent";
    source?: "manual" | "akabondo_analysis";
  };
};

const initialState: AkabondoActionState = { error: null, success: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Saving" : "Add parish need"}</Button>;
}

export function ParishNeedForm({ action, parishId, defaults }: Props) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4 rounded-lg border border-outline-variant bg-surface-container-lowest p-5">
      {parishId ? <input type="hidden" name="parishId" value={parishId} /> : null}
      <input type="hidden" name="source" value={defaults?.source ?? "manual"} />
      {state.error ? <div className="rounded-md bg-error-container p-3 text-sm text-on-error-container">{state.error}</div> : null}
      {state.success ? <div className="rounded-md bg-emerald-100 p-3 text-sm text-emerald-900">{state.success}</div> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm font-medium text-on-surface">
          <span>Need type</span>
          <select name="needType" defaultValue={defaults?.needType ?? "food"} className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm">
            <option value="food">Food</option>
            <option value="shelter">Shelter</option>
            <option value="bedding">Bedding</option>
            <option value="clothing">Clothing</option>
            <option value="medical">Medical</option>
            <option value="education">Education</option>
            <option value="financial">Financial</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="space-y-1 text-sm font-medium text-on-surface">
          <span>Priority</span>
          <select name="priority" defaultValue={defaults?.priority ?? "medium"} className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </label>
      </div>
      <label className="space-y-1 text-sm font-medium text-on-surface">
        <span>Title</span>
        <input name="title" defaultValue={defaults?.title ?? ""} required className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm" />
      </label>
      <label className="space-y-1 text-sm font-medium text-on-surface">
        <span>Description</span>
        <textarea name="description" rows={3} className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm" />
      </label>
      <label className="space-y-1 text-sm font-medium text-on-surface">
        <span>Estimated households / people affected</span>
        <input name="estimatedHouseholds" type="number" min={0} defaultValue={defaults?.estimatedHouseholds ?? ""} className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm md:w-64" />
      </label>
      <SubmitButton />
    </form>
  );
}
