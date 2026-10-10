import { NextRequest, NextResponse } from "next/server";
import { scoreSubmissionSchema } from "@/lib/validation/schemas";
import { DataStore } from "@/services/data-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = scoreSubmissionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { player_id, game_id, scoring_method, raw_score, awarded_points, idempotency_key } = parsed.data;

    // Retrieve volunteer identity from header or body
    const volunteerId = req.headers.get("x-volunteer-id") || body.volunteer_id || "vol-1";

    const attempt = await DataStore.submitScore({
      player_id,
      game_id,
      volunteer_id: volunteerId,
      scoring_method,
      raw_score,
      awarded_points,
      idempotency_key,
    });

    return NextResponse.json({
      success: true,
      message: "Score successfully accepted and recorded!",
      attempt,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to submit score" },
      { status: 400 }
    );
  }
}
