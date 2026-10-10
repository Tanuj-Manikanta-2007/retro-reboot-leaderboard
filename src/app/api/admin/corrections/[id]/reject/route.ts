import { NextRequest, NextResponse } from "next/server";
import { DataStore } from "@/services/data-store";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json().catch(() => ({}));
    const adminId = body.admin_id || "admin-root";
    const decisionReason = body.reason || "Rejected by administrator";

    const updated = await DataStore.reviewCorrectionRequest({
      request_id: params.id,
      admin_id: adminId,
      decision: "rejected",
      decision_reason: decisionReason,
    });

    return NextResponse.json({
      success: true,
      message: "Score correction request rejected.",
      data: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to reject correction" }, { status: 400 });
  }
}
