"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createVicariate, type ArchdioceseActionState } from "@/features/archdiocese/actions";
import { Button } from "@/components/ui/button";

const initialState: ArchdioceseActionState = { error: null };
const inputClass = "w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface";

function SubmitButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Creating..." : "Create vicariate"}</Button>;
}

export function VicariateCreateForm() {
  const [state, action] = useActionState(createVicariate, initialState);

  return (
    <form action={action} className="grid gap-4 rounded-md border border-outline-variant bg-surface-container-lowest p-5 md:grid-cols-5">
      <div className="md:col-span-5">
        <h2 className="text-base font-semibold text-on-surface">Create vicariate</h2>
        <p className="mt-1 text-sm text-on-surface-variant">Set the Emitemwa and Good Samaritan Day rates when creating the vicariate.</p>
      </div>
      {state.error ? (
        <div className="rounded-md bg-error-container p-3 text-sm text-on-error-container md:col-span-5">{state.error}</div>
      ) : null}
      <label className="space-y-2 md:col-span-2">
        <span className="block text-sm font-medium text-on-surface">Name</span>
        <input name="name" required className={inputClass} />
      </label>
      <label className="space-y-2">
        <span className="block text-sm font-medium text-on-surface">Code</span>
        <input name="code" className={inputClass} />
      </label>
      <label className="space-y-2">
        <span className="block text-sm font-medium text-on-surface">Monthly rate</span>
        <input name="monthlyEmitemwaAmount" type="number" min={0} step={1} defaultValue={50000} className={inputClass} />
      </label>
      <label className="space-y-2">
        <span className="block text-sm font-medium text-on-surface">Good Samaritan Day</span>
        <input name="goodSamaritanDayAmount" type="number" min={0} step={1} defaultValue={250000} className={inputClass} />
      </label>
      <div className="md:col-span-5">
        <SubmitButton />
      </div>
    </form>
  );
}
