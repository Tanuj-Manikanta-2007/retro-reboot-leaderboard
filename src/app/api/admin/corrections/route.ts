import { NextRequest, NextResponse } from "next/server";
import { DataStore } from "@/services/data-store";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as "pending" | "approved" | "rejected" | undefined;
    const requests = await DataStore.getCorrectionRequests(status);
    const response = NextResponse.json({ success: true, data: requests });
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load correction requests" }, { status: 500 });
  }
}
