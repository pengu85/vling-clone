import { NextRequest, NextResponse } from "next/server";
import { estimateMonthlyRevenue } from "@/domain/revenueEstimate";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const dailyViews = parseInt(searchParams.get("dailyViews") || "0");
    const country = searchParams.get("country") || "KR";
    const category = searchParams.get("category") || "entertainment";

    if (dailyViews <= 0) {
      return NextResponse.json(
        { error: { code: "INVALID_INPUT", message: "일 평균 조회수를 입력하세요" } },
        { status: 400 }
      );
    }

    const monthlyRevenue = estimateMonthlyRevenue({ dailyViews, country, category });
    const yearlyRevenue = monthlyRevenue * 12;

    return NextResponse.json({
      data: {
        dailyViews,
        country,
        category,
        monthlyRevenue,
        yearlyRevenue,
        estimatedCPM: parseFloat(((monthlyRevenue / (dailyViews * 30)) * 1000).toFixed(2)),
        revenueRange: {
          min: Math.round(monthlyRevenue * 0.7),
          max: Math.round(monthlyRevenue * 1.3),
        },
      },
    });
  } catch (error) {
    console.error("Calculator API error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "수익 계산 중 오류가 발생했습니다" } },
      { status: 500 }
    );
  }
}
