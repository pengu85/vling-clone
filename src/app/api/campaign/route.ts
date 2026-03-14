import { NextRequest, NextResponse } from "next/server";
import type { Campaign, CampaignStatus } from "@/types/campaign";
import { requireAuth, checkRateLimit, getClientIp } from "@/lib/apiAuth";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.authorized) return authResult.response;

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status") as CampaignStatus | null;

  let campaigns: Campaign[] = [];
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

  const body = await request.json();
  const now = new Date();
  const newCampaign: Campaign = {
    id: `camp-${Date.now()}`,
    userId: "user-001",
    createdAt: now,
    updatedAt: now,
    status: "draft",
    ...body,
  };
  return NextResponse.json({ data: newCampaign }, { status: 201 });
}
