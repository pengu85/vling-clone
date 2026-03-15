import { NextRequest, NextResponse } from "next/server";
import { runAIContent, type ContentRequest } from "@/lib/ai";
import { requireAuth, checkRateLimit, getClientIp, checkPlanAccess } from "@/lib/apiAuth";

export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.authorized) return authResult.response;

  const planDenied = checkPlanAccess(authResult.session.user?.plan, "aiContent");
  if (planDenied) return planDenied;

  const rateLimited = checkRateLimit(getClientIp(request), { limit: 10, windowSeconds: 60 });
  if (rateLimited) return rateLimited;

  let body: ContentRequest;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_JSON", message: "요청 본문을 파싱할 수 없습니다" } },
      { status: 400 }
    );
  }

  if (!body.keyword || body.keyword.trim().length === 0) {
    return NextResponse.json(
      { error: { code: "MISSING_KEYWORD", message: "키워드를 입력하세요" } },
      { status: 400 }
    );
  }

  const req: ContentRequest = {
    keyword: body.keyword.trim(),
    channelId: body.channelId,
    contentType: body.contentType ?? "long-form",
    tone: body.tone ?? "informative",
  };

  const result = await runAIContent(req);

  return NextResponse.json({ data: result });
}
