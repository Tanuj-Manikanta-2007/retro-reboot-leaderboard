import { NextResponse } from "next/server";
import { DataStore } from "@/services/data-store";
import { generatePlayerWisePointsReport } from "@/services/export-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET() {
  try {
    const [players, games, attempts] = await Promise.all([
      DataStore.getPlayers(),
      DataStore.getGames(),
      DataStore.getAllScoreAttempts(),
    ]);

    const acceptedAttempts = attempts.filter((a) => a.status === "accepted");
    const buffer = await generatePlayerWisePointsReport(players, games, acceptedAttempts);

    const today = new Date().toISOString().split("T")[0];
    const filename = `Retro_Reboot_Player_Points_${today}.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to generate report" }, { status: 500 });
  }
}
