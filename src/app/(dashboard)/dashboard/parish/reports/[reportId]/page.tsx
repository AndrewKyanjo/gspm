import { redirect } from "next/navigation";

type ReportRedirectPageProps = {
  params: Promise<{ reportId: string }>;
};

export default async function ReportRedirectPage({ params }: ReportRedirectPageProps) {
  const { reportId } = await params;
  redirect(`/dashboard/parish/reports?report=${reportId}`);
}
