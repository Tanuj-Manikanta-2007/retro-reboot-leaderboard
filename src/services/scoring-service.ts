import { ScoreAttempt, ScoringRule } from "../types/database";

export interface CalculatePointsResult {
  success: boolean;
  points?: number;
  ruleId?: string;
  ruleVersion?: number;
  errorMessage?: string;
  hasRulesConfigured?: boolean;
}

/**
 * Validates whether two score ranges overlap
 */
export function checkRangesOverlap(
  rangeA: { minimum_score: number; maximum_score: number },
  rangeB: { minimum_score: number; maximum_score: number }
): boolean {
  return Math.max(rangeA.minimum_score, rangeB.minimum_score) <= Math.min(rangeA.maximum_score, rangeB.maximum_score);
}

/**
 * Validates a list of scoring rules to ensure no overlapping ranges exist
 */
export function validateRuleSetOverlap(rules: Array<{ minimum_score: number; maximum_score: number }>): {
  isValid: boolean;
  conflict?: string;
} {
  for (let i = 0; i < rules.length; i++) {
    for (let j = i + 1; j < rules.length; j++) {
      if (checkRangesOverlap(rules[i], rules[j])) {
        return {
          isValid: false,
          conflict: `Range [${rules[i].minimum_score} - ${rules[i].maximum_score}] overlaps with [${rules[j].minimum_score} - ${rules[j].maximum_score}]`,
        };
      }
    }
  }
  return { isValid: true };
}

/**
 * Evaluates points for Automatic Mode from active scoring rules
 */
export function evaluateAutomaticScore(
  rawScore: number,
  activeRules: ScoringRule[]
): CalculatePointsResult {
  if (rawScore < 0 || !Number.isInteger(rawScore)) {
    return {
      success: false,
      errorMessage: "Raw score must be a non-negative integer",
      hasRulesConfigured: activeRules.length > 0,
    };
  }

  if (!activeRules || activeRules.length === 0) {
    return {
      success: false,
      hasRulesConfigured: false,
      errorMessage: "No score-to-points logic configured for this game. Please use Enter Points Directly.",
    };
  }

  // Find matching range
  const matchedRules = activeRules.filter(
    (rule) => rawScore >= rule.minimum_score && rawScore <= rule.maximum_score
  );

  if (matchedRules.length === 0) {
    const rangeList = activeRules
      .map((r) => `[${r.minimum_score.toLocaleString()} - ${r.maximum_score.toLocaleString()} = ${r.points_awarded} pts]`)
      .join(", ");
    return {
      success: false,
      hasRulesConfigured: true,
      errorMessage: `Score ${rawScore.toLocaleString()} does not match any configured range. Active ranges: ${rangeList}`,
    };
  }

  if (matchedRules.length > 1) {
    return {
      success: false,
      hasRulesConfigured: true,
      errorMessage: "Conflicting overlapping scoring rules detected for this game. Please contact an admin.",
    };
  }

  const matched = matchedRules[0];
  return {
    success: true,
    points: matched.points_awarded,
    ruleId: matched.id,
    ruleVersion: matched.rule_version,
    hasRulesConfigured: true,
  };
}

/**
 * Deterministically compares two attempts to determine which is better according to:
 * 1. Highest awarded points
 * 2. Highest raw score (if both have raw scores)
 * 3. Earliest accepted attempt
 * Returns negative if A is better, positive if B is better, 0 if identical.
 */
export function compareAttempts(
  a: Pick<ScoreAttempt, "awarded_points" | "raw_score" | "created_at">,
  b: Pick<ScoreAttempt, "awarded_points" | "raw_score" | "created_at">
): number {
  // 1. Highest awarded points
  if (a.awarded_points !== b.awarded_points) {
    return b.awarded_points - a.awarded_points;
  }

  // 2. If points are equal, highest raw score (if both recorded a raw score)
  const aRaw = a.raw_score !== null && a.raw_score !== undefined ? a.raw_score : -1;
  const bRaw = b.raw_score !== null && b.raw_score !== undefined ? b.raw_score : -1;

  if (aRaw !== bRaw) {
    return bRaw - aRaw;
  }

  // 3. Earliest accepted attempt
  const aTime = new Date(a.created_at).getTime();
  const bTime = new Date(b.created_at).getTime();
  return aTime - bTime;
}

/**
 * Evaluates best scores for a player across all games from accepted score history
 */
export function calculateBestScoresPerGame(
  attempts: ScoreAttempt[]
): Map<string, ScoreAttempt> {
  const bestByGame = new Map<string, ScoreAttempt>();

  for (const attempt of attempts) {
    if (attempt.status !== "accepted") continue;

    const currentBest = bestByGame.get(attempt.game_id);
    if (!currentBest) {
      bestByGame.set(attempt.game_id, attempt);
    } else {
      if (compareAttempts(attempt, currentBest) < 0) {
        bestByGame.set(attempt.game_id, attempt);
      }
    }
  }

  return bestByGame;
}
