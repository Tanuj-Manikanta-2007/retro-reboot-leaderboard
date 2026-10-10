import { NextResponse } from "next/server";
import { DataStore } from "@/services/data-store";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET() {
  try {
    const activities = await DataStore.getVolunteerActivity();
    const response = NextResponse.json({ success: true, data: activities });
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load activity logs" }, { status: 500 });
  }
}
