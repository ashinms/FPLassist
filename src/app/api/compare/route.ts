import { NextRequest, NextResponse } from "next/server";
import { getComparison, PlayerNotFoundError } from "@/lib/compare";

export async function GET(req: NextRequest) {
  const outId = Number(req.nextUrl.searchParams.get("out"));
  const inId = Number(req.nextUrl.searchParams.get("in"));
  const gwWindow = Number(req.nextUrl.searchParams.get("gws") ?? 3);

  if (!outId || !inId) {
    return NextResponse.json({ error: "Missing out/in player ids" }, { status: 400 });
  }

  try {
    const comparison = await getComparison(outId, inId, gwWindow);
    return NextResponse.json(comparison);
  } catch (err) {
    if (err instanceof PlayerNotFoundError) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }
    throw err;
  }
}
