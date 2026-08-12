import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { generateContributionReportPDF } from "@/features/reports/pdf-generator";

export async function POST(request: NextRequest) {
  try {
    await requireAuth({
      roles: [
        "super_admin",
        "archdiocese_admin",
        "archdiocese_data_entry",
        "vicariate_head",
        "vicariate_staff",
        "deanery_head",
        "deanery_staff",
        "parish_head",
        "parish_data_entry",
      ],
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { type, data } = body;

    if (!type || !data) {
      return NextResponse.json({ error: "Report type and data are required." }, { status: 400 });
    }

    let pdfBuffer: Buffer;

    switch (type) {
      case "contribution": {
        pdfBuffer = await generateContributionReportPDF(data);
        break;
      }
      default:
        return NextResponse.json({ error: `Unknown report type: ${type}` }, { status: 400 });
    }

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="gspm-report-${type}-${Date.now()}.pdf"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (error) {
    console.error("PDF generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF report." },
      { status: 500 },
    );
  }
}
