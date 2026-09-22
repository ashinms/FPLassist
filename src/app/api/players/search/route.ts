import { NextRequest, NextResponse } from "next/server";
import {
  getBootstrap,
  getPlayerPhotoUrl,
  getPositionShort,
  getTeamBadgeUrl,
  getTeamById,
  searchPlayers,
} from "@/lib/fpl";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const bootstrap = await getBootstrap();
  const results = searchPlayers(bootstrap, q).map((p) => {
    const team = getTeamById(bootstrap, p.team);
    return {
      id: p.id,
      webName: p.web_name,
      teamShortName: team?.short_name ?? "UNK",
      position: getPositionShort(bootstrap, p.element_type),
      priceM: p.now_cost / 10,
      photoUrl: getPlayerPhotoUrl(p.code),
      badgeUrl: team ? getTeamBadgeUrl(team.code) : "",
      status: p.status,
    };
  });
  return NextResponse.json({ results });
}
