import { NextResponse } from "next/server";
import { DataStore } from "@/services/data-store";

export async function GET() {
  try {
    const activities = await DataStore.getVolunteerActivity();
    return NextResponse.json({ success: true, data: activities });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load activity logs" }, { status: 500 });
  }
}
