import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params: _params }: Params) {
  const authResult = await requireAuth();
  if (!authResult.authorized) return authResult.response;

  return NextResponse.json({ error: "캠페인을 찾을 수 없습니다" }, { status: 404 });
}

export async function PUT(request: NextRequest, { params: _params }: Params) {
  const authResult = await requireAuth();
  if (!authResult.authorized) return authResult.response;

  return NextResponse.json({ error: "캠페인을 찾을 수 없습니다" }, { status: 404 });
}

export async function DELETE(_request: NextRequest, { params: _params }: Params) {
  const authResult = await requireAuth();
  if (!authResult.authorized) return authResult.response;

  return NextResponse.json({ error: "캠페인을 찾을 수 없습니다" }, { status: 404 });
}
