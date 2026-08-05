// lib/auth-utils.ts

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { randomBytes } from "crypto";

// Initialize Nodemailer transporter using SMTP environment variables
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465, // true for port 465, false for 587 and others
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ---------- Password hashing ----------
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(
  plain: string,
  hashed: string
): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}

// ---------- Verification token helpers ----------
/**
 * Creates a verification token for a user.
 * @param userId - The user's ID
 * @param operation - e.g., "password_reset", "email_verification"
 * @param expiresInHours - Token validity in hours (default 1)
 * @returns The generated token string
 */
export async function createVerificationToken(
  userId: string,
  operation: string,
  expiresInHours = 1
): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

  await prisma.verification.create({
    data: {
      identifier: `${operation}:${userId}`,
      value: token,
      expiresAt,
    },
  });

  return token;
}

/**
 * Validate a verification token for a specific operation (e.g., "password_reset", "email_verification")
 * Returns an object with:
 * - valid: boolean
 * - error: string | null
 * - record: the Verification record (if found and valid) or null
 */
export async function validateVerificationToken(
  token: string,
  operation: string
): Promise<{
  valid: boolean;
  error: string | null;
  record: { userId: string; verificationId: string } | null;
}> {
  const verification = await prisma.verification.findUnique({
    where: { value: token },
  });

  if (!verification) {
    return { valid: false, error: "Invalid token", record: null };
  }
  if (verification.expiresAt < new Date()) {
    return { valid: false, error: "Token has expired", record: null };
  }

  const [op, userId] = verification.identifier.split(":");
  if (op !== operation || !userId) {
    return { valid: false, error: "Invalid token", record: null };
  }

  return {
    valid: true,
    error: null,
    record: { userId, verificationId: verification.id },
  };
}

// ---------- Email sender using Nodemailer ----------
/**
 * Sends a password reset email to the user using Nodemailer.
 * @param email - Recipient email address
 * @param token - The password reset token (to be included in the link)
 */
export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.BETTER_AUTH_URL}/reset-password?token=${token}`;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: "Reset your password",
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
          <h2>Reset your password</h2>
          <p>You requested a password reset.</p>
          <p>Click the link below to reset your password (valid for 1 hour):</p>
          <a href="${resetUrl}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Reset Password</a>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p><code style="background: #f3f4f6; padding: 8px; display: block; word-break: break-all;">${resetUrl}</code></p>
          <p>If you did not request this, please ignore this email.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw new Error(
      "Failed to send password reset email. Please try again later."
    );
  }
}

/**
 * Sends a workspace invitation email using Nodemailer.
 * @param to - Recipient email address
 * @param inviteToken - The unique invite token
 * @param workspaceId - Workspace ID (to be included in the accept link)
 * @param workspaceName - Name of the workspace
 * @param inviterName - Name of the person who sent the invite
 */
export async function sendInviteEmail({
  to,
  inviteToken,
  workspaceId,
  workspaceName,
  inviterName,
}: {
  to: string;
  inviteToken: string;
  workspaceId: string;
  workspaceName: string;
  inviterName: string;
}) {
  const acceptUrl = `${process.env.BETTER_AUTH_URL}/invite/accept?workspaceId=${workspaceId}&token=${inviteToken}`;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject: `You're invited to join ${workspaceName} on SyncSpace`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
          <h2>You're invited!</h2>
          <p><strong>${inviterName}</strong> has invited you to join the workspace <strong>${workspaceName}</strong> on SyncSpace.</p>
          <p>Click the button below to accept the invitation:</p>
          <a href="${acceptUrl}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Accept Invitation</a>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p><code style="background: #f3f4f6; padding: 8px; display: block; word-break: break-all;">${acceptUrl}</code></p>
          <p>This invite expires in <strong>7 days</strong>.</p>
          <p>If you don't have a SyncSpace account yet, you'll be prompted to create one before joining.</p>
          <hr />
          <p style="font-size: 12px; color: #6b7280;">You received this email because someone invited you to a workspace on SyncSpace.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Error sending invite email:", error);
    throw new Error("Failed to send invitation email. Please try again later.");
  }
}
