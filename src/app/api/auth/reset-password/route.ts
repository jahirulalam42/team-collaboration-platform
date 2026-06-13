// app/api/auth/reset-password/route.ts
import { NextResponse } from "next/server";
import { validateVerificationToken, hashPassword } from "@/lib/auth-utils";
import { resetPasswordSchema } from "@/lib/validations/authValidation";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      // Access errors correctly – `error.format()` or `error.errors`
      const errorMessage = parsed.error.issues[0]?.message || "Invalid input";
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 400 }
      );
    }

    const { token, password } = parsed.data;

    const { valid, error, record } = await validateVerificationToken(
      token,
      "password_reset"
    );

    if (!valid || !record) {
      return NextResponse.json(
        { success: false, error: error || "Invalid or expired token" },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { password: hashedPassword },
      }),
      prisma.verification.delete({
        where: { value: token },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Password reset successfully. You can now sign in.",
    });
  } catch (error) {
    console.error("[RESET_PASSWORD]", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong." },
      { status: 500 }
    );
  }
}
