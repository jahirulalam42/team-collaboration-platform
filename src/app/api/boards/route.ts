// app/api/boards/route.ts
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth.api.getSession({
    query: { disableCookieCache: true },
    headers: await headers(),
  });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspaceId");

  if (!workspaceId) {
    return NextResponse.json(
      { error: "workspaceId required" },
      { status: 400 }
    );
  }

  // Optional: Verify user is a member of this workspace
  const member = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId, userId: session.user.id },
    },
  });
  if (!member) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const boards = await prisma.board.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { tasks: true } },
    },
  });

  return NextResponse.json(boards);
}

// app/api/boards/route.ts (same file, add POST)
export async function POST(req: Request) {
  const session = await auth.api.getSession({
    query: { disableCookieCache: true },
    headers: await headers(),
  });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, description, workspaceId } = await req.json();
  if (!name || !workspaceId) {
    return NextResponse.json(
      { error: "Missing name or workspaceId" },
      { status: 400 }
    );
  }

  // Verify user is a member
  const member = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId, userId: session.user.id },
    },
  });
  if (!member) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  // Create board
  const board = await prisma.board.create({
    data: {
      title: name,
      description,
      workspaceId,
    },
  });

  // Optionally create default columns (Todo, In Progress, Review, Done)
  const defaultColumns = ["Todo", "In Progress", "Review", "Done"];
  for (let i = 0; i < defaultColumns.length; i++) {
    await prisma.column.create({
      data: {
        title: defaultColumns[i],
        order: i,
        boardId: board.id,
      },
    });
  }

  return NextResponse.json(board, { status: 201 });
}
