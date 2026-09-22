import { NextRequest, NextResponse } from "next/server";
import { getBootstrap, getPositionShort, getTeamById, searchPlayers } from "@/lib/fpl";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const bootstrap = await getBootstrap();
  const results = searchPlayers(bootstrap, q).map((p) => ({
    id: p.id,
    webName: p.web_name,
    teamShortName: getTeamById(bootstrap, p.team)?.short_name ?? "UNK",
    position: getPositionShort(bootstrap, p.element_type),
    priceM: p.now_cost / 10,
  }));
  return NextResponse.json({ results });
}
