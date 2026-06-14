import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

// POST /api/invite/accept — accept a workspace invitation
export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { token } = await req.json();
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Token is required" },
        { status: 400 }
      );
    }

    const invite = await prisma.workspaceInvite.findUnique({
      where: { token },
      include: { workspace: true },
    });

    if (!invite) {
      return NextResponse.json(
        { success: false, error: "Invitation not found" },
        { status: 404 }
      );
    }
    if (invite.status !== "PENDING") {
      return NextResponse.json(
        {
          success: false,
          error: "This invitation has already been used or revoked",
        },
        { status: 400 }
      );
    }
    if (invite.expiresAt < new Date()) {
      await prisma.workspaceInvite.update({
        where: { token },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json(
        { success: false, error: "This invitation has expired" },
        { status: 400 }
      );
    }

    // Verify email matches (unless it's an open invite)
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    if (invite.email !== currentUser?.email) {
      return NextResponse.json(
        {
          success: false,
          error: "This invitation was sent to a different email address",
        },
        { status: 403 }
      );
    }

    // Check not already a member
    const existing = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: invite.workspaceId,
          userId: session.user.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "You are already a member of this workspace" },
        { status: 409 }
      );
    }

    // Add member and mark invite as accepted in one transaction
    await prisma.$transaction([
      prisma.workspaceMember.create({
        data: {
          workspaceId: invite.workspaceId,
          userId: session.user.id,
          role: invite.role,
        },
      }),
      prisma.workspaceInvite.update({
        where: { token },
        data: { status: "ACCEPTED", invitedUserId: session.user.id },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        workspaceId: invite.workspaceId,
        workspaceSlug: invite.workspace.slug,
      },
      message: `Welcome to ${invite.workspace.name}!`,
    });
  } catch (error) {
    console.error("[INVITE_ACCEPT]", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong." },
      { status: 500 }
    );
  }
}
