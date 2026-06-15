import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;

    const session = await auth.api.getSession({
      query: { disableCookieCache: true },
      headers: await headers(),
    });

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Optional: verify user has access to the board/workspace
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { board: { include: { workspace: true } } },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Delete the task
    await prisma.task.delete({ where: { id: taskId } });

    // Reorder remaining tasks in the same column (shift left)
    await prisma.$executeRaw`
      UPDATE "tasks"
      SET "order" = "order" - 1
      WHERE "columnId" = ${task.columnId} AND "order" > ${task.order}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
