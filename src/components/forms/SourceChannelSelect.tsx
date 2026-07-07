"use client";

// src/components/forms/SourceChannelSelect.tsx
//
// Dropdown for selecting the source channel in proxy data entry forms.
// Renders a styled <select> listing the six recognised channels.

import type { SourceChannel } from "@/features/contributions/types";

const CHANNELS: { value: SourceChannel; label: string }[] = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "facebook", label: "Facebook" },
  { value: "phone_call", label: "Phone Call" },
  { value: "email", label: "Email" },
  { value: "in_person", label: "In Person" },
  { value: "system", label: "System (self-entry)" },
];

export type SourceChannelSelectProps = {
  value: SourceChannel;
  onChange: (value: SourceChannel) => void;
  disabled?: boolean;
  /** Include the "system" option? Hide it when the form context is clearly proxy-entry. */
  includeSystem?: boolean;
};

export function SourceChannelSelect({
  value,
  onChange,
  disabled = false,
  includeSystem = false,
}: SourceChannelSelectProps) {
  const options = includeSystem
    ? CHANNELS
    : CHANNELS.filter((c) => c.value !== "system");

  return (
    <div>
      <label
        htmlFor="source-channel-select"
        className="mb-1 block text-xs text-on-surface-variant"
      >
        Source Channel
      </label>
      <select
        id="source-channel-select"
        value={value}
        onChange={(e) => onChange(e.target.value as SourceChannel)}
        disabled={disabled}
        className="block w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
      >
        {options.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>
    </div>
  );
}
