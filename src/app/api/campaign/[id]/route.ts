import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { campaignStore } from "@/lib/campaignStore";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const authResult = await requireAuth();
  if (!authResult.authorized) return authResult.response;

  const { id } = await params;
  const campaign = campaignStore.get(id);
  if (!campaign) {
    return NextResponse.json({ error: "캠페인을 찾을 수 없습니다" }, { status: 404 });
  }

  return NextResponse.json({ data: campaign });
}

export async function PUT(request: NextRequest, { params }: Params) {
  const authResult = await requireAuth();
  if (!authResult.authorized) return authResult.response;

  const { id } = await params;
  const existing = campaignStore.get(id);
  if (!existing) {
    return NextResponse.json({ error: "캠페인을 찾을 수 없습니다" }, { status: 404 });
  }

  let body: Partial<typeof existing>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "요청 본문이 유효하지 않습니다" }, { status: 400 });
  }

  // Prevent overwriting immutable fields
  const { id: _id, userId: _userId, createdAt: _createdAt, ...safeUpdates } = body as typeof existing;

  if (safeUpdates.budget !== undefined && (typeof safeUpdates.budget !== "number" || isNaN(safeUpdates.budget) || safeUpdates.budget < 0)) {
    return NextResponse.json({ error: "예산은 0 이상의 숫자여야 합니다" }, { status: 400 });
  }

  const updated = {
    ...existing,
    ...safeUpdates,
    id: existing.id,
    userId: existing.userId,
    createdAt: existing.createdAt,
    updatedAt: new Date(),
  };

  campaignStore.set(id, updated);

  return NextResponse.json({ data: updated });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const authResult = await requireAuth();
  if (!authResult.authorized) return authResult.response;

  const { id } = await params;
  if (!campaignStore.has(id)) {
    return NextResponse.json({ error: "캠페인을 찾을 수 없습니다" }, { status: 404 });
  }

  campaignStore.delete(id);

  return new NextResponse(null, { status: 204 });
}
