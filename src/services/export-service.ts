import ExcelJS from "exceljs";
import { Game, Player, ScoreAttempt } from "@/types/database";
import { sanitizeExcelString } from "@/lib/utils";
import { calculateBestScoresPerGame } from "./scoring-service";

/**
 * Creates and formats an ExcelJS Workbook with consistent styling
 */
function createBaseWorkbook(sheetName: string): { workbook: ExcelJS.Workbook; worksheet: ExcelJS.Worksheet } {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Retro Reboot by COGAAN";
  workbook.created = new Date();
  const worksheet = workbook.addWorksheet(sheetName, {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  return { workbook, worksheet };
}

/**
 * Applies header styling and auto-fits column widths
 */
function styleWorksheet(worksheet: ExcelJS.Worksheet) {
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF181D2D" }, // Dark charcoal/navy
  };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
  headerRow.height = 28;

  // Auto-adjust column width based on content
  worksheet.columns.forEach((col) => {
    let maxLen = 12;
    if (col && col.eachCell) {
      col.eachCell({ includeEmpty: false }, (cell) => {
        const cellValue = cell.value ? String(cell.value) : "";
        if (cellValue.length > maxLen) {
          maxLen = cellValue.length;
        }
      });
    }
    col.width = Math.min(Math.max(maxLen + 4, 14), 45);
  });
}

/**
 * 1. PLAYER-WISE GAME POINTS REPORT (Matrix Export)
 * Exact Columns:
 * University Roll Number | Player Name | Player Email ID | Player Phone Number | [Game 1] | [Game 2] | ... | Total Points
 */
export async function generatePlayerWisePointsReport(
  players: Player[],
  games: Game[],
  acceptedAttempts: ScoreAttempt[]
): Promise<Buffer> {
  const { workbook, worksheet } = createBaseWorkbook("Player Points Report");

  // Build dynamic headers
  const sortedGames = [...games].sort((a, b) => a.name.localeCompare(b.name));
  const columns: Partial<ExcelJS.Column>[] = [
    { header: "University Roll Number", key: "roll_number" },
    { header: "Player Name", key: "full_name" },
    { header: "Player Email ID", key: "email" },
    { header: "Player Phone Number", key: "mobile" },
    ...sortedGames.map((game) => ({
      header: game.name,
      key: `game_${game.id}`,
    })),
    { header: "Total Points", key: "total_points" },
  ];

  worksheet.columns = columns;

  // Group attempts by player
  const attemptsByPlayer = new Map<string, ScoreAttempt[]>();
  for (const att of acceptedAttempts) {
    if (!attemptsByPlayer.has(att.player_id)) {
      attemptsByPlayer.set(att.player_id, []);
    }
    attemptsByPlayer.get(att.player_id)!.push(att);
  }

  // Populate row for every registered player
  for (const player of players) {
    const playerAttempts = attemptsByPlayer.get(player.id) || [];
    const bestByGame = calculateBestScoresPerGame(playerAttempts);

    const rowData: Record<string, any> = {
      roll_number: sanitizeExcelString(player.university_roll_number),
      full_name: sanitizeExcelString(player.full_name),
      email: sanitizeExcelString(player.university_email),
      mobile: sanitizeExcelString(player.mobile_number),
    };

    let totalPoints = 0;
    for (const game of sortedGames) {
      const best = bestByGame.get(game.id);
      const points = best ? best.awarded_points : 0;
      rowData[`game_${game.id}`] = points;
      totalPoints += points;
    }

    rowData.total_points = totalPoints;

    const row = worksheet.addRow(rowData);

    // Format roll number and phone number explicitly as Text
    row.getCell("roll_number").numFmt = "@";
    row.getCell("mobile").numFmt = "@";
    row.alignment = { vertical: "middle" };
  }

  // Enable auto-filter across all columns
  if (players.length > 0) {
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: players.length + 1, column: columns.length },
    };
  }

  styleWorksheet(worksheet);
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * 2. FULL SCORE HISTORY EXPORT
 */
export async function generateScoreHistoryExport(attempts: ScoreAttempt[]): Promise<Buffer> {
  const { workbook, worksheet } = createBaseWorkbook("Score History");

  worksheet.columns = [
    { header: "Attempt ID", key: "id" },
    { header: "Timestamp (UTC)", key: "created_at" },
    { header: "Roll Number", key: "roll_number" },
    { header: "Player Name", key: "player_name" },
    { header: "Game Name", key: "game_name" },
    { header: "Scoring Method", key: "method" },
    { header: "Raw Score", key: "raw_score" },
    { header: "Awarded Points", key: "points" },
    { header: "Volunteer ID / Code", key: "volunteer" },
    { header: "Rule Version", key: "rule_version" },
    { header: "Status", key: "status" },
  ];

  for (const att of attempts) {
    const row = worksheet.addRow({
      id: att.id,
      created_at: new Date(att.created_at).toISOString(),
      roll_number: sanitizeExcelString(att.player?.university_roll_number || ""),
      player_name: sanitizeExcelString(att.player?.full_name || ""),
      game_name: sanitizeExcelString(att.game?.name || ""),
      method: att.scoring_method,
      raw_score: att.raw_score !== null ? att.raw_score : "N/A (Direct)",
      points: att.awarded_points,
      volunteer: sanitizeExcelString(att.volunteer?.volunteer_code || att.volunteer_id),
      rule_version: att.rule_version || "Manual",
      status: att.status,
    });
    row.getCell("roll_number").numFmt = "@";
  }

  styleWorksheet(worksheet);
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * 3. PLAYER REGISTRATIONS EXPORT
 */
export async function generatePlayersExport(players: Player[]): Promise<Buffer> {
  const { workbook, worksheet } = createBaseWorkbook("Player Registrations");

  worksheet.columns = [
    { header: "University Roll Number", key: "roll_number" },
    { header: "Player Name", key: "full_name" },
    { header: "University Email", key: "email" },
    { header: "Mobile Number", key: "mobile" },
    { header: "Discovery Source", key: "source" },
    { header: "Status", key: "status" },
    { header: "Registered At", key: "created_at" },
  ];

  for (const p of players) {
    const row = worksheet.addRow({
      roll_number: sanitizeExcelString(p.university_roll_number),
      full_name: sanitizeExcelString(p.full_name),
      email: sanitizeExcelString(p.university_email),
      mobile: sanitizeExcelString(p.mobile_number),
      source: sanitizeExcelString(p.discovery_source),
      status: p.is_active ? "Active" : "Deactivated",
      created_at: new Date(p.created_at).toISOString(),
    });
    row.getCell("roll_number").numFmt = "@";
    row.getCell("mobile").numFmt = "@";
  }

  styleWorksheet(worksheet);
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * 4. OFFICIAL LEADERBOARD EXPORT
 */
export async function generateLeaderboardExport(
  leaderboardData: Array<{
    rank: number;
    full_name: string;
    university_roll_number: string;
    total_points: number;
    games_played: number;
  }>
): Promise<Buffer> {
  const { workbook, worksheet } = createBaseWorkbook("Official Leaderboard");

  worksheet.columns = [
    { header: "Rank", key: "rank" },
    { header: "University Roll Number", key: "roll_number" },
    { header: "Player Name", key: "full_name" },
    { header: "Total Points", key: "total_points" },
    { header: "Games Played", key: "games_played" },
  ];

  for (const entry of leaderboardData) {
    const row = worksheet.addRow({
      rank: entry.rank,
      roll_number: sanitizeExcelString(entry.university_roll_number),
      full_name: sanitizeExcelString(entry.full_name),
      total_points: entry.total_points,
      games_played: entry.games_played,
    });
    row.getCell("roll_number").numFmt = "@";
  }

  styleWorksheet(worksheet);
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
