import { NextResponse } from "next/server";
import { DataStore } from "@/services/data-store";
import { generatePlayersExport } from "@/services/export-service";

export async function GET() {
  try {
    const players = await DataStore.getPlayers();
    const buffer = await generatePlayersExport(players);
    const today = new Date().toISOString().split("T")[0];
    const filename = `Retro_Reboot_Players_Roster_${today}.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to generate export" }, { status: 500 });
  }
}
