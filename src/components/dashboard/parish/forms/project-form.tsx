"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { createParishProject, type ParishProjectFormState } from "@/features/parish/projects/actions";

const initialState: ParishProjectFormState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Create project"}</Button>;
}

export function ProjectForm() {
  const [state, action] = useActionState(createParishProject, initialState);

  return (
    <form action={action} className="space-y-6">
      {state.error ? (
        <div className="rounded-md bg-error-container p-3 text-sm text-on-error-container">{state.error}</div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 md:col-span-2">
          <span className="block text-sm font-medium text-on-surface">Project title</span>
          <input
            name="title"
            className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface"
          />
        </label>

        <label className="space-y-2">
          <span className="block text-sm font-medium text-on-surface">Category</span>
          <input
            name="category"
            placeholder="Construction, outreach, education"
            className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface"
          />
        </label>

        <label className="space-y-2">
          <span className="block text-sm font-medium text-on-surface">Status</span>
          <select
            name="status"
            defaultValue="planned"
            className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface"
          >
            <option value="planned">Planned</option>
            <option value="active">Active</option>
            <option value="on_hold">On hold</option>
            <option value="completed">Completed</option>
          </select>
        </label>

        <label className="space-y-2">
          <span className="block text-sm font-medium text-on-surface">Location</span>
          <input
            name="location"
            className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface"
          />
        </label>

        <label className="space-y-2">
          <span className="block text-sm font-medium text-on-surface">Cover image</span>
          <input
            name="coverImage"
            type="file"
            accept="image/*"
            className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface"
          />
        </label>

        <label className="space-y-2">
          <span className="block text-sm font-medium text-on-surface">Start date</span>
          <input
            name="startDate"
            type="date"
            className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface"
          />
        </label>

        <label className="space-y-2">
          <span className="block text-sm font-medium text-on-surface">Target end date</span>
          <input
            name="targetEndDate"
            type="date"
            className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface"
          />
        </label>

        <label className="space-y-2">
          <span className="block text-sm font-medium text-on-surface">Budget amount</span>
          <input
            name="budgetAmount"
            type="number"
            min={0}
            step="0.01"
            className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface"
          />
        </label>

        <label className="space-y-2">
          <span className="block text-sm font-medium text-on-surface">Amount raised</span>
          <input
            name="amountRaised"
            type="number"
            min={0}
            step="0.01"
            className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface"
          />
        </label>
      </div>

      <label className="space-y-2">
        <span className="block text-sm font-medium text-on-surface">Description</span>
        <textarea
          name="description"
          rows={6}
          className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface"
        />
      </label>

      <SubmitButton />
    </form>
  );
}
