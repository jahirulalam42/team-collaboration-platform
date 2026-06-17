// app/api/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      query: { disableCookieCache: true },
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");
    const workspaceId = searchParams.get("workspaceId");

    if (!query || !workspaceId) {
      return NextResponse.json(
        { error: "Missing q or workspaceId" },
        { status: 400 }
      );
    }

    // Search tasks
    const tasks = await prisma.task.findMany({
      where: {
        board: { workspaceId },
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      include: { board: true, assignee: true },
      take: 10,
    });

    // Search comments
    const comments = await prisma.comment.findMany({
      where: {
        task: { board: { workspaceId } },
        content: { contains: query, mode: "insensitive" },
      },
      include: {
        task: { include: { board: true } },
        user: true,
      },
      take: 10,
    });

    // Search boards
    const boards = await prisma.board.findMany({
      where: {
        workspaceId,
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 10,
    });

    // Search users (members of the workspace)
    const members = await prisma.workspaceMember.findMany({
      where: {
        workspaceId,
        user: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
          ],
        },
      },
      include: { user: true },
      take: 10,
    });

    return NextResponse.json({
      tasks,
      comments,
      boards,
      members: members.map((m) => m.user),
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
