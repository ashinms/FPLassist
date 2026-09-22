import { NextRequest, NextResponse } from "next/server";
import { getComparison, PlayerNotFoundError } from "@/lib/compare";
import { runArbiter, runBear, runBull } from "@/lib/agents";

export async function GET(req: NextRequest) {
  const outId = Number(req.nextUrl.searchParams.get("out"));
  const inId = Number(req.nextUrl.searchParams.get("in"));
  const gwWindow = Number(req.nextUrl.searchParams.get("gws") ?? 3);

  if (!outId || !inId) {
    return NextResponse.json({ error: "Missing out/in player ids" }, { status: 400 });
  }

  let comparison;
  try {
    comparison = await getComparison(outId, inId, gwWindow);
  } catch (err) {
    if (err instanceof PlayerNotFoundError) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }
    throw err;
  }

  try {
    const [bull, bear] = await Promise.all([runBull(comparison), runBear(comparison)]);
    const arbiter = await runArbiter(comparison, bull, bear);

    return NextResponse.json({ comparison, bull, bear, arbiter });
  } catch (err) {
    console.error("Agent pipeline failed:", err);
    return NextResponse.json(
      { error: "Agent pipeline failed", comparison },
      { status: 502 }
    );
  }
}
