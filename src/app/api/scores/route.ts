import { NextRequest, NextResponse } from "next/server";
import { scoreSubmissionSchema } from "@/lib/validation/schemas";
import { DataStore } from "@/services/data-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = scoreSubmissionSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message || "Validation failed";
      return NextResponse.json(
        { error: firstIssue, details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { player_id, game_id, scoring_method, raw_score, awarded_points, idempotency_key } = parsed.data;

    // Retrieve volunteer identity from header, body, or cookie
    let volunteerId = req.headers.get("x-volunteer-id") || body.volunteer_id;
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
