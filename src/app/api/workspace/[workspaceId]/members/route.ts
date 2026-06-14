// app/api/workspace/[workspaceId]/members/route.ts — GET members, PATCH role, DELETE member

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireSession, requireWorkspaceMember } from "@/lib/session";
import { updateMemberRoleSchema } from "@/lib/validations/workspace";
import { createErrorResponse, ApiError } from "@/lib/errors";
import { canManage } from "@/lib/utils";

type Params = { params: { workspaceId: string } };

/** GET /api/workspace/:id/members */
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireSession();
    await requireWorkspaceMember(params.workspaceId, session.user.id);

    const members = await db.workspaceMember.findMany({
      where: { workspaceId: params.workspaceId },
      include: {
        user: { select: { id: true, name: true, email: true, image: true, bio: true } },
      },
      orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
    });

    return Response.json({ members });
  } catch (error) {
    return createErrorResponse(error);
  }
}

/** PATCH /api/workspace/:id/members?userId=xxx — change a member's role */
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await requireSession();
    const actor = await requireWorkspaceMember(
      params.workspaceId,
      session.user.id,
      ["OWNER", "ADMIN"]
    );

    const targetUserId = req.nextUrl.searchParams.get("userId");
    if (!targetUserId) throw new ApiError(422, "userId query param is required");

    const target = await db.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: params.workspaceId, userId: targetUserId } },
    });
    if (!target) throw new ApiError(404, "Member not found");

    // Cannot demote/change someone of equal or higher rank
    if (!canManage(actor.role, target.role)) {
      throw new ApiError(403, "You cannot change the role of this member");
    }

    const body = await req.json();
    const parsed = updateMemberRoleSchema.safeParse(body);
    if (!parsed.success) throw new ApiError(422, parsed.error.errors[0].message);

    const updated = await db.workspaceMember.update({
      where: { workspaceId_userId: { workspaceId: params.workspaceId, userId: targetUserId } },
      data: { role: parsed.data.role },
      include: { user: { select: { id: true, name: true, email: true, image: true } } },
    });

    return Response.json({ member: updated });
  } catch (error) {
    return createErrorResponse(error);
  }
}

/** DELETE /api/workspace/:id/members?userId=xxx — remove a member */
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await requireSession();
    const actor = await requireWorkspaceMember(
      params.workspaceId,
      session.user.id,
      ["OWNER", "ADMIN"]
    );

    const targetUserId = req.nextUrl.searchParams.get("userId");
    if (!targetUserId) throw new ApiError(422, "userId query param is required");

    // User can always remove themselves (leave workspace)
    const isSelf = targetUserId === session.user.id;

    if (!isSelf) {
      const target = await db.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId: params.workspaceId, userId: targetUserId } },
      });
      if (!target) throw new ApiError(404, "Member not found");
      if (!canManage(actor.role, target.role)) {
        throw new ApiError(403, "You cannot remove this member");
      }
    }

    // Prevent the last OWNER from leaving
    if (isSelf && actor.role === "OWNER") {
      const ownerCount = await db.workspaceMember.count({
        where: { workspaceId: params.workspaceId, role: "OWNER" },
      });
      if (ownerCount <= 1) {
        throw new ApiError(409, "Transfer ownership before leaving the workspace");
      }
    }

    await db.workspaceMember.delete({
      where: { workspaceId_userId: { workspaceId: params.workspaceId, userId: targetUserId } },
    });

    return Response.json({ message: "Member removed" });
  } catch (error) {
    return createErrorResponse(error);
  }
}
