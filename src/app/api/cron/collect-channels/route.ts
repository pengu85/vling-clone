import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // Cron secret 인증
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(
    { error: { code: "NOT_IMPLEMENTED", message: "채널 수집 기능이 아직 구현되지 않았습니다" } },
    { status: 501 }
  );
}
