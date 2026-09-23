import { NextRequest, NextResponse } from "next/server";
import {
  getBootstrap,
  getCurrentEventId,
  getPlayerById,
  getPlayerPhotoUrl,
  getPositionShort,
  getTeamBadgeUrl,
  getTeamById,
  getTeamPicks,
  TeamNotFoundError,
} from "@/lib/fpl";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId: teamIdParam } = await params;
  const teamId = Number(teamIdParam);

  if (!teamId || teamId < 1) {
    return NextResponse.json({ error: "Invalid team ID" }, { status: 400 });
  }

  const bootstrap = await getBootstrap();
  const eventId = getCurrentEventId(bootstrap);

  try {
    const picksResponse = await getTeamPicks(teamId, eventId);

    const squad = picksResponse.picks
      .map((pick) => getPlayerById(bootstrap, pick.element))
      .filter((p) => p !== undefined)
      .map((p) => {
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

    return NextResponse.json({
      squad,
      bankM: picksResponse.entry_history.bank / 10,
      teamValueM: picksResponse.entry_history.value / 10,
    });
  } catch (err) {
    if (err instanceof TeamNotFoundError) {
      return NextResponse.json({ error: "Team ID not found" }, { status: 404 });
    }
    throw err;
  }
}
