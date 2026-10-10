import { NextRequest, NextResponse } from "next/server";
import { scoringRuleRangeSchema } from "@/lib/validation/schemas";
import { DataStore } from "@/services/data-store";
import { checkRangesOverlap } from "@/services/scoring-service";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rules = await DataStore.getScoringRules(params.id);
    return NextResponse.json({ success: true, data: rules });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch rules" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const parsed = scoringRuleRangeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    // Check for overlap against existing active rules
    const existingRules = await DataStore.getScoringRules(params.id);
    for (const rule of existingRules) {
      if (checkRangesOverlap(parsed.data, rule)) {
        return NextResponse.json(
          {
            error: `Range conflict! New range [${parsed.data.minimum_score.toLocaleString()} - ${parsed.data.maximum_score.toLocaleString()}] overlaps with existing rule [${rule.minimum_score.toLocaleString()} - ${rule.maximum_score.toLocaleString()} = ${rule.points_awarded} pts]`,
          },
          { status: 400 }
        );
      }
    }

    const newRule = await DataStore.addScoringRule({
      game_id: params.id,
      rule_version: 1,
      minimum_score: parsed.data.minimum_score,
      maximum_score: parsed.data.maximum_score,
      points_awarded: parsed.data.points_awarded,
      is_active: true,
    });

    return NextResponse.json({ success: true, data: newRule }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create scoring rule" }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const ruleId = searchParams.get("ruleId");
    if (!ruleId) {
      return NextResponse.json({ error: "Missing ruleId parameter" }, { status: 400 });
    }

    await DataStore.deleteScoringRule(ruleId);
    return NextResponse.json({ success: true, message: "Rule deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete rule" }, { status: 400 });
  }
}
