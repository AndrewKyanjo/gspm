"use client";

// src/components/forms/ScopeSelector.tsx
//
// Cascading Vicariate → Deanery → Parish picker for proxy data entry.
// Used by both single-entry forms and the bulk-entry grid to let archdiocese
// (and vicariate/deanery) staff select which parish they are entering data
// on behalf of.
//
// Relies on getHierarchyCollections() / buildHierarchyMaps() being called
// server-side and the resolved data passed down as props — this component
// is pure client-side rendering of the already-fetched hierarchy.

import { useMemo, useCallback, useId } from "react";

// ---------------------------------------------------------------------------
// Types (kept local so the component is self-contained)
// ---------------------------------------------------------------------------

type HierarchyUnit = {
  id: string;
  name: string;
};

export type ScopeSelectorData = {
  vicariates: HierarchyUnit[];
  deaneriesByVicariate: Map<string, HierarchyUnit[]>;
  parishesByDeanery: Map<string, HierarchyUnit[]>;
};

export type SelectedScope = {
  vicariateId: string | null;
  vicariateName: string | null;
  deaneryId: string | null;
  deaneryName: string | null;
  parishId: string | null;
  parishName: string | null;
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type ScopeSelectorProps = {
  /** Pre-fetched hierarchy data (server-side). */
  data: ScopeSelectorData;
  /** Currently selected scope (for controlled usage). */
  value: SelectedScope;
  /** Called whenever a dropdown changes. */
  onChange: (scope: SelectedScope) => void;
  /** Hide the parish-level dropdown? (e.g. for deanery-level proxy entry) */
  hideParish?: boolean;
  /** Is the selector disabled? */
  disabled?: boolean;
  /** Optional label above the selectors. */
  label?: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sortedByName(units: HierarchyUnit[]): HierarchyUnit[] {
  return [...units].sort((a, b) => a.name.localeCompare(b.name));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ScopeSelector({
  data,
  value,
  onChange,
  hideParish = false,
  disabled = false,
  label = "Select parish",
}: ScopeSelectorProps) {
  const vicariateId = useId();
  const deaneryId = useId();
  const parishId = useId();

  const vicariates = useMemo(
    () => sortedByName(data.vicariates),
    [data.vicariates],
  );

  const deaneries = useMemo(() => {
    if (!value.vicariateId) return [];
    return sortedByName(
      data.deaneriesByVicariate.get(value.vicariateId) ?? [],
    );
  }, [data.deaneriesByVicariate, value.vicariateId]);

  const parishes = useMemo(() => {
    if (!value.deaneryId) return [];
    return sortedByName(
      data.parishesByDeanery.get(value.deaneryId) ?? [],
    );
  }, [data.parishesByDeanery, value.deaneryId]);

  const handleVicariateChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const id = e.target.value || null;
      const name = id
        ? vicariates.find((v) => v.id === id)?.name ?? null
        : null;
      onChange({
        vicariateId: id,
        vicariateName: name,
        deaneryId: null,
        deaneryName: null,
        parishId: null,
        parishName: null,
      });
    },
    [vicariates, onChange],
  );

  const handleDeaneryChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const id = e.target.value || null;
      const name = id
        ? deaneries.find((d) => d.id === id)?.name ?? null
        : null;
      onChange({
        ...value,
        deaneryId: id,
        deaneryName: name,
        parishId: null,
        parishName: null,
      });
    },
    [deaneries, value, onChange],
  );

  const handleParishChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const id = e.target.value || null;
      const name = id
        ? parishes.find((p) => p.id === id)?.name ?? null
        : null;
      onChange({
        ...value,
        parishId: id,
        parishName: name,
      });
    },
    [parishes, value, onChange],
  );

  const selectClasses =
    "block w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <fieldset disabled={disabled} className="space-y-2">
      {label && (
        <legend className="text-sm font-medium text-on-surface">
          {label}
        </legend>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        {/* Vicariate */}
        <div className="flex-1">
          <label
            htmlFor={vicariateId}
            className="mb-1 block text-xs text-on-surface-variant"
          >
            Vicariate
          </label>
          <select
            id={vicariateId}
            value={value.vicariateId ?? ""}
            onChange={handleVicariateChange}
            className={selectClasses}
          >
            <option value="">— Select vicariate —</option>
            {vicariates.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>

        {/* Deanery */}
        <div className="flex-1">
          <label
            htmlFor={deaneryId}
            className="mb-1 block text-xs text-on-surface-variant"
          >
            Deanery
          </label>
          <select
            id={deaneryId}
            value={value.deaneryId ?? ""}
            onChange={handleDeaneryChange}
            disabled={!value.vicariateId}
            className={selectClasses}
          >
            <option value="">— Select deanery —</option>
            {deaneries.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Parish */}
        {!hideParish && (
          <div className="flex-1">
            <label
              htmlFor={parishId}
              className="mb-1 block text-xs text-on-surface-variant"
            >
              Parish
            </label>
            <select
              id={parishId}
              value={value.parishId ?? ""}
              onChange={handleParishChange}
              disabled={!value.deaneryId}
              className={selectClasses}
            >
              <option value="">— Select parish —</option>
              {parishes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </fieldset>
  );
}
