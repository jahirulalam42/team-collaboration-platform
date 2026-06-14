// app/api/workspace/[workspaceId]/invite/route.ts — Send & accept invites

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireSession, requireWorkspaceMember } from "@/lib/session";
import { inviteMemberSchema } from "@/lib/validations/workspace";
import { createErrorResponse, ApiError } from "@/lib/errors";
import { getInviteExpiry } from "@/lib/utils";

type Params = { params: { workspaceId: string } };

/** POST /api/workspace/:id/invite — send an invite email */
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await requireSession();
    await requireWorkspaceMember(params.workspaceId, session.user.id, ["OWNER", "ADMIN"]);

    const body = await req.json();
    const parsed = inviteMemberSchema.safeParse(body);
    if (!parsed.success) throw new ApiError(422, parsed.error.errors[0].message);

    const { email, role } = parsed.data;

    // Check if already a member
    const existingUser = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (existingUser) {
      const alreadyMember = await db.workspaceMember.findUnique({
        where: {
          workspaceId_userId: { workspaceId: params.workspaceId, userId: existingUser.id },
        },
      });
      if (alreadyMember) throw new ApiError(409, "This user is already a member");
    }

    // Cancel any existing pending invites for the same email
    await db.workspaceInvite.updateMany({
      where: { workspaceId: params.workspaceId, email, status: "PENDING" },
      data: { status: "EXPIRED" },
    });

    const workspace = await db.workspace.findUnique({
      where: { id: params.workspaceId },
      select: { name: true },
    });

    const invite = await db.workspaceInvite.create({
      data: {
        workspaceId: params.workspaceId,
        email,
        role,
        invitedById: session.user.id,
        expiresAt: getInviteExpiry(),
      },
    });

    // TODO: send email via Resend/Nodemailer
    // await sendInviteEmail({ to: email, inviteToken: invite.token, workspaceName: workspace?.name })

    return Response.json({ invite, message: "Invite sent" }, { status: 201 });
  } catch (error) {
    return createErrorResponse(error);
  }
}

/** GET /api/workspace/:id/invite?token=xxx — accept an invite */
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const session = await requireSession();
    const token = req.nextUrl.searchParams.get("token");
    if (!token) throw new ApiError(422, "token query param is required");

    const invite = await db.workspaceInvite.findUnique({
      where: { token },
      include: { workspace: { select: { name: true, id: true } } },
    });

    if (!invite) throw new ApiError(404, "Invite not found");
    if (invite.status !== "PENDING") throw new ApiError(409, "This invite has already been used");
    if (invite.expiresAt < new Date()) {
      await db.workspaceInvite.update({ where: { token }, data: { status: "EXPIRED" } });
      throw new ApiError(409, "This invite has expired");
    }
    if (invite.email !== session.user.email) {
      throw new ApiError(403, "This invite was sent to a different email address");
    }

    // Already a member?
    const existing = await db.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: invite.workspaceId, userId: session.user.id } },
    });
    if (existing) {
      await db.workspaceInvite.update({ where: { token }, data: { status: "ACCEPTED" } });
      return Response.json({ message: "You are already a member", workspaceId: invite.workspaceId });
    }

    await db.$transaction([
      db.workspaceMember.create({
        data: { workspaceId: invite.workspaceId, userId: session.user.id, role: invite.role },
      }),
      db.workspaceInvite.update({
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
