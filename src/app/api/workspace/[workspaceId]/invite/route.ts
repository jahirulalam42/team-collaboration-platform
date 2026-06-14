// app/api/workspace/[workspaceId]/invite/route.ts — Send & accept invites

import { NextRequest } from "next/server";
import { requireSession, requireWorkspaceMember } from "@/lib/session";
import { inviteMemberSchema } from "@/lib/validations/workspace";
import { createErrorResponse, ApiError } from "@/lib/errors";
import { sendInviteEmail } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";
import { getInviteExpiry } from "@/lib/utils";

type Params = { params: Promise<{ workspaceId: string }> };

/** POST /api/workspace/:id/invite — send an invite email */
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { workspaceId } = await params;
    const session = await requireSession();
    await requireWorkspaceMember(workspaceId, session.user.id, [
      "OWNER",
      "ADMIN",
    ]);

    const body = await req.json();
    const parsed = inviteMemberSchema.safeParse(body);
    if (!parsed.success)
      throw new ApiError(422, parsed.error.issues[0].message);

    const { email, role } = parsed.data;

    // Check if already a member
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existingUser) {
      const alreadyMember = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId: existingUser.id,
          },
        },
      });
      if (alreadyMember)
        throw new ApiError(409, "This user is already a member");
    }

    // Cancel any existing pending invites for the same email
    await prisma.workspaceInvite.updateMany({
      where: { workspaceId, email, status: "PENDING" },
      data: { status: "EXPIRED" },
    });

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { name: true },
    });

    if (!workspace) throw new ApiError(404, "Workspace not found");

    const invite = await prisma.workspaceInvite.create({
      data: {
        workspaceId,
        email,
        role,
        invitedById: session.user.id,
        expiresAt: getInviteExpiry(),
      },
    });

    // Send the invitation email via Resend
    await sendInviteEmail({
      to: email,
      inviteToken: invite.token,
      workspaceId,
      workspaceName: workspace.name,
      inviterName: session.user.name || session.user.email || "Someone",
    });

    return Response.json({ invite, message: "Invite sent" }, { status: 201 });
  } catch (error) {
    return createErrorResponse(error);
  }
}

/** GET /api/workspace/:id/invite?token=xxx — accept an invite */
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { workspaceId } = await params; // we may not need it if token is enough, but we keep for consistency
    const session = await requireSession();
    const token = req.nextUrl.searchParams.get("token");
    if (!token) throw new ApiError(422, "token query param is required");

    const invite = await prisma.workspaceInvite.findUnique({
      where: { token },
      include: { workspace: { select: { name: true, id: true } } },
    });

    if (!invite) throw new ApiError(404, "Invite not found");
    if (invite.status !== "PENDING")
      throw new ApiError(409, "This invite has already been used");
    if (invite.expiresAt < new Date()) {
      await prisma.workspaceInvite.update({
        where: { token },
        data: { status: "EXPIRED" },
      });
      throw new ApiError(409, "This invite has expired");
    }
    // Optional: verify that the invite belongs to the workspaceId from path?
    // We can trust token, but for extra security:
    if (invite.workspaceId !== workspaceId) {
      throw new ApiError(400, "Invite does not match workspace");
    }
    if (invite.email !== session.user.email) {
      throw new ApiError(
        403,
        "This invite was sent to a different email address"
      );
    }

    // Already a member?
    const existing = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: invite.workspaceId,
          userId: session.user.id,
        },
      },
    });
    if (existing) {
      await prisma.workspaceInvite.update({
        where: { token },
        data: { status: "ACCEPTED" },
      });
      return Response.json({
        message: "You are already a member",
        workspaceId: invite.workspaceId,
      });
    }

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

    return Response.json({
      message: `You've joined ${invite.workspace.name}!`,
      workspaceId: invite.workspaceId,
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
