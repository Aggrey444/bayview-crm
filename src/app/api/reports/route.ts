import { NextRequest, NextResponse } from "next/server";
import {
  getLeadsBySource,
  getLeadsByCampaign,
  getLeadsByService,
  getLeadsByStaff,
  getLeadConversionRate,
  getBookingsReport,
  getPaymentsReport,
  getRevenueReport,
  getFollowUpPerformance,
} from "@/lib/queries/reports";
import { requirePermission } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  const authResult = await requirePermission("reports.view");
  if ("error" in authResult) return authResult.error;

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate") || undefined;
  const endDate = searchParams.get("endDate") || undefined;
  const report = searchParams.get("report") || "all";
  const params = { startDate, endDate };

  try {
    switch (report) {
      case "leads-by-source":
        return NextResponse.json(await getLeadsBySource(params));
      case "leads-by-campaign":
        return NextResponse.json(await getLeadsByCampaign(params));
      case "leads-by-service":
        return NextResponse.json(await getLeadsByService(params));
      case "leads-by-staff":
        return NextResponse.json(await getLeadsByStaff(params));
      case "conversion-rate":
        return NextResponse.json(await getLeadConversionRate(params));
      case "bookings":
        return NextResponse.json(await getBookingsReport(params));
      case "payments":
        return NextResponse.json(await getPaymentsReport(params));
      case "revenue":
        return NextResponse.json(await getRevenueReport(params));
      case "follow-ups":
        return NextResponse.json(await getFollowUpPerformance(params));
      case "all":
      default: {
        const [leadsBySource, leadsByCampaign, leadsByService, leadsByStaff, conversionRate, bookings, payments, revenue, followUps] =
          await Promise.all([
            getLeadsBySource(params),
            getLeadsByCampaign(params),
            getLeadsByService(params),
            getLeadsByStaff(params),
            getLeadConversionRate(params),
            getBookingsReport(params),
            getPaymentsReport(params),
            getRevenueReport(params),
            getFollowUpPerformance(params),
          ]);
        return NextResponse.json({
          leadsBySource,
          leadsByCampaign,
          leadsByService,
          leadsByStaff,
          conversionRate,
          bookings,
          payments,
          revenue,
          followUps,
        });
      }
    }
  } catch (error) {
    console.error("GET /api/reports error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
