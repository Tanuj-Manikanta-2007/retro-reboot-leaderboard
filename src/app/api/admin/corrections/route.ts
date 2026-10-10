import { NextRequest, NextResponse } from "next/server";
import { DataStore } from "@/services/data-store";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as "pending" | "approved" | "rejected" | undefined;
    const requests = await DataStore.getCorrectionRequests(status);
    return NextResponse.json({ success: true, data: requests });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load correction requests" }, { status: 500 });
  }
}
