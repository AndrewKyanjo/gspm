"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { AkabondoActionState } from "@/features/akabondo/actions";
import type { AkabondoOption, SubParishOption } from "@/features/akabondo/types";
import { Button } from "@/components/ui/button";

type Props = {
  action: (previousState: AkabondoActionState, formData: FormData) => Promise<AkabondoActionState>;
  parishId?: string;
  subParishes: SubParishOption[];
  akabondos: AkabondoOption[];
};

const initialState: AkabondoActionState = { error: null, success: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Saving" : "Save evaluation"}</Button>;
}

function Checkbox({ name, label }: { name: string; label: string }) {
  return (
    <label className="flex items-center gap-2 rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface">
      <input type="checkbox" name={name} className="h-4 w-4 rounded border-outline-variant text-primary" />
      <span>{label}</span>
    </label>
  );
}

export function AkabondoEvaluationForm({ action, parishId, subParishes, akabondos }: Props) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-6 rounded-lg border border-outline-variant bg-surface-container-lowest p-5">
      {parishId ? <input type="hidden" name="parishId" value={parishId} /> : null}
      {state.error ? <div className="rounded-md bg-error-container p-3 text-sm text-on-error-container">{state.error}</div> : null}
      {state.success ? <div className="rounded-md bg-emerald-100 p-3 text-sm text-emerald-900">{state.success}</div> : null}

      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">AKABONDO</p>
        <p className="mt-1 text-xs text-on-surface-variant">Use this page for one evaluation form entry at a time.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="space-y-1 text-sm font-medium text-on-surface">
          <span>SUB PARISH</span>
          <input name="subParishName" list="sub-parishes" required className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm" />
        </label>
        <label className="space-y-1 text-sm font-medium text-on-surface">
          <span>AKABONDO</span>
          <input name="akabondoName" list="akabondos" required className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm" />
        </label>
        <label className="space-y-1 text-sm font-medium text-on-surface">
          <span>PARISH</span>
          <input value={parishId ? "Selected parish" : "Current parish"} readOnly className="w-full rounded-md border border-outline-variant bg-surface-container px-3 py-2 text-sm" />
        </label>
      </div>

      <datalist id="sub-parishes">
        {subParishes.map((item) => <option key={item.id} value={item.name} />)}
      </datalist>
      <datalist id="akabondos">
        {akabondos.map((item) => <option key={item.id} value={item.name} />)}
      </datalist>

      <section className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm font-medium text-on-surface">
          <span>1. Name (ERINNYA)</span>
          <input name="personName" required className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm" />
        </label>
        <label className="space-y-1 text-sm font-medium text-on-surface">
          <span>2. Age (EMYAKA)</span>
          <input name="age" type="number" min={0} max={130} className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm" />
        </label>
        <label className="space-y-1 text-sm font-medium text-on-surface">
          <span>3. Gender (MWAMI OBA MUKYALA)</span>
          <select name="gender" defaultValue="unknown" className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm">
            <option value="unknown">Unknown</option>
            <option value="male">Male / Mwami</option>
            <option value="female">Female / Mukyala</option>
          </select>
        </label>
        <label className="space-y-1 text-sm font-medium text-on-surface">
          <span>4. Contact Number (ESSIMU)</span>
          <input name="contactNumber" className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm" />
        </label>
        <label className="space-y-1 text-sm font-medium text-on-surface md:col-span-2">
          <span>5. Village (EKYALO)</span>
          <input name="village" className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm" />
        </label>
      </section>

      <section className="space-y-3">
        <p className="text-sm font-semibold text-on-surface">6. Challenge (OBUZIBU BWE)</p>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          <Checkbox name="challengeSick" label="a. Sick (BULWADDE)" />
          <Checkbox name="challengeAged" label="b. Aged (BUKADDE)" />
          <Checkbox name="challengeUnemployed" label="c. Unemployed (TALINA MULIMU)" />
          <Checkbox name="challengeDisabled" label="d. Disabled (MULEMA)" />
        </div>
        <label className="space-y-1 text-sm font-medium text-on-surface">
          <span>e. Other (EKIRALA)</span>
          <input name="challengeOther" className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm" />
        </label>
      </section>

      <section className="space-y-3">
        <p className="text-sm font-semibold text-on-surface">
          7. What type of assistance do you need? BUYAMBI KI BWEYEETAAGA?
        </p>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          <Checkbox name="assistanceFood" label="a. Food (EMMERE)" />
          <Checkbox name="assistanceShelter" label="b. Shelter (AWOKUSULA)" />
          <Checkbox name="assistanceBedding" label="c. Bedding (EBYOKWEBIKA)" />
          <Checkbox name="assistanceClothing" label="d. Clothing (ENGOYE)" />
          <Checkbox name="assistanceMedical" label="e. Medical (EDDAGALA)" />
          <Checkbox name="assistanceEducation" label="f. Education (OKUSOMA)" />
          <Checkbox name="assistanceFinancial" label="g. Financial (ESENTE)" />
        </div>
        <label className="space-y-1 text-sm font-medium text-on-surface">
          <span>h. Others (EKIRALA - KINYONYLE)</span>
          <input name="assistanceOther" className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm" />
        </label>
      </section>

      <label className="space-y-1 text-sm font-medium text-on-surface">
        <span>8. Additional Information (EKIRALA KYOYAGALA OKUGATAKO)</span>
        <textarea name="additionalInformation" rows={4} className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm" />
      </label>

      <label className="space-y-1 text-sm font-medium text-on-surface">
        <span>Evaluation date</span>
        <input name="evaluatedOn" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm md:w-64" />
      </label>

      <SubmitButton />
    </form>
  );
}
