"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { bulkCreateProjects } from "@/features/projects/actions";
import type { ArchdioceseParishOverview } from "@/features/archdiocese/types";
import { Button } from "@/components/ui/button";

type Props = {
  archdioceseId: string;
  parishes: ArchdioceseParishOverview[];
};

export function CreateProjectForm({ archdioceseId, parishes }: Props) {
  const router = useRouter();
  const [parishId, setParishId] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("planned");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [targetEndDate, setTargetEndDate] = useState("");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [amountRaised, setAmountRaised] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const selectedParish = parishes.find((p) => p.id === parishId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!parishId) { setError("Please select a parish."); return; }
    if (!title.trim()) { setError("Project title is required."); return; }

    setLoading(true);
    const result = await bulkCreateProjects({
      archdioceseId,
      records: [
        {
          parishId,
          vicariateId: selectedParish?.vicariateId ?? "",
          deaneryId: selectedParish?.deaneryId ?? "",
          title: title.trim(),
          category: category.trim() || undefined,
          status,
          location: location.trim() || undefined,
          description: description.trim() || undefined,
          startDate: startDate || undefined,
          targetEndDate: targetEndDate || undefined,
          budgetAmount: budgetAmount ? parseFloat(budgetAmount) : undefined,
          amountRaised: amountRaised ? parseFloat(amountRaised) : undefined,
          sourceChannel: "system",
        },
      ],
    });

    if (result.errors.length > 0) {
      setError(result.errors.map((e) => `Row ${e.row}: ${e.message}`).join("; "));
      setLoading(false);
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push("/dashboard/archdiocese/projects"), 1000);
  }

  if (success) {
    return (
      <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-8 text-center">
        <span className="material-symbols-outlined text-4xl text-primary mb-2">
          check_circle
        </span>
        <h3 className="text-lg font-semibold text-on-surface mt-3">
          Project created
        </h3>
        <p className="text-sm text-on-surface-variant mt-2">
          Redirecting to projects list…
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {error && (
        <div className="rounded-lg bg-error-container p-3 text-sm text-on-error-container">
          {error}
        </div>
      )}

      {/* Parish selector */}
      <div className="space-y-1">
        <label htmlFor="parish" className="text-sm font-medium text-on-surface block">
          Parish
        </label>
        <select
          id="parish"
          value={parishId}
          onChange={(e) => setParishId(e.target.value)}
          required
          className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 text-base focus:ring-2 focus:ring-primary focus:border-primary transition-all appearance-none"
        >
          <option value="" disabled>Select a parish</option>
          {parishes.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.deaneryName ?? "?"} • {p.vicariateName ?? "?"})
            </option>
          ))}
        </select>
        {selectedParish && (
          <p className="text-xs text-on-surface-variant mt-1">
            Deanery: {selectedParish.deaneryName ?? "N/A"} • Vicariate: {selectedParish.vicariateName ?? "N/A"}
          </p>
        )}
      </div>

      {/* Title */}
      <div className="space-y-1">
        <label htmlFor="title" className="text-sm font-medium text-on-surface block">
          Project Title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Chapel Roof Restoration"
          required
          className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 text-base focus:ring-2 focus:ring-primary focus:border-primary transition-all"
        />
      </div>

      {/* Category + Status */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="category" className="text-sm font-medium text-on-surface block">
            Category <span className="text-on-surface-variant font-normal">(optional)</span>
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 text-base focus:ring-2 focus:ring-primary focus:border-primary transition-all appearance-none"
          >
            <option value="">Select category</option>
            <option value="infrastructure">Infrastructure</option>
            <option value="pastoral">Pastoral</option>
            <option value="education">Education</option>
            <option value="health">Health</option>
            <option value="social_services">Social Services</option>
            <option value="evangelization">Evangelization</option>
            <option value="youth">Youth</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="status" className="text-sm font-medium text-on-surface block">
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 text-base focus:ring-2 focus:ring-primary focus:border-primary transition-all appearance-none"
          >
            <option value="planned">Planned</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="delayed">Delayed</option>
          </select>
        </div>
      </div>

      {/* Location */}
      <div className="space-y-1">
        <label htmlFor="location" className="text-sm font-medium text-on-surface block">
          Location <span className="text-on-surface-variant font-normal">(optional)</span>
        </label>
        <input
          id="location"
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. Kampala, Uganda"
          className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 text-base focus:ring-2 focus:ring-primary focus:border-primary transition-all"
        />
      </div>

      {/* Description */}
      <div className="space-y-1">
        <label htmlFor="description" className="text-sm font-medium text-on-surface block">
          Description <span className="text-on-surface-variant font-normal">(optional)</span>
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the project scope, objectives, and expected outcomes…"
          rows={4}
          className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 text-base focus:ring-2 focus:ring-primary focus:border-primary transition-all"
        />
      </div>

      {/* Dates */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="startDate" className="text-sm font-medium text-on-surface block">
            Start Date <span className="text-on-surface-variant font-normal">(optional)</span>
          </label>
          <input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 text-base focus:ring-2 focus:ring-primary focus:border-primary transition-all"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="targetEndDate" className="text-sm font-medium text-on-surface block">
            Target End Date <span className="text-on-surface-variant font-normal">(optional)</span>
          </label>
          <input
            id="targetEndDate"
            type="date"
            value={targetEndDate}
            onChange={(e) => setTargetEndDate(e.target.value)}
            className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 text-base focus:ring-2 focus:ring-primary focus:border-primary transition-all"
          />
        </div>
      </div>

      {/* Budget */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="budgetAmount" className="text-sm font-medium text-on-surface block">
            Budget Amount <span className="text-on-surface-variant font-normal">(optional)</span>
          </label>
          <input
            id="budgetAmount"
            type="number"
            min="0"
            step="any"
            value={budgetAmount}
            onChange={(e) => setBudgetAmount(e.target.value)}
            placeholder="0"
            className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 text-base focus:ring-2 focus:ring-primary focus:border-primary transition-all"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="amountRaised" className="text-sm font-medium text-on-surface block">
            Amount Raised <span className="text-on-surface-variant font-normal">(optional)</span>
          </label>
          <input
            id="amountRaised"
            type="number"
            min="0"
            step="any"
            value={amountRaised}
            onChange={(e) => setAmountRaised(e.target.value)}
            placeholder="0"
            className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 text-base focus:ring-2 focus:ring-primary focus:border-primary transition-all"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "Creating…" : "Create Project"}
        </Button>
        <Button href="/dashboard/archdiocese/projects" variant="secondary">
          Cancel
        </Button>
      </div>
    </form>
  );
}
