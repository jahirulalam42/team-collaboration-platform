// app/api/workspace/[workspaceId]/route.ts — GET, PATCH, DELETE single workspace

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireSession, requireWorkspaceMember } from "@/lib/session";
import { updateWorkspaceSchema } from "@/lib/validations/workspace";
import { createErrorResponse, ApiError } from "@/lib/errors";

type Params = { params: { workspaceId: string } };

/** GET /api/workspace/:id */
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireSession();
    const member = await requireWorkspaceMember(params.workspaceId, session.user.id);

    const workspace = await db.workspace.findUnique({
      where: { id: params.workspaceId },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true, image: true } } },
          orderBy: { joinedAt: "asc" },
        },
        _count: { select: { members: true } },
      },
    });

    if (!workspace) throw new ApiError(404, "Workspace not found");

    return Response.json({ workspace, currentUserRole: member.role });
  } catch (error) {
    return createErrorResponse(error);
  }
}

/** PATCH /api/workspace/:id — update name/description/slug */
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await requireSession();
    await requireWorkspaceMember(params.workspaceId, session.user.id, ["OWNER", "ADMIN"]);

    const body = await req.json();
    const parsed = updateWorkspaceSchema.safeParse(body);
    if (!parsed.success) throw new ApiError(422, parsed.error.errors[0].message);

    if (parsed.data.slug) {
      const conflict = await db.workspace.findFirst({
        where: { slug: parsed.data.slug, NOT: { id: params.workspaceId } },
        select: { id: true },
      });
      if (conflict) throw new ApiError(409, "This slug is already taken.");
    }

    const workspace = await db.workspace.update({
      where: { id: params.workspaceId },
      data: parsed.data,
    });

    return Response.json({ workspace });
  } catch (error) {
    return createErrorResponse(error);
  }
}

/** DELETE /api/workspace/:id — only OWNER can delete */
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireSession();
    await requireWorkspaceMember(params.workspaceId, session.user.id, ["OWNER"]);

    await db.workspace.delete({ where: { id: params.workspaceId } });

    return Response.json({ message: "Workspace deleted" });
  } catch (error) {
    return createErrorResponse(error);
  }
}
