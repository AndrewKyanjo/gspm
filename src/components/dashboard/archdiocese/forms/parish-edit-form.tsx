"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { updateParish, type ParishActionState } from "@/features/archdiocese/parish-actions";
import type { Archdiocese, Deanery, Parish, Vicariate } from "@/types/hierarchy";

const initialState: ParishActionState = { status: "idle", message: "" };
const inputClass = "w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus-visible:outline-2 focus-visible:outline-primary";
const amountFormatter = new Intl.NumberFormat("en-UG", { maximumFractionDigits: 2 });

type Props = {
  parish: Parish;
  archdioceses: Archdiocese[];
  deaneries: Deanery[];
  vicariates: Vicariate[];
  canChangeArchdiocese: boolean;
};

export function ParishEditForm({ parish, archdioceses, deaneries, vicariates, canChangeArchdiocese }: Props) {
  const [state, action, pending] = useActionState(updateParish, initialState);
  const [name, setName] = useState(parish.name);
  const [archdioceseId, setArchdioceseId] = useState(parish.archdiocese_id);
  const [deaneryId, setDeaneryId] = useState(parish.deanery_id);
  const [monthlyAmount, setMonthlyAmount] = useState(String(parish.monthly_emitemwa_amount ?? ""));
  const [goodSamaritanAmount, setGoodSamaritanAmount] = useState(String(parish.good_samaritan_day_amount ?? ""));

  const selectedDeanery = deaneries.find((item) => item.id === deaneryId && item.archdiocese_id === archdioceseId);
  const selectedVicariate = vicariates.find((item) => item.id === selectedDeanery?.vicariate_id && item.archdiocese_id === archdioceseId);
  const selectedArchdiocese = archdioceses.find((item) => item.id === archdioceseId);
  const availableDeaneries = deaneries.filter((item) => {
    if (item.archdiocese_id !== archdioceseId) return false;
    const vicariate = vicariates.find((candidate) => candidate.id === item.vicariate_id && candidate.archdiocese_id === archdioceseId);
    if (!vicariate) return false;
    const isCurrent = item.id === parish.deanery_id && archdioceseId === parish.archdiocese_id;
    return isCurrent || (selectedArchdiocese?.status === "active" && item.status === "active" && vicariate.status === "active");
  });
  const availableArchdioceses = archdioceses.filter((item) => item.status === "active" || item.id === parish.archdiocese_id);
  const vicariateMonthly = Number(selectedVicariate?.monthly_emitemwa_amount ?? 50000);
  const vicariateGoodSamaritan = Number(selectedVicariate?.good_samaritan_day_amount ?? 250000);
  const effectiveMonthly = monthlyAmount.trim() === "" ? vicariateMonthly : Number(monthlyAmount);
  const validMonthly = Number.isFinite(effectiveMonthly) && effectiveMonthly >= 0;

  return (
    <form action={action} className="space-y-6" aria-busy={pending}>
      <input type="hidden" name="parishId" value={parish.id} />
      {state.message ? (
        <div
          role={state.status === "error" ? "alert" : "status"}
          className={`rounded-md p-3 text-sm ${state.status === "error" ? "bg-error-container text-on-error-container" : "bg-green-50 text-green-800"}`}
        >
          {state.message}
        </div>
      ) : null}

      <fieldset disabled={pending} className="space-y-6 disabled:opacity-70">
        <section className="space-y-5 rounded-lg border border-outline-variant bg-surface-container-lowest p-5">
          <div>
            <h2 className="text-base font-semibold text-on-surface">Parish details</h2>
            <p className="mt-1 text-sm text-on-surface-variant">Update the parish name and its place in the hierarchy.</p>
          </div>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-on-surface">Parish name</span>
            <input name="name" value={name} onChange={(event) => setName(event.target.value)} required maxLength={200} className={inputClass} />
          </label>
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-on-surface">Archdiocese</span>
              {canChangeArchdiocese ? (
                <select
                  name="archdioceseId"
                  value={archdioceseId}
                  onChange={(event) => {
                    setArchdioceseId(event.target.value);
                    setDeaneryId("");
                  }}
                  required
                  className={inputClass}
                >
                  {availableArchdioceses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              ) : (
                <>
                  <input type="hidden" name="archdioceseId" value={archdioceseId} />
                  <input readOnly value={archdioceses.find((item) => item.id === archdioceseId)?.name ?? "Current archdiocese"} className={inputClass} />
                </>
              )}
              {!canChangeArchdiocese ? <span className="block text-xs text-on-surface-variant">You can manage parishes within your archdiocese.</span> : null}
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-on-surface">Deanery</span>
              <select name="deaneryId" value={deaneryId} onChange={(event) => setDeaneryId(event.target.value)} required className={inputClass}>
                <option value="">Select a deanery</option>
                {availableDeaneries.map((item) => (
                  <option key={item.id} value={item.id}>{item.name} - {vicariates.find((vicariate) => vicariate.id === item.vicariate_id)?.name}</option>
                ))}
              </select>
              {!availableDeaneries.length ? <span className="block text-xs text-on-surface-variant">No active deaneries are available in this archdiocese.</span> : null}
            </label>
          </div>
          <p className="text-sm text-on-surface-variant">
            Vicariate: <strong className="text-on-surface">{selectedVicariate?.name ?? "Select a deanery"}</strong>. The vicariate follows the selected deanery.
          </p>
        </section>

        <section className="space-y-5 rounded-lg border border-outline-variant bg-surface-container-lowest p-5">
          <div>
            <h2 className="text-base font-semibold text-on-surface">Contribution rates</h2>
            <p id="parish-rate-help" className="mt-1 text-sm text-on-surface-variant">Leave a rate blank to inherit the selected vicariate&apos;s rate.</p>
          </div>
          {selectedVicariate ? (
            <p className="rounded-md bg-surface-container-low p-3 text-sm text-on-surface-variant">
              {selectedVicariate.name} defaults: <strong>{amountFormatter.format(vicariateMonthly)} UGX per month</strong> and <strong>{amountFormatter.format(vicariateGoodSamaritan)} UGX for Good Samaritan Day</strong>.
            </p>
          ) : null}
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-on-surface">Monthly Emitemwa (UGX)</span>
              <input name="monthlyEmitemwaAmount" type="number" min={0} max={9999999999.99} step={0.01} value={monthlyAmount} onChange={(event) => setMonthlyAmount(event.target.value)} placeholder={selectedVicariate ? `Inherit ${vicariateMonthly}` : "Inherit from vicariate"} aria-describedby="parish-rate-help parish-annual-total" className={inputClass} />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-on-surface">Good Samaritan Day (UGX)</span>
              <input name="goodSamaritanDayAmount" type="number" min={0} max={9999999999.99} step={0.01} value={goodSamaritanAmount} onChange={(event) => setGoodSamaritanAmount(event.target.value)} placeholder={selectedVicariate ? `Inherit ${vicariateGoodSamaritan}` : "Inherit from vicariate"} aria-describedby="parish-rate-help" className={inputClass} />
            </label>
          </div>
          <p id="parish-annual-total" className="text-sm text-on-surface-variant" aria-live="polite">
            {selectedVicariate && validMonthly ? <><strong className="text-on-surface">{amountFormatter.format(effectiveMonthly)} UGX per month</strong> amounts to <strong className="text-on-surface">{amountFormatter.format(effectiveMonthly * 12)} UGX per year</strong> in Emitemwa. Good Samaritan Day is separate.</> : "Select a deanery and enter a valid monthly rate to see the annual Emitemwa total."}
          </p>
        </section>
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={pending || !selectedDeanery || !selectedVicariate}>{pending ? "Saving..." : "Save parish"}</Button>
          <Button href={`/dashboard/archdiocese/parishes/${parish.id}`} variant="secondary">Back to parish</Button>
        </div>
      </fieldset>
    </form>
  );
}
