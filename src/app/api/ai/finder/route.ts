import { NextRequest, NextResponse } from "next/server";
import { runAIFinder, type FinderRequest } from "@/lib/ai";
import { requireAuth, checkRateLimit, getClientIp, checkPlanAccess } from "@/lib/apiAuth";

export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.authorized) return authResult.response;

  const planDenied = checkPlanAccess(authResult.session.user?.plan, "aiFinder");
  if (planDenied) return planDenied;

  const rateLimited = checkRateLimit(getClientIp(request), { limit: 10, windowSeconds: 60 });
  if (rateLimited) return rateLimited;

  let body: FinderRequest;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_JSON", message: "요청 본문을 파싱할 수 없습니다" } },
      { status: 400 }
    );
  }

  if (!body.description || body.description.trim().length === 0) {
    return NextResponse.json(
      { error: { code: "MISSING_DESCRIPTION", message: "광고 설명을 입력하세요" } },
      { status: 400 }
    );
  }

  const req: FinderRequest = {
    description: body.description.trim(),
    category: body.category,
    budget: body.budget,
    targetAudience: body.targetAudience,
  };

  const result = await runAIFinder(req);

  return NextResponse.json({ data: result });
}
