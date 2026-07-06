import {
  getDeaneryParishRows,
  getDeaneryReportEventRows,
  getDeaneryReportRows,
  getProfilesByIds,
  getReportingPeriodsByIds,
} from "@/lib/db/queries/deanery";
import type { DeaneryReportDetail, DeaneryReportListItem } from "../types";

function buildPeriodLabelMap(periods: Array<{ id: string; month: number; year: number }>) {
  return new Map(periods.map((period) => [period.id, `${period.month}/${period.year}`]));
}

export async function getDeaneryReports(
  deaneryId: string,
  filters?: { status?: string; query?: string }
): Promise<DeaneryReportListItem[]> {
  const [reports, parishes, periods] = await Promise.all([
    getDeaneryReportRows(deaneryId),
    getDeaneryParishRows(deaneryId),
    getReportingPeriodsByIds((await getDeaneryReportRows(deaneryId)).map((report) => String(report.reporting_period_id))),
  ]);

  const parishNameMap = new Map(parishes.map((parish) => [String(parish.id), String(parish.name)]));
  const periodLabelMap = buildPeriodLabelMap(
    periods.map((period) => ({ id: String(period.id), month: Number(period.month), year: Number(period.year) }))
  );

  return reports
    .map((report) => ({
      id: String(report.id),
      parishId: String(report.parish_id),
      parishName: parishNameMap.get(String(report.parish_id)) ?? null,
      reportingPeriodLabel: periodLabelMap.get(String(report.reporting_period_id)) ?? null,
      status: typeof report.status === "string" ? report.status : null,
      summary: typeof report.summary === "string" ? report.summary : null,
      submittedAt: typeof report.submitted_at === "string" ? report.submitted_at : null,
      updatedAt: typeof report.updated_at === "string" ? report.updated_at : null,
    }))
    .filter((report) => {
      if (filters?.status && report.status !== filters.status) {
        return false;
      }

      if (!filters?.query) {
        return true;
      }

      const query = filters.query.toLowerCase();
      return [report.parishName, report.reportingPeriodLabel, report.status, report.summary, report.id]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
}

export async function getDeaneryReportDetail(deaneryId: string, reportId: string): Promise<DeaneryReportDetail | null> {
  const [reports, parishes, periods, events] = await Promise.all([
    getDeaneryReportRows(deaneryId),
    getDeaneryParishRows(deaneryId),
    getReportingPeriodsByIds((await getDeaneryReportRows(deaneryId)).map((report) => String(report.reporting_period_id))),
    getDeaneryReportEventRows(deaneryId, reportId),
  ]);

  const report = reports.find((item) => String(item.id) === reportId);
  if (!report) {
    return null;
  }

  const parishNameMap = new Map(parishes.map((parish) => [String(parish.id), String(parish.name)]));
  const periodLabelMap = buildPeriodLabelMap(
    periods.map((period) => ({ id: String(period.id), month: Number(period.month), year: Number(period.year) }))
  );
  const profiles = await getProfilesByIds(events.map((event) => String(event.created_by)));
  const profileNameMap = new Map(profiles.map((profile) => [String(profile.id), profile.full_name ?? null]));

  return {
    id: String(report.id),
    parishId: String(report.parish_id),
    parishName: parishNameMap.get(String(report.parish_id)) ?? null,
    reportingPeriodLabel: periodLabelMap.get(String(report.reporting_period_id)) ?? null,
    status: typeof report.status === "string" ? report.status : null,
    summary: typeof report.summary === "string" ? report.summary : null,
    submittedAt: typeof report.submitted_at === "string" ? report.submitted_at : null,
    updatedAt: typeof report.updated_at === "string" ? report.updated_at : null,
    totalHouseholds: Number(report.total_households ?? 0),
    totalBeneficiaries: Number(report.total_beneficiaries ?? 0),
    maleBeneficiaries: Number(report.male_beneficiaries ?? 0),
    femaleBeneficiaries: Number(report.female_beneficiaries ?? 0),
    youthBeneficiaries: Number(report.youth_beneficiaries ?? 0),
    elderlyBeneficiaries: Number(report.elderly_beneficiaries ?? 0),
    totalCasesOpened: Number(report.total_cases_opened ?? 0),
    totalCasesClosed: Number(report.total_cases_closed ?? 0),
    totalDonationsReceived: Number(report.total_donations_received ?? 0),
    totalAmountDisbursed: Number(report.total_amount_disbursed ?? 0),
    challenges: typeof report.challenges === "string" ? report.challenges : null,
    recommendations: typeof report.recommendations === "string" ? report.recommendations : null,
    events: events.map((event) => ({
      id: String(event.id),
      action: String(event.action),
      note: typeof event.note === "string" ? event.note : null,
      createdAt: String(event.created_at),
      createdByName: profileNameMap.get(String(event.created_by)) ?? null,
    })),
  };
}
