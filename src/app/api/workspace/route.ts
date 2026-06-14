// app/api/workspace/route.ts — GET all workspaces, POST create workspace

import { NextRequest } from "next/server";
import { createWorkspaceSchema } from "@/lib/validations/workspace";
import { createErrorResponse, ApiError } from "@/lib/errors";
import { generateSlug } from "@/lib/utils";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/** GET /api/workspace — list all workspaces the current user belongs to */
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    // Check if user is authenticated
    if (!session) {
      throw new ApiError(401, "Unauthorized");
    }

    const memberships = await prisma.workspaceMember.findMany({
      where: { userId: session.user.id }, // Now safe
      include: {
        workspace: {
          include: {
            _count: { select: { members: true } },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    const workspaces = memberships.map((m) => ({
      ...m.workspace,
      role: m.role,
      joinedAt: m.joinedAt,
    }));

    return Response.json({ workspaces });
  } catch (error) {
    return createErrorResponse(error);
  }
}

/** POST /api/workspace — create a new workspace */
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    // Check if user is authenticated
    if (!session) {
      throw new ApiError(401, "Unauthorized");
    }

    const body = await req.json();
    const parsed = createWorkspaceSchema.safeParse(body);

    if (!parsed.success) {
      throw new ApiError(422, parsed.error.issues[0].message);
    }

    const { name, description } = parsed.data;
    let { slug } = parsed.data;

    // Auto-generate slug if not provided
    if (!slug) slug = generateSlug(name);

    // Check slug uniqueness
    const existing = await prisma.workspace.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (existing) {
      throw new ApiError(
        409,
        "This slug is already taken. Try a different one."
      );
    }

    const workspace = await prisma.$transaction(async (tx) => {
      const ws = await tx.workspace.create({
        data: {
          name,
          slug,
          description,
          members: {
            create: { userId: session.user.id, role: "OWNER" }, // Now safe
          },
        },
        include: {
          _count: { select: { members: true } },
        },
      });
      return ws;
    });

    return Response.json({ workspace }, { status: 201 });
  } catch (error) {
    return createErrorResponse(error);
  }
}
