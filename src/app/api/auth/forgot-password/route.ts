import { NextResponse } from "next/server";
// import { db } from "@/lib/db";
import {
  createVerificationToken,
  validateVerificationToken,
  hashPassword,
  sendPasswordResetEmail,
} from "@/lib/auth-utils";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/validations/authValidation";
import prisma from "@/lib/prisma";

// POST /api/auth/forgot-password
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email } = parsed.data;
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!user || !user.password) {
      return NextResponse.json({
        success: true,
        message: "If an account exists, a reset link has been sent.",
      });
    }

    const token = await createVerificationToken(user.id, "password_reset", 1); // 1 hour
    await sendPasswordResetEmail(user.email, token);

    return NextResponse.json({
      success: true,
      message: "If an account exists, a reset link has been sent.",
    });
  } catch (error) {
    console.error("[FORGOT_PASSWORD]", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong." },
      { status: 500 }
    );
  }
}
