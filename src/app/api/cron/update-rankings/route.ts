import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(
    { error: { code: "NOT_IMPLEMENTED", message: "랭킹 업데이트 기능이 아직 구현되지 않았습니다" } },
    { status: 501 }
  );
}
