// app/api/workspace/[workspaceId]/members/route.ts — GET members, PATCH role, DELETE member

import { NextRequest } from "next/server";
import { requireSession, requireWorkspaceMember } from "@/lib/session";
import { updateMemberRoleSchema } from "@/lib/validations/workspace";
import { createErrorResponse, ApiError } from "@/lib/errors";
import { canManage } from "@/lib/utils";
import prisma from "@/lib/prisma";

// ✅ params is now a Promise
type Params = { params: Promise<{ workspaceId: string }> };

/** GET /api/workspace/:id/members */
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { workspaceId } = await params; // ✅ await the promise
    const session = await requireSession();
    await requireWorkspaceMember(workspaceId, session.user.id);

    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId: workspaceId },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true, bio: true },
        },
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
    const { workspaceId } = await params;
    const session = await requireSession();
    const actor = await requireWorkspaceMember(workspaceId, session.user.id, [
      "OWNER",
      "ADMIN",
    ]);

    const targetUserId = req.nextUrl.searchParams.get("userId");
    if (!targetUserId)
      throw new ApiError(422, "userId query param is required");

    const target = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: workspaceId,
          userId: targetUserId,
        },
      },
    });
    if (!target) throw new ApiError(404, "Member not found");

    if (!canManage(actor.role, target.role)) {
      throw new ApiError(403, "You cannot change the role of this member");
    }

    const body = await req.json();
    const parsed = updateMemberRoleSchema.safeParse(body);
    if (!parsed.success)
      throw new ApiError(422, parsed.error.issues[0].message);

    const updated = await prisma.workspaceMember.update({
      where: {
        workspaceId_userId: {
          workspaceId: workspaceId,
          userId: targetUserId,
        },
      },
      data: { role: parsed.data.role },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    });

    return Response.json({ member: updated });
  } catch (error) {
    return createErrorResponse(error);
  }
}

/** DELETE /api/workspace/:id/members?userId=xxx — remove a member */
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { workspaceId } = await params;
    const session = await requireSession();
    const actor = await requireWorkspaceMember(workspaceId, session.user.id, [
      "OWNER",
      "ADMIN",
    ]);

    const targetUserId = req.nextUrl.searchParams.get("userId");
    if (!targetUserId)
      throw new ApiError(422, "userId query param is required");

    const isSelf = targetUserId === session.user.id;

    if (!isSelf) {
      const target = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: workspaceId,
            userId: targetUserId,
          },
        },
      });
      if (!target) throw new ApiError(404, "Member not found");
      if (!canManage(actor.role, target.role)) {
        throw new ApiError(403, "You cannot remove this member");
      }
    }

    if (isSelf && actor.role === "OWNER") {
      const ownerCount = await prisma.workspaceMember.count({
        where: { workspaceId: workspaceId, role: "OWNER" },
      });
      if (ownerCount <= 1) {
        throw new ApiError(
          409,
          "Transfer ownership before leaving the workspace"
        );
      }
    }

    await prisma.workspaceMember.delete({
      where: {
        workspaceId_userId: {
          workspaceId: workspaceId,
          userId: targetUserId,
        },
      },
    });

    return Response.json({ message: "Member removed" });
  } catch (error) {
    return createErrorResponse(error);
  }
}
