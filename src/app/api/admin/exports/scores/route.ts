import { NextResponse } from "next/server";
import { DataStore } from "@/services/data-store";
import { generateScoreHistoryExport } from "@/services/export-service";

export async function GET() {
  try {
    const attempts = await DataStore.getAllScoreAttempts();
    const buffer = await generateScoreHistoryExport(attempts);
    const today = new Date().toISOString().split("T")[0];
    const filename = `Retro_Reboot_Score_History_${today}.xlsx`;

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
