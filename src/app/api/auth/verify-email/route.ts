import { NextResponse } from "next/server";

import { validateVerificationToken } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";

// GET /api/auth/verify-email?token=xxx
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Token is required" },
        { status: 400 }
      );
    }

    const { valid, error, record } = await validateVerificationToken(
      token,
      "email_verification"
    );

    if (!valid || !record) {
      return NextResponse.json(
        { success: false, error: error || "Invalid token" },
        { status: 400 }
      );
    }

    // Mark email as verified and delete the token
    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { emailVerified: true },
      }),
      prisma.verification.delete({ where: { value: token } }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Email verified successfully! You can now sign in.",
    });
  } catch (error) {
    console.error("[VERIFY_EMAIL]", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong." },
      { status: 500 }
    );
  }
}
