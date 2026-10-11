import { NextRequest, NextResponse } from "next/server";
import { DataStore } from "@/services/data-store";

// In-memory rate limiting map: ip -> { count, firstAttemptAt }
const failedAttemptsMap = new Map<string, { count: number; firstAttemptAt: number }>();
const MAX_FAILED_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") || "unknown-ip";
}

export async function POST(req: NextRequest) {
  try {
    // 1. Verify Admin Authentication
    const adminVerifiedCookie = req.cookies.get("retro_admin_pin_verified")?.value;
    const adminVerifiedStorage = req.headers.get("x-admin-verified");

    if (adminVerifiedCookie !== "true" && adminVerifiedStorage !== "true") {
      return NextResponse.json(
        { error: "Unauthorized: An authenticated and authorized administrator session is required." },
        { status: 401 }
      );
    }

    const clientIp = getClientIp(req);
    const now = Date.now();

    // 2. Rate Limiting Check
    const rateLimit = failedAttemptsMap.get(clientIp);
    if (rateLimit) {
      if (now - rateLimit.firstAttemptAt > RATE_LIMIT_WINDOW_MS) {
        // Window expired, reset
        failedAttemptsMap.delete(clientIp);
      } else if (rateLimit.count >= MAX_FAILED_ATTEMPTS) {
        const remainingMinutes = Math.ceil(
          (RATE_LIMIT_WINDOW_MS - (now - rateLimit.firstAttemptAt)) / 60000
        );
        return NextResponse.json(
          {
            error: `Too many failed password attempts. Rate limit exceeded. Please wait ${remainingMinutes} minute(s) before trying again.`,
          },
          { status: 429 }
        );
      }
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request payload format." },
        { status: 400 }
      );
    }

    const {
      confirmation_text,
      password,
      flushScores = true,
      flushPlayers = true,
      flushGames = false,
      flushAuditLogs = true,
    } = body;

    // 3. Exact confirmation text validation (must be strictly 'flush')
    if (confirmation_text !== "flush") {
      return NextResponse.json(
        { error: "Invalid confirmation text. You must enter exactly 'flush' in all lowercase." },
        { status: 400 }
      );
    }

    // 4. Server-side password validation
    const configuredPassword = process.env.FLUSH_PASSWORD;
    if (!configuredPassword) {
      console.error("FLUSH_PASSWORD environment variable is not configured on server.");
      return NextResponse.json(
        { error: "FLUSH_PASSWORD environment variable is not configured in the server environment." },
        { status: 500 }
      );
    }

    if (!password || typeof password !== "string" || password !== configuredPassword) {
      // Record failed attempt
      const current = failedAttemptsMap.get(clientIp);
      if (current && now - current.firstAttemptAt <= RATE_LIMIT_WINDOW_MS) {
        current.count += 1;
      } else {
        failedAttemptsMap.set(clientIp, { count: 1, firstAttemptAt: now });
      }

      return NextResponse.json(
        { error: "Invalid flush password. Authentication failed." },
        { status: 403 }
      );
    }

    // Password passed: reset failed attempts
    failedAttemptsMap.delete(clientIp);

    // 5. Execute Flush with strict scope
    const result = await DataStore.flushData({
      flushScores,
      flushPlayers,
      flushGames,
      flushAuditLogs,
    });

    return NextResponse.json({
      success: true,
      message: "Database entries flushed successfully. Table schemas and configuration remain intact.",
      flushed: result.flushed,
    });
  } catch (err: any) {
    console.error("Flush data API error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to flush database entries" },
      { status: 500 }
    );
  }
}
