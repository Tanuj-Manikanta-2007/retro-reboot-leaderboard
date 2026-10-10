import { NextResponse } from "next/server";
import { isSupabaseConfigured, createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const status = {
    isConfigured: isSupabaseConfigured(),
    url: url || "NOT_SET",
    anonKeySet: Boolean(anon),
    serviceKeySet: Boolean(service),
    anonKeyPreview: anon ? `${anon.slice(0, 15)}...${anon.slice(-10)}` : "NONE",
  };

  try {
    const supa = createAdminClient();
    const { data, error } = await supa.from("games").select("*").limit(10);

    if (error) {
      return NextResponse.json({
        success: false,
        status,
        error: {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        },
      }, { status: 200, headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } });
    }

    return NextResponse.json({
      success: true,
      status,
      message: "Successfully connected to Supabase PostgreSQL database!",
      gamesCount: data?.length ?? 0,
      games: data,
    }, { status: 200, headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      status,
      caughtException: err.message || String(err),
      stack: err.stack,
    }, { status: 200, headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } });
  }
}
