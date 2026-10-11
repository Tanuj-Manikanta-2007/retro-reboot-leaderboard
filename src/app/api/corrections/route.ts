import { NextRequest, NextResponse } from "next/server";
import { scoreCorrectionSchema } from "@/lib/validation/schemas";
import { DataStore } from "@/services/data-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = scoreCorrectionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const {
      original_attempt_id,
      requested_player_id,
      requested_game_id,
      requested_scoring_method,
      requested_raw_score,
      requested_points,
      reason,
    } = parsed.data;

    let volunteerId = req.headers.get("x-volunteer-id") || body.requested_by;
    if (!volunteerId) {
      const cookieIdentity = req.cookies.get("retro_volunteer_identity")?.value;
      if (cookieIdentity) {
        try {
          const parsedIdent = JSON.parse(cookieIdentity);
          volunteerId = parsedIdent.id || parsedIdent.code;
        } catch {
          // ignore
        }
      }
    }
    if (!volunteerId) {
      volunteerId = "VOL-01";
    }

    const correction = await DataStore.createCorrectionRequest({
      original_attempt_id,
      requested_player_id,
      requested_game_id,
      requested_scoring_method,
      requested_raw_score,
      requested_points,
      reason,
      requested_by: volunteerId,
    });

    return NextResponse.json({
      success: true,
      message: "Correction request submitted successfully! Awaiting admin review.",
      data: correction,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to submit correction request" },
      { status: 400 }
    );
  }
}
