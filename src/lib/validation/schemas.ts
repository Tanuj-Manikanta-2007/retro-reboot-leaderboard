import { z } from "zod";
import { normalizeRollNumber } from "../utils";

// 1. PLAYER VALIDATION (Email and Phone are optional alternatives; at least one required)
export const playerSchema = z
  .object({
    full_name: z.string().trim().min(2, "Player name must be at least 2 characters"),
    university_roll_number: z
      .string()
      .trim()
      .min(2, "Roll number must be at least 2 characters")
      .transform(normalizeRollNumber),
    university_email: z.string().trim().optional().nullable().or(z.literal("")),
    mobile_number: z.string().trim().optional().nullable().or(z.literal("")),
    discovery_source: z.string().min(1, "Please select how you heard about the event"),
    is_active: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    const rawEmail = (data.university_email || "").trim();
    const rawMobile = (data.mobile_number || "").trim();

    const hasEmail = rawEmail.length > 0;
    const hasMobile = rawMobile.length > 0;

    if (!hasEmail && !hasMobile) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one contact method (email or phone number) must be provided.",
        path: ["university_email"],
      });
    }

    if (hasEmail) {
      const emailTest = z.string().email().safeParse(rawEmail);
      if (!emailTest.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid university email address format.",
          path: ["university_email"],
        });
      }
    }

    if (hasMobile) {
      const mobileRegex = /^[0-9+\s\-()]{7,15}$/;
      if (!mobileRegex.test(rawMobile)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid mobile phone number format.",
          path: ["mobile_number"],
        });
      }
    }
  });

// 2. GAME VALIDATION
export const gameSchema = z.object({
  name: z.string().trim().min(2, "Game name must be at least 2 characters"),
  description: z.string().trim().optional().nullable(),
  scoring_status: z.enum(["open", "paused", "closed"]).default("open"),
  is_active: z.boolean().default(true),
});

// 3. SCORING RULE RANGE VALIDATION
export const scoringRuleRangeSchema = z
  .object({
    minimum_score: z.number().int().min(0, "Minimum score must be a non-negative integer"),
    maximum_score: z.number().int().min(0, "Maximum score must be a non-negative integer"),
    points_awarded: z
      .number()
      .int()
      .min(1, "Awarded points must be between 1 and 100")
      .max(100, "Awarded points must be between 1 and 100"),
  })
  .refine((data) => data.minimum_score <= data.maximum_score, {
    message: "Minimum score cannot exceed maximum score",
    path: ["maximum_score"],
  });

// 4. SCORE SUBMISSION VALIDATION (Supports Manual & Automatic modes)
export const scoreSubmissionSchema = z
  .object({
    player_id: z.string().uuid("Invalid player ID"),
    game_id: z.string().uuid("Invalid game ID"),
    scoring_method: z.enum(["manual", "automatic"]),
    raw_score: z.number().int().min(0, "Raw score must be a non-negative integer").nullable().optional(),
    awarded_points: z
      .number()
      .int()
      .min(1, "Points must be between 1 and 100")
      .max(100, "Points must be between 1 and 100"),
    idempotency_key: z.string().min(5, "Missing idempotency key"),
  })
  .refine(
    (data) => {
      if (data.scoring_method === "automatic") {
        return data.raw_score !== null && data.raw_score !== undefined;
      }
      return true;
    },
    {
      message: "Raw score is required when automatic scoring mode is selected",
      path: ["raw_score"],
    }
  );

// 5. SCORE CORRECTION REQUEST VALIDATION
export const scoreCorrectionSchema = z
  .object({
    original_attempt_id: z.string().uuid("Invalid attempt ID"),
    requested_player_id: z.string().uuid("Invalid player ID"),
    requested_game_id: z.string().uuid("Invalid game ID"),
    requested_scoring_method: z.enum(["manual", "automatic"]),
    requested_raw_score: z.number().int().min(0, "Raw score must be a non-negative integer").nullable().optional(),
    requested_points: z
      .number()
      .int()
      .min(1, "Points must be between 1 and 100")
      .max(100, "Points must be between 1 and 100"),
    reason: z
      .string()
      .trim()
      .min(5, "Correction reason must be at least 5 characters explaining the change"),
  })
  .refine(
    (data) => {
      if (data.requested_scoring_method === "automatic") {
        return data.requested_raw_score !== null && data.requested_raw_score !== undefined;
      }
      return true;
    },
    {
      message: "Raw score is required when automatic scoring mode is selected",
      path: ["requested_raw_score"],
    }
  );

// 6. EVENT PIN VERIFICATION SCHEMA
export const pinVerificationSchema = z.object({
  role: z.enum(["admin", "volunteer"]),
  pin: z.string().min(4).max(6),
  volunteerName: z.string().trim().optional().nullable().or(z.literal("")),
  volunteerCode: z.string().trim().optional().nullable().or(z.literal("")),
});

// 7. PROTECTED FLUSH DATA SCHEMA
export const flushDataSchema = z.object({
  confirmation_text: z.string(),
  password: z.string().min(1, "Flush password is required"),
  flushScores: z.boolean().optional(),
  flushPlayers: z.boolean().optional(),
  flushGames: z.boolean().optional(),
  flushAuditLogs: z.boolean().optional(),
});
