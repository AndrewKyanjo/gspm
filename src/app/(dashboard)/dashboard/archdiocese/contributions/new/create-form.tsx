"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { bulkCreateContributions } from "@/features/contributions/actions";
import type { ArchdioceseParishOverview } from "@/features/archdiocese/types";
import { Button } from "@/components/ui/button";

type Props = {
  archdioceseId: string;
  parishes: ArchdioceseParishOverview[];
};

export function CreateContributionForm({ archdioceseId, parishes }: Props) {
  const router = useRouter();
  const [parishId, setParishId] = useState("");
  const [contributorName, setContributorName] = useState("");
  const [contributionType, setContributionType] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("UGX");
  const [contributedOn, setContributedOn] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [paymentMethod, setPaymentMethod] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const selectedParish = parishes.find((p) => p.id === parishId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!parishId) { setError("Please select a parish."); return; }
    if (!contributorName.trim()) { setError("Contributor name is required."); return; }
    if (!contributionType.trim()) { setError("Contribution type is required."); return; }
    const amt = parseFloat(amount);
    if (!Number.isFinite(amt) || amt <= 0) { setError("Amount must be a positive number."); return; }
    if (!contributedOn) { setError("Contribution date is required."); return; }

    setLoading(true);
    const result = await bulkCreateContributions({
      archdioceseId,
      records: [
        {
          parishId,
          vicariateId: selectedParish?.vicariateId ?? "",
          deaneryId: selectedParish?.deaneryId ?? "",
          contributorName: contributorName.trim(),
          contributionType: contributionType.trim(),
          amount: amt,
          currency,
          contributedOn,
          paymentMethod: paymentMethod.trim() || undefined,
          referenceNumber: referenceNumber.trim() || undefined,
          notes: notes.trim() || undefined,
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
    setTimeout(() => router.push("/dashboard/archdiocese/contributions"), 1000);
  }

  if (success) {
    return (
      <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-8 text-center">
        <span className="material-symbols-outlined text-4xl text-primary mb-2">
          check_circle
        </span>
        <h3 className="text-lg font-semibold text-on-surface mt-3">
          Contribution recorded
        </h3>
        <p className="text-sm text-on-surface-variant mt-2">
          Redirecting to contributions list…
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

      {/* Contributor name */}
      <div className="space-y-1">
        <label htmlFor="contributorName" className="text-sm font-medium text-on-surface block">
          Contributor Name
        </label>
        <input
          id="contributorName"
          type="text"
          value={contributorName}
          onChange={(e) => setContributorName(e.target.value)}
          placeholder="John Doe"
          required
          className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 text-base focus:ring-2 focus:ring-primary focus:border-primary transition-all"
        />
      </div>

      {/* Contribution type */}
      <div className="space-y-1">
        <label htmlFor="contributionType" className="text-sm font-medium text-on-surface block">
          Contribution Type
        </label>
        <select
          id="contributionType"
          value={contributionType}
          onChange={(e) => setContributionType(e.target.value)}
          required
          className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 text-base focus:ring-2 focus:ring-primary focus:border-primary transition-all appearance-none"
        >
          <option value="" disabled>Select type</option>
          <option value="tithe">Tithe</option>
          <option value="offering">Offering</option>
          <option value="donation">Donation</option>
          <option value="pledge">Pledge</option>
          <option value="special_collection">Special Collection</option>
          <option value="in_kind">In Kind</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Amount + Currency */}
      <div className="grid gap-4 sm:grid-cols-[1fr,auto]">
        <div className="space-y-1">
          <label htmlFor="amount" className="text-sm font-medium text-on-surface block">
            Amount
          </label>
          <input
            id="amount"
            type="number"
            min="0"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            required
            className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 text-base focus:ring-2 focus:ring-primary focus:border-primary transition-all"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="currency" className="text-sm font-medium text-on-surface block">
            Currency
          </label>
          <select
            id="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 text-base focus:ring-2 focus:ring-primary focus:border-primary transition-all appearance-none"
          >
            <option value="UGX">UGX</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
      </div>

      {/* Date */}
      <div className="space-y-1">
        <label htmlFor="contributedOn" className="text-sm font-medium text-on-surface block">
          Contribution Date
        </label>
        <input
          id="contributedOn"
          type="date"
          value={contributedOn}
          onChange={(e) => setContributedOn(e.target.value)}
          required
          className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 text-base focus:ring-2 focus:ring-primary focus:border-primary transition-all"
        />
      </div>

      {/* Payment method */}
      <div className="space-y-1">
        <label htmlFor="paymentMethod" className="text-sm font-medium text-on-surface block">
          Payment Method <span className="text-on-surface-variant font-normal">(optional)</span>
        </label>
        <select
          id="paymentMethod"
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 text-base focus:ring-2 focus:ring-primary focus:border-primary transition-all appearance-none"
        >
          <option value="">Select method (optional)</option>
          <option value="cash">Cash</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="mobile_money">Mobile Money</option>
          <option value="cheque">Cheque</option>
          <option value="in_kind">In Kind</option>
        </select>
      </div>

      {/* Reference number */}
      <div className="space-y-1">
        <label htmlFor="referenceNumber" className="text-sm font-medium text-on-surface block">
          Reference Number <span className="text-on-surface-variant font-normal">(optional)</span>
        </label>
        <input
          id="referenceNumber"
          type="text"
          value={referenceNumber}
          onChange={(e) => setReferenceNumber(e.target.value)}
          placeholder="e.g. receipt or transaction number"
          className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 text-base focus:ring-2 focus:ring-primary focus:border-primary transition-all"
        />
      </div>

      {/* Notes */}
      <div className="space-y-1">
        <label htmlFor="notes" className="text-sm font-medium text-on-surface block">
          Notes <span className="text-on-surface-variant font-normal">(optional)</span>
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any additional information…"
          rows={3}
          className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 text-base focus:ring-2 focus:ring-primary focus:border-primary transition-all"
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "Recording…" : "Record Contribution"}
        </Button>
        <Button href="/dashboard/archdiocese/contributions" variant="secondary">
          Cancel
        </Button>
      </div>
    </form>
  );
}
