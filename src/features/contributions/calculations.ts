export type MandatoryContributionAllocation = {
  annualEmitemwaDue: number;
  goodSamaritanDue: number;
  totalRecorded: number;
  emitemwaRecorded: number;
  emitemwaApplied: number;
  emitemwaBalance: number;
  emitemwaExcess: number;
  goodSamaritanRecorded: number;
  emitemwaExcessAppliedToGoodSamaritan: number;
  goodSamaritanAvailable: number;
  goodSamaritanApplied: number;
  goodSamaritanBalance: number;
  surplus: number;
};

function nonNegative(value: number) {
  return Number.isFinite(value) ? Math.max(value, 0) : 0;
}

/**
 * Applies parish money consistently: Emitemwa first, Good Samaritan Day
 * second, and preserves anything left as an explicit parish surplus.
 */
export function allocateMandatoryContributions({
  monthlyRate,
  goodSamaritanRate,
  legacyPaid = 0,
  legacySurplus = 0,
  monthlyPayments = 0,
  goodSamaritanPayments = 0,
}: {
  monthlyRate: number;
  goodSamaritanRate: number;
  legacyPaid?: number;
  legacySurplus?: number;
  monthlyPayments?: number;
  goodSamaritanPayments?: number;
}): MandatoryContributionAllocation {
  const annualEmitemwaDue = nonNegative(monthlyRate) * 12;
  const goodSamaritanDue = nonNegative(goodSamaritanRate);
  const emitemwaRecorded =
    nonNegative(legacyPaid) + nonNegative(legacySurplus) + nonNegative(monthlyPayments);
  const goodSamaritanRecorded = nonNegative(goodSamaritanPayments);
  const emitemwaApplied = Math.min(emitemwaRecorded, annualEmitemwaDue);
  const emitemwaExcess = Math.max(emitemwaRecorded - annualEmitemwaDue, 0);
  const goodSamaritanAvailable = goodSamaritanRecorded + emitemwaExcess;
  const goodSamaritanApplied = Math.min(goodSamaritanAvailable, goodSamaritanDue);
  const emitemwaExcessAppliedToGoodSamaritan = Math.min(
    emitemwaExcess,
    Math.max(goodSamaritanDue - goodSamaritanRecorded, 0),
  );

  return {
    annualEmitemwaDue,
    goodSamaritanDue,
    totalRecorded: emitemwaRecorded + goodSamaritanRecorded,
    emitemwaRecorded,
    emitemwaApplied,
    emitemwaBalance: Math.max(annualEmitemwaDue - emitemwaApplied, 0),
    emitemwaExcess,
    goodSamaritanRecorded,
    emitemwaExcessAppliedToGoodSamaritan,
    goodSamaritanAvailable,
    goodSamaritanApplied,
    goodSamaritanBalance: Math.max(goodSamaritanDue - goodSamaritanApplied, 0),
    surplus: Math.max(goodSamaritanAvailable - goodSamaritanDue, 0),
  };
}
