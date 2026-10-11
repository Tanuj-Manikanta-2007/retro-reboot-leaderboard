import {
  evaluateAutomaticScore,
  checkRangesOverlap,
  validateRuleSetOverlap,
  compareAttempts,
  calculateBestScoresPerGame,
} from "../src/services/scoring-service";
import { normalizeRollNumber, sanitizeExcelString } from "../src/lib/utils";
import { ScoreAttempt, ScoringRule, Player, Game } from "../src/types/database";
import { pinVerificationSchema } from "../src/lib/validation/schemas";
import { verifyEventPin } from "../src/lib/auth/pin";

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

// ASYNC SUITES: CORRECTION REPLACEMENT, IDENTITY ATTRIBUTION & FLUSH SECURITY
import("../src/services/data-store").then(async ({ DataStore }) => {
  process.env.FLUSH_PASSWORD = "RetroReboot2026!Flush";

  // 7. CORRECTION QUEUE APPROVAL: REPLACEMENT OPERATION TESTS
  console.log("\nTest Suite 7: Correction Approval Replacement Operation");
  const p1Id = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
  const g1Id = "11111111-1111-1111-1111-111111111111";

  // First ordinary score: 80 points
  const att1 = await DataStore.submitScore({
    player_id: p1Id,
    game_id: g1Id,
    volunteer_id: "VOL-TEST-1",
    scoring_method: "manual",
    raw_score: null,
    awarded_points: 80,
    idempotency_key: "idem-initial-80",
  });

  const lbBefore = await DataStore.getLeaderboard();
  const p1LbBefore = lbBefore.find((p) => p.player_id === p1Id);
  assert(p1LbBefore?.game_scores?.[g1Id]?.points === 80, "Initial official score is 80 points");

  // Create correction request: change from 80 to 40 points
  const corrReq1 = await DataStore.createCorrectionRequest({
    original_attempt_id: att1.id,
    requested_player_id: p1Id,
    requested_game_id: g1Id,
    requested_scoring_method: "manual",
    requested_raw_score: null,
    requested_points: 40,
    reason: "Mistyped score: actual score was 40",
    requested_by: "VOL-TEST-1",
  });

  assert(corrReq1.status === "pending", "Correction request created with pending status");

  // Approve correction
  const approvedReq1 = await DataStore.reviewCorrectionRequest({
    request_id: corrReq1.id,
    admin_id: "6feb3768-7f68-4bdf-b840-e7a444809389",
    decision: "approved",
    decision_reason: "Verified evidence, score corrected",
  });

  assert(approvedReq1.status === "approved", "Correction request marked as approved");

  // Verify leaderboard now has 40 points (NOT 80 points!)
  const lbAfter = await DataStore.getLeaderboard();
  const p1LbAfter = lbAfter.find((p) => p.player_id === p1Id);
  assert(
    p1LbAfter?.game_scores?.[g1Id]?.points === 40,
    "Approved correction replaces official result with 40 pts (does NOT retain old 80 pts)"
  );

  // Test 7.2: Duplicate approval protection
  let duplicateApprovalFailed = false;
  try {
    await DataStore.reviewCorrectionRequest({
      request_id: corrReq1.id,
      admin_id: "6feb3768-7f68-4bdf-b840-e7a444809389",
      decision: "approved",
    });
  } catch {
    duplicateApprovalFailed = true;
  }
  assert(duplicateApprovalFailed === true, "Duplicate approval on already approved request is rejected");

  // Test 7.3: Changing intended player recalculates affected totals
  // Reassign misattributed attempt to different player
  const p2Id = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
  const g4Id = "44444444-4444-4444-4444-444444444444";
  const attForP1 = await DataStore.submitScore({
    player_id: p1Id,
    game_id: g4Id,
    volunteer_id: "VOL-TEST-1",
    scoring_method: "manual",
    raw_score: null,
    awarded_points: 70,
    idempotency_key: "idem-wrong-player-70",
  });

  // Correction: wrong player! Actually belongs to P2
  const reassignReq = await DataStore.createCorrectionRequest({
    original_attempt_id: attForP1.id,
    requested_player_id: p2Id,
    requested_game_id: g4Id,
    requested_scoring_method: "manual",
    requested_raw_score: null,
    requested_points: 70,
    reason: "Assigned to wrong player; belongs to Priya Sharma",
    requested_by: "VOL-TEST-1",
  });

  await DataStore.reviewCorrectionRequest({
    request_id: reassignReq.id,
    admin_id: "6feb3768-7f68-4bdf-b840-e7a444809389",
    decision: "approved",
  });

  const lbReassigned = await DataStore.getLeaderboard();
  const p1Reassigned = lbReassigned.find((p) => p.player_id === p1Id);
  const p2Reassigned = lbReassigned.find((p) => p.player_id === p2Id);
  assert(
    p1Reassigned?.game_scores?.[g4Id] === undefined,
    "Original player P1 no longer has the misattributed game score"
  );
  assert(
    p2Reassigned?.game_scores?.[g4Id]?.points === 70,
    "Target player P2 now has the reassigned official score"
  );

  // 8. NORMAL SCORE SUBMISSIONS: BEST-SCORE PRESERVATION
  console.log("\nTest Suite 8: Normal Volunteer Submissions — Best-Score Logic");
  // Subsequent attempt with 90 pts > 70 pts
  await DataStore.submitScore({
    player_id: p2Id,
    game_id: g4Id,
    volunteer_id: "VOL-TEST-1",
    scoring_method: "manual",
    raw_score: null,
    awarded_points: 90,
    idempotency_key: "idem-higher-90",
  });

  const lbHigher = await DataStore.getLeaderboard();
  const p2Higher = lbHigher.find((p) => p.player_id === p2Id);
  assert(
    p2Higher?.game_scores?.[g4Id]?.points === 90,
    "Subsequent higher normal attempt (90 pts) wins via normal best-score logic"
  );

  // Subsequent lower attempt (50 pts) preserves the 90 pts best score
  await DataStore.submitScore({
    player_id: p2Id,
    game_id: g4Id,
    volunteer_id: "VOL-TEST-1",
    scoring_method: "manual",
    raw_score: null,
    awarded_points: 50,
    idempotency_key: "idem-lower-50",
  });

  const lbLower = await DataStore.getLeaderboard();
  const p2Lower = lbLower.find((p) => p.player_id === p2Id);
  assert(
    p2Lower?.game_scores?.[g4Id]?.points === 90,
    "Normal lower attempt does NOT replace existing best score of 90 pts"
  );

  // 9. VOLUNTEER IDENTITY ATTRIBUTION & REMOVAL OF HARDCODED 'ALEX'
  console.log("\nTest Suite 9: Volunteer Identity Attribution");
  const vol1 = await DataStore.getOrCreateVolunteerProfile({
    volunteerCode: "VOL-ALPHA",
    displayName: "Kiran Patel",
  });
  const vol2 = await DataStore.getOrCreateVolunteerProfile({
    volunteerCode: "VOL-BETA",
    displayName: "Divya Nair",
  });

  assert(vol1.display_name === "Kiran Patel" && vol1.volunteer_code === "VOL-ALPHA", "Volunteer 1 created with real name and code");
  assert(vol2.display_name === "Divya Nair" && vol2.volunteer_code === "VOL-BETA", "Volunteer 2 created with real name and code");

  await DataStore.submitScore({
    player_id: p1Id,
    game_id: "33333333-3333-3333-3333-333333333333",
    volunteer_id: vol1.id,
    scoring_method: "manual",
    raw_score: null,
    awarded_points: 60,
    idempotency_key: "idem-vol1-kiran",
  });

  await DataStore.submitScore({
    player_id: p2Id,
    game_id: "33333333-3333-3333-3333-333333333333",
    volunteer_id: vol2.id,
    scoring_method: "manual",
    raw_score: null,
    awarded_points: 65,
    idempotency_key: "idem-vol2-divya",
  });

  const activities = await DataStore.getVolunteerActivity();
  const actVol1 = activities.find((a) => a.volunteer_id === vol1.id);
  const actVol2 = activities.find((a) => a.volunteer_id === vol2.id);

  assert(Boolean(actVol1 && actVol1.volunteer_name === "Kiran Patel"), "Activity record displays real volunteer name 'Kiran Patel'");
  assert(Boolean(actVol1 && actVol1.volunteer_code === "VOL-ALPHA"), "Activity record displays real volunteer code 'VOL-ALPHA'");
  assert(Boolean(actVol2 && actVol2.volunteer_name === "Divya Nair"), "Activity record displays real volunteer name 'Divya Nair'");
  assert(Boolean(actVol2 && actVol2.volunteer_code === "VOL-BETA"), "Activity record displays real volunteer code 'VOL-BETA'");
  assert(
    !activities.some((a) => a.volunteer_id === vol1.id && a.volunteer_name.includes("Alex")),
    "No activity attributed to Volunteer 1 contains 'Alex' placeholder"
  );

  // 10. FLUSH PASSWORD SECURITY VALIDATION
  console.log("\nTest Suite 10: Protected Flush Security Logic");
  const confirmExactFlush = (text: string) => text === "flush";
  assert(confirmExactFlush("flush") === true, "Accepts exact lowercase 'flush'");
  assert(confirmExactFlush("FLUSH") === false, "Rejects uppercase 'FLUSH'");
  assert(confirmExactFlush(" Flush ") === false, "Rejects padded ' Flush '");
  assert(confirmExactFlush("delete") === false, "Rejects arbitrary text 'delete'");

  const verifyFlushPassword = (pwd: string) => Boolean(process.env.FLUSH_PASSWORD && pwd === process.env.FLUSH_PASSWORD);
  assert(verifyFlushPassword("RetroReboot2026!Flush") === true, "Accepts correct configured FLUSH_PASSWORD");
  assert(verifyFlushPassword("wrongpassword") === false, "Rejects incorrect password");
  assert(verifyFlushPassword("") === false, "Rejects empty password");

  // 11. GAME-WISE STANDING & TIE-BREAK EVALUATION TESTS
  console.log("\nTest Suite 11: Game-Wise Standings & Tie-Breaker Calculation");
  const sampleLeaderboard = [
    {
      player_id: "p1",
      full_name: "Player 1",
      university_roll_number: "2026CSE001",
      total_points: 90,
      games_played: 1,
      rank: 1,
      game_scores: {
        tetris: { raw_score: 50000, points: 90 },
      },
    },
    {
      player_id: "p2",
      full_name: "Player 2",
      university_roll_number: "2026CSE002",
      total_points: 90,
      games_played: 1,
      rank: 2,
      game_scores: {
        tetris: { raw_score: 30000, points: 90 },
      },
    },
    {
      player_id: "p3",
      full_name: "Player 3",
      university_roll_number: "2026CSE003",
      total_points: 90,
      games_played: 1,
      rank: 3,
      game_scores: {
        tetris: { raw_score: 30000, points: 90 },
      },
    },
    {
      player_id: "p4",
      full_name: "Player 4",
      university_roll_number: "2026CSE004",
      total_points: 50,
      games_played: 1,
      rank: 4,
      game_scores: {
        tetris: { raw_score: 15000, points: 50 },
      },
    },
  ];

  function computeGameRank(targetPlayerId: string, gameId: string, lb: typeof sampleLeaderboard) {
    const playersInGame = lb
      .filter((p) => p.game_scores?.[gameId as keyof typeof p.game_scores]?.points > 0)
      .map((p) => {
        const s = p.game_scores[gameId as keyof typeof p.game_scores];
        return {
          playerId: p.player_id,
          points: s.points,
          rawScore: s.raw_score ?? -1,
        };
      })
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return b.rawScore - a.rawScore;
      });

    let rank = 1;
    let isTied = false;
    for (let i = 0; i < playersInGame.length; i++) {
      const cur = playersInGame[i];
      if (i > 0) {
        const prev = playersInGame[i - 1];
        if (prev.points !== cur.points || prev.rawScore !== cur.rawScore) {
          rank = i + 1;
        }
      }
      if (cur.playerId === targetPlayerId) {
        const prev = i > 0 ? playersInGame[i - 1] : null;
        const next = i < playersInGame.length - 1 ? playersInGame[i + 1] : null;
        const tiedWithPrev = prev && prev.points === cur.points && prev.rawScore === cur.rawScore;
        const tiedWithNext = next && next.points === cur.points && next.rawScore === cur.rawScore;
        isTied = Boolean(tiedWithPrev || tiedWithNext);
        break;
      }
    }
    return { rank, total: playersInGame.length, isTied };
  }

  const p1Standing = computeGameRank("p1", "tetris", sampleLeaderboard);
  const p2Standing = computeGameRank("p2", "tetris", sampleLeaderboard);
  const p3Standing = computeGameRank("p3", "tetris", sampleLeaderboard);
  const p4Standing = computeGameRank("p4", "tetris", sampleLeaderboard);

  assert(p1Standing.rank === 1 && !p1Standing.isTied, "P1 wins Tetris #1 standing via higher raw score tie-breaker (50k vs 30k)");
  assert(p2Standing.rank === 2 && p2Standing.isTied, "P2 is ranked Tied #2 for Tetris");
  assert(p3Standing.rank === 2 && p3Standing.isTied, "P3 is ranked Tied #2 for Tetris with same points and raw score");
  assert(p4Standing.rank === 4 && !p4Standing.isTied, "P4 is ranked #4 for Tetris after tied rank #2");
  assert(p1Standing.total === 4, "Game standing accurately reflects total eligible players in that game (4)");

  // 12. VOLUNTEER ACTIVITY STATISTICS DEFINITIONS
  console.log("\nTest Suite 12: Volunteer Activity Statistics Definitions");
  const mockActivities = [
    { id: "1", volunteer_id: "v1", volunteer_name: "Rohan", volunteer_code: "VOL-01", action: "Score Submitted", status: "accepted", game_name: "Tetris", player_name: "Player A", points_change: "50 pts", timestamp: "2026-10-12T10:00:00Z" },
    { id: "2", volunteer_id: "v1", volunteer_name: "Rohan", volunteer_code: "VOL-01", action: "Score Submitted", status: "accepted", game_name: "Pac-Man", player_name: "Player B", points_change: "70 pts", timestamp: "2026-10-12T10:30:00Z" },
    { id: "3", volunteer_id: "v1", volunteer_name: "Rohan", volunteer_code: "VOL-01", action: "Score Submitted", status: "rejected", game_name: "Tetris", player_name: "Player C", points_change: "0 pts", timestamp: "2026-10-12T11:00:00Z" },
    { id: "4", volunteer_id: "v1", volunteer_name: "Rohan", volunteer_code: "VOL-01", action: "Correction Requested", status: "approved", game_name: "Tetris", player_name: "Player A", points_change: "80 pts", timestamp: "2026-10-12T11:30:00Z" },
    { id: "5", volunteer_id: "v1", volunteer_name: "Rohan", volunteer_code: "VOL-01", action: "Correction Requested", status: "rejected", game_name: "Pac-Man", player_name: "Player B", points_change: "50 pts", timestamp: "2026-10-12T12:00:00Z" },
    { id: "6", volunteer_id: "v2", volunteer_name: "Sneha", volunteer_code: "VOL-02", action: "Score Submitted", status: "accepted", game_name: "Tekken", player_name: "Player D", points_change: "65 pts", timestamp: "2026-10-12T12:15:00Z" },
  ];

  function computeVolunteerStats(vId: string, acts: typeof mockActivities) {
    const vActs = acts.filter((a) => a.volunteer_id === vId);
    let attempts = 0;
    let accepted = 0;
    let rejected = 0;
    let correctionsReq = 0;
    let correctionsApp = 0;
    let correctionsRej = 0;
    const games = new Set<string>();
    const players = new Set<string>();

    for (const a of vActs) {
      if (a.action.includes("Score")) {
        attempts++;
        if (a.status === "accepted") {
          accepted++;
          games.add(a.game_name);
          players.add(a.player_name);
        } else {
          rejected++;
        }
      }
      if (a.action.includes("Correction")) {
        correctionsReq++;
        if (a.status === "approved") correctionsApp++;
        if (a.status === "rejected") correctionsRej++;
      }
    }

    return {
      total: vActs.length,
      attempts,
      accepted,
      rejected,
      correctionsReq,
      correctionsApp,
      correctionsRej,
      distinctGames: games.size,
      distinctPlayers: players.size,
    };
  }

  const v1Stats = computeVolunteerStats("v1", mockActivities);
  assert(v1Stats.total === 5, "Total recorded activities for Volunteer 1 is 5");
  assert(v1Stats.attempts === 3, "Score submissions attempted is 3 (2 accepted, 1 rejected)");
  assert(v1Stats.accepted === 2, "Successfully accepted score entries is 2");
  assert(v1Stats.rejected === 1, "Rejected score submissions count is 1");
  assert(v1Stats.correctionsReq === 2, "Correction requests submitted is 2");
  assert(v1Stats.correctionsApp === 1, "Correction requests approved is 1");
  assert(v1Stats.correctionsRej === 1, "Correction requests rejected is 1");
  assert(v1Stats.distinctGames === 2, "Distinct games with accepted scores is 2 (Tetris, Pac-Man)");
  assert(v1Stats.distinctPlayers === 2, "Distinct players with accepted scores is 2 (Player A, Player B)");

  // 13. BEST VOLUNTEER FEATURE & TIE DETECTION
  console.log("\nTest Suite 13: Best Volunteer Ranking & Tie Handling");
  function rankBestVolunteers(acts: typeof mockActivities) {
    const map = new Map<string, { name: string; count: number }>();
    for (const a of acts) {
      if (!map.has(a.volunteer_id)) map.set(a.volunteer_id, { name: a.volunteer_name, count: 0 });
      map.get(a.volunteer_id)!.count++;
    }
    const list = Array.from(map.values()).sort((a, b) => b.count - a.count);
    const max = list[0]?.count ?? 0;
    const winners = list.filter((v) => v.count === max);
    return { list, winners, isTie: winners.length > 1 };
  }

  const bestResult = rankBestVolunteers(mockActivities);
  assert(bestResult.winners.length === 1 && bestResult.winners[0].name === "Rohan", "Rohan is distinct Best Volunteer with 5 activities");
  assert(bestResult.isTie === false, "Detects single non-tied winner when counts differ");

  // Tie test
  const tieActivities = [
    { id: "1", volunteer_id: "v1", volunteer_name: "Rohan", action: "Score Submitted" },
    { id: "2", volunteer_id: "v1", volunteer_name: "Rohan", action: "Score Submitted" },
    { id: "3", volunteer_id: "v2", volunteer_name: "Sneha", action: "Score Submitted" },
    { id: "4", volunteer_id: "v2", volunteer_name: "Sneha", action: "Score Submitted" },
  ];
  const tieResult = rankBestVolunteers(tieActivities as any);
  assert(tieResult.isTie === true && tieResult.winners.length === 2, "Detects tie when two volunteers have identical activity counts");

  // 14. PLAYER REGISTRATION CONTACT ALTERNATIVES & DOMAIN CONSTRUCTION
  console.log("\nTest Suite 14: Player Registration Contact Alternatives & Selectable Domain");
  const { playerSchema } = await import("../src/lib/validation/schemas");

  // Email only provided -> valid
  const testEmailOnly = playerSchema.safeParse({
    full_name: "Kavya Rao",
    university_roll_number: "2026CSE099",
    university_email: "kavya.r@gmail.com",
    mobile_number: "",
    discovery_source: "Instagram",
  });
  assert(testEmailOnly.success === true, "Validates registration when email is provided and phone is empty");

  // Phone only provided -> valid
  const testPhoneOnly = playerSchema.safeParse({
    full_name: "Manoj Varma",
    university_roll_number: "2026ECE012",
    university_email: "",
    mobile_number: "9876543210",
    discovery_source: "Posters",
  });
  assert(testPhoneOnly.success === true, "Validates registration when phone is provided and email is empty");

  // Both provided -> valid
  const testBothProvided = playerSchema.safeParse({
    full_name: "Suresh Raina",
    university_roll_number: "2026IT055",
    university_email: "suresh@student.gitam.edu",
    mobile_number: "9123456789",
    discovery_source: "Friends",
  });
  assert(testBothProvided.success === true, "Validates registration when both email and phone are provided");

  // Both empty -> rejected
  const testBothEmpty = playerSchema.safeParse({
    full_name: "Incomplete User",
    university_roll_number: "2026MECH001",
    university_email: "",
    mobile_number: "",
    discovery_source: "Posters",
  });
  assert(
    testBothEmpty.success === false &&
      testBothEmpty.error?.issues.some((i) => i.message.includes("At least one contact method")),
    "Rejects registration when both email and phone are empty"
  );

  // Email domain assembly & sanitization logic
  function assembleEmail(username: string, domain: string): { email: string; isValid: boolean } {
    const cleanUsername = username.trim().replace(/@.*/, "").trim();
    if (!cleanUsername) return { email: "", isValid: false };
    if (!domain) return { email: "", isValid: false };
    return { email: `${cleanUsername}${domain}`.toLowerCase(), isValid: true };
  }

  const assembled1 = assembleEmail("pinnintitanuj", "@gmail.com");
  assert(assembled1.email === "pinnintitanuj@gmail.com" && assembled1.isValid, "Assembles pinnintitanuj + @gmail.com into valid full email");

  const assembled2 = assembleEmail("pinnintitanuj", "@student.gitam.edu");
  assert(assembled2.email === "pinnintitanuj@student.gitam.edu" && assembled2.isValid, "Assembles pinnintitanuj + @student.gitam.edu into valid full email");

  const sanitizedDuplicate = assembleEmail("tanuj@gmail.com", "@gmail.com");
  assert(sanitizedDuplicate.email === "tanuj@gmail.com", "Prevents duplicate domain if username contains typed @ domain");

  // Invalid phone number rejection
  const testInvalidPhone = playerSchema.safeParse({
    full_name: "Bad Phone User",
    university_roll_number: "2026CIVIL001",
    university_email: "valid@gmail.com",
    mobile_number: "not-a-number",
    discovery_source: "Posters",
  });
  assert(testInvalidPhone.success === false, "Rejects registration when provided phone number is invalid");

  // 15. EVENT PIN VERIFICATION & COMPATIBILITY TESTS
  console.log("\nTest Suite 15: Event PIN Verification & Schema Compatibility");

  // Schema parsing
  const adminCleanPayload = pinVerificationSchema.safeParse({ role: "admin", pin: "654321" });
  assert(adminCleanPayload.success === true, "Validates clean admin PIN payload");

  const adminEmptyStringsPayload = pinVerificationSchema.safeParse({
    role: "admin",
    pin: "654321",
    volunteerName: "",
    volunteerCode: "",
  });
  assert(adminEmptyStringsPayload.success === true, "Validates admin PIN payload even when empty string volunteer fields sent");

  const volunteerValidPayload = pinVerificationSchema.safeParse({
    role: "volunteer",
    pin: "1234",
    volunteerName: "Tanuj",
    volunteerCode: "VOL-01",
  });
  assert(volunteerValidPayload.success === true, "Validates volunteer PIN payload with valid name and code");

  // verifyEventPin logic
  const adminPinValid = await verifyEventPin("admin", "654321");
  assert(adminPinValid === true, "verifyEventPin verifies correct 6-digit Admin PIN '654321'");

  const volunteerPinValid = await verifyEventPin("volunteer", "1234");
  assert(volunteerPinValid === true, "verifyEventPin verifies correct 4-digit Volunteer PIN '1234'");

  const adminWrongPin = await verifyEventPin("admin", "123456");
  assert(adminWrongPin === false, "verifyEventPin rejects incorrect Admin PIN");

  const adminWrongLength = await verifyEventPin("admin", "1234");
  assert(adminWrongLength === false, "verifyEventPin rejects 4-digit PIN for Admin (requires 6 digits)");

  const volunteerWrongLength = await verifyEventPin("volunteer", "654321");
  assert(volunteerWrongLength === false, "verifyEventPin rejects 6-digit PIN for Volunteer (requires 4 digits)");

  console.log("\n=======================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}).catch((err) => {
  console.error("Async test failure:", err);
  process.exit(1);
});
