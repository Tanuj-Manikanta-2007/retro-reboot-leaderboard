import { NextRequest, NextResponse } from "next/server";
import { pinVerificationSchema } from "@/lib/validation/schemas";
import { verifyEventPin } from "@/lib/auth/pin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = pinVerificationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid PIN payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { role, pin } = parsed.data;
    const isValid = await verifyEventPin(role, pin);

    if (!isValid) {
      return NextResponse.json(
        { error: `Incorrect ${role === "admin" ? "6-digit Admin" : "4-digit Volunteer"} PIN` },
        { status: 401 }
      );
    }

    let volunteerData: { id: string; code: string; name: string } | undefined;

    if (role === "volunteer") {
      const { volunteerName, volunteerCode } = parsed.data;
      if (!volunteerName?.trim() || !volunteerCode?.trim()) {
        return NextResponse.json(
          { error: "Volunteer name and staff code are required for individual volunteer verification" },
          { status: 400 }
        );
      }

      const { DataStore } = await import("@/services/data-store");
      const profile = await DataStore.getOrCreateVolunteerProfile({
        volunteerCode: volunteerCode.trim(),
        displayName: volunteerName.trim(),
      });

      volunteerData = {
        id: profile.id,
        code: profile.volunteer_code || volunteerCode.trim().toUpperCase(),
        name: profile.display_name || volunteerName.trim(),
      };
    }

    // Set secure cookie for session role access
    const response = NextResponse.json({
      success: true,
      role,
      message: `Verified ${role} event access PIN`,
      volunteer: volunteerData,
    });

    response.cookies.set(`retro_${role}_pin_verified`, "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 12, // 12 hours
      path: "/",
    });

    if (volunteerData) {
      response.cookies.set("retro_volunteer_identity", JSON.stringify(volunteerData), {
        httpOnly: false, // Accessible for client-side display
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 12,
        path: "/",
      });
    }

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal server error during PIN verification" },
      { status: 500 }
    );
  }
}
