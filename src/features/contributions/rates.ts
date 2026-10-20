type ContributionRateSource = {
  monthly_emitemwa_amount?: unknown;
  good_samaritan_day_amount?: unknown;
};

function rateValue(value: unknown): number | null {
  if (value == null || (typeof value === "string" && value.trim() === "")) return null;
  if (typeof value !== "number" && typeof value !== "string") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export function resolveContributionRates(
  parish: ContributionRateSource | null | undefined,
  vicariate: ContributionRateSource | null | undefined,
) {
  return {
    monthlyRate:
      rateValue(parish?.monthly_emitemwa_amount) ??
      rateValue(vicariate?.monthly_emitemwa_amount) ??
      50000,
    goodSamaritanRate:
      rateValue(parish?.good_samaritan_day_amount) ??
      rateValue(vicariate?.good_samaritan_day_amount) ??
      250000,
  };
}
