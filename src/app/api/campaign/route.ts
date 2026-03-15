import { NextRequest, NextResponse } from "next/server";
import type { Campaign, CampaignStatus } from "@/types/campaign";
import { requireAuth, checkRateLimit, getClientIp } from "@/lib/apiAuth";
import { campaignStore } from "@/lib/campaignStore";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.authorized) return authResult.response;

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status") as CampaignStatus | null;

  let campaigns: Campaign[] = Array.from(campaignStore.values());
  if (status) {
    campaigns = campaigns.filter((c) => c.status === status);
  }

  return NextResponse.json({ data: campaigns, total: campaigns.length });
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.authorized) return authResult.response;

  const rateLimited = checkRateLimit(getClientIp(request), { limit: 20, windowSeconds: 60 });
  if (rateLimited) return rateLimited;

  let body: Partial<Campaign>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "요청 본문이 유효하지 않습니다" }, { status: 400 });
  }

  // Input validation
  if (!body.title || typeof body.title !== "string" || body.title.trim() === "") {
    return NextResponse.json({ error: "캠페인 제목은 필수입니다" }, { status: 400 });
  }
  if (body.budget !== undefined && (typeof body.budget !== "number" || isNaN(body.budget) || body.budget < 0)) {
    return NextResponse.json({ error: "예산은 0 이상의 숫자여야 합니다" }, { status: 400 });
  }

  const now = new Date();
  const newCampaign: Campaign = {
    id: `camp-${Date.now()}`,
    userId: authResult.session.user?.email ?? "user-001",
    createdAt: now,
    updatedAt: now,
    status: "draft",
    ...body,
    title: body.title.trim(),
  } as Campaign;

  campaignStore.set(newCampaign.id, newCampaign);

  return NextResponse.json({ data: newCampaign }, { status: 201 });
}
