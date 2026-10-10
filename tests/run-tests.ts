import {
  evaluateAutomaticScore,
  checkRangesOverlap,
  validateRuleSetOverlap,
  compareAttempts,
  calculateBestScoresPerGame,
} from "../src/services/scoring-service";
import { normalizeRollNumber, sanitizeExcelString } from "../src/lib/utils";
import { ScoreAttempt, ScoringRule, Player, Game } from "../src/types/database";

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

console.log("\n=======================================================");
console.log("RUNNING RETRO REBOOT AUTOMATED UNIT & INTEGRATION TESTS");
console.log("=======================================================\n");

// 1. ROLL NUMBER NORMALIZATION TESTS
console.log("Test Suite 1: University Roll Number Normalization");
assert(normalizeRollNumber("  2026cse001  ") === "2026CSE001", "Trims whitespace and converts to uppercase");
assert(normalizeRollNumber("2026 cse 002") === "2026CSE002", "Removes internal whitespace");
assert(normalizeRollNumber("2026AIML045") === "2026AIML045", "Preserves valid uppercase roll numbers");

// 2. EXCEL FORMULA INJECTION SANITIZATION TESTS
console.log("\nTest Suite 2: Formula Injection Sanitization");
assert(sanitizeExcelString("=SUM(A1:A10)") === "'=SUM(A1:A10)", "Escapes leading '=' with apostrophe");
assert(sanitizeExcelString("+123456") === "'+123456", "Escapes leading '+'");
assert(sanitizeExcelString("-500") === "'-500", "Escapes leading '-'");
assert(sanitizeExcelString("@special") === "'@special", "Escapes leading '@'");
assert(sanitizeExcelString("Normal Text") === "Normal Text", "Leaves benign text untouched");

// 3. OVERLAPPING RANGE COLLISION TESTS
console.log("\nTest Suite 3: Overlapping Score Ranges Detection");
const rangeA = { minimum_score: 5000, maximum_score: 10000 };
const rangeOverlap = { minimum_score: 8000, maximum_score: 15000 };
const rangeSeparate = { minimum_score: 10001, maximum_score: 20000 };

assert(checkRangesOverlap(rangeA, rangeOverlap) === true, "Detects overlapping ranges [5000-10000] and [8000-15000]");
assert(checkRangesOverlap(rangeA, rangeSeparate) === false, "Permits non-overlapping ranges [5000-10000] and [10001-20000]");

const ruleOverlapValidation = validateRuleSetOverlap([
  { minimum_score: 0, maximum_score: 4999 },
  { minimum_score: 5000, maximum_score: 9999 },
  { minimum_score: 9000, maximum_score: 15000 },
]);
assert(ruleOverlapValidation.isValid === false, "Rejects rule set containing overlapping ranges");

// 4. AUTOMATIC SCORING EVALUATION TESTS
console.log("\nTest Suite 4: Automatic Score-to-Points Calculation");
const testRules: ScoringRule[] = [
  {
    id: "r1",
    game_id: "g1",
    rule_version: 1,
    minimum_score: 1000,
    maximum_score: 4999,
    points_awarded: 20,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "r2",
    game_id: "g1",
    rule_version: 1,
    minimum_score: 5000,
    maximum_score: 9999,
    points_awarded: 50,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "r3",
    game_id: "g1",
    rule_version: 1,
    minimum_score: 10000,
    maximum_score: 50000,
    points_awarded: 80,
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

const res1 = evaluateAutomaticScore(5000, testRules);
assert(res1.success === true && res1.points === 50, "Raw score 5000 awards exactly 50 points (range 5000-9999)");

const res2 = evaluateAutomaticScore(12500, testRules);
assert(res2.success === true && res2.points === 80, "Raw score 12500 awards exactly 80 points (range 10000-50000)");

const resUnmatched = evaluateAutomaticScore(500, testRules);
assert(resUnmatched.success === false, "Rejects score 500 below minimum configured range");

const resNoRules = evaluateAutomaticScore(5000, []);
assert(
  Boolean(
    resNoRules.success === false &&
      resNoRules.errorMessage?.includes("No score-to-points logic configured")
  ),
  "Displays temporary prompt to use Manual Mode when no rules are configured"
);

// 5. BEST-SCORE HIERARCHY & TIE-BREAKER TESTS
console.log("\nTest Suite 5: Best-Score Priority Hierarchy & Tie-Breakers");
const attemptLowerPoints: Pick<ScoreAttempt, "awarded_points" | "raw_score" | "created_at"> = {
  awarded_points: 30,
  raw_score: 25000,
  created_at: "2026-10-10T10:00:00Z",
};
const attemptHigherPoints: Pick<ScoreAttempt, "awarded_points" | "raw_score" | "created_at"> = {
  awarded_points: 50,
  raw_score: 15000,
  created_at: "2026-10-10T11:00:00Z",
};

assert(
  compareAttempts(attemptHigherPoints, attemptLowerPoints) < 0,
  "Priority 1: Higher awarded points wins over higher raw score (50 pts > 30 pts)"
);

// Tie on points -> higher raw score
const attemptTiedPtsLowerRaw: Pick<ScoreAttempt, "awarded_points" | "raw_score" | "created_at"> = {
  awarded_points: 50,
  raw_score: 15000,
  created_at: "2026-10-10T10:00:00Z",
};
const attemptTiedPtsHigherRaw: Pick<ScoreAttempt, "awarded_points" | "raw_score" | "created_at"> = {
  awarded_points: 50,
  raw_score: 18000,
  created_at: "2026-10-10T11:00:00Z",
};

assert(
  compareAttempts(attemptTiedPtsHigherRaw, attemptTiedPtsLowerRaw) < 0,
  "Priority 2: If points are tied, highest raw score wins (18000 > 15000)"
);

// Tie on points & raw score -> earliest timestamp
const attemptEarlier: Pick<ScoreAttempt, "awarded_points" | "raw_score" | "created_at"> = {
  awarded_points: 50,
  raw_score: 18000,
  created_at: "2026-10-10T10:00:00Z",
};
const attemptLater: Pick<ScoreAttempt, "awarded_points" | "raw_score" | "created_at"> = {
  awarded_points: 50,
  raw_score: 18000,
  created_at: "2026-10-10T12:00:00Z",
};

assert(
  compareAttempts(attemptEarlier, attemptLater) < 0,
  "Priority 3: If points & raw score are tied, earliest accepted attempt wins"
);

// 6. OVERALL LEADERBOARD: REPLAY PROTECTION
console.log("\nTest Suite 6: Overall Points & Replay Summation Protection");
const mockPlayerAttempts: ScoreAttempt[] = [
  {
    id: "1",
    player_id: "p1",
    game_id: "tetris",
    volunteer_id: "v1",
    scoring_method: "automatic",
    raw_score: 10000,
    awarded_points: 25,
    status: "accepted",
    created_at: "2026-10-10T10:00:00Z",
    updated_at: "2026-10-10T10:00:00Z",
  },
  {
    id: "2",
    player_id: "p1",
    game_id: "tetris", // Replay of same game with better score
    volunteer_id: "v1",
    scoring_method: "automatic",
    raw_score: 25000,
    awarded_points: 50,
    status: "accepted",
    created_at: "2026-10-10T11:00:00Z",
    updated_at: "2026-10-10T11:00:00Z",
  },
  {
    id: "3",
    player_id: "p1",
    game_id: "pacman", // Different game
    volunteer_id: "v1",
    scoring_method: "automatic",
    raw_score: 15000,
    awarded_points: 35,
    status: "accepted",
    created_at: "2026-10-10T12:00:00Z",
    updated_at: "2026-10-10T12:00:00Z",
  },
];

const bestScores = calculateBestScoresPerGame(mockPlayerAttempts);
assert(bestScores.size === 2, "Evaluates exactly 2 distinct games");
assert(bestScores.get("tetris")?.awarded_points === 50, "Selects best attempt (50 pts) for Tetris");
assert(bestScores.get("pacman")?.awarded_points === 35, "Selects best attempt (35 pts) for Pac-Man");

let totalOverall = 0;
for (const att of Array.from(bestScores.values())) {
  totalOverall += att.awarded_points;
}
assert(
  totalOverall === 85,
  "Overall points is sum of best games (50 + 35 = 85), ignoring lower replay attempt of 25"
);

console.log("\n=======================================================");
console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log("=======================================================\n");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
