import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { emitToWorkspace } from "@/lib/socket-emitter";

// -------------------- GET --------------------
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;

    const session = await auth.api.getSession({
      query: { disableCookieCache: true },
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch task with necessary relations
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignee: { select: { id: true, name: true, image: true } },
        createdBy: { select: { id: true, name: true, image: true } },
        board: { include: { workspace: true } },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // 2. Verify user is a member of the workspace
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: task.board.workspaceId,
          userId: session.user.id,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "You are not a member of this workspace" },
        { status: 403 }
      );
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("Error fetching task:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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

export async function PATCH(
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

    const body = await req.json();
    const { assigneeId, title, description, dueDate, status } = body;

    // 1. Get the current task with its board and workspace
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: { board: { include: { workspace: true } } },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // 2. Update the task
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(dueDate !== undefined && {
          dueDate: dueDate ? new Date(dueDate) : null,
        }),
        ...(status !== undefined && { status }),
        ...(assigneeId !== undefined && { assigneeId: assigneeId || null }),
      },
      include: { assignee: true, createdBy: true },
    });

    // 3. If assignee changed and is not null, send a notification
    // app/api/tasks/[taskId]/route.ts (partial)
    if (
      assigneeId !== undefined &&
      assigneeId !== null &&
      assigneeId !== existingTask.assigneeId
    ) {
      const assigneeUser = await prisma.user.findUnique({
        where: { id: assigneeId },
      });

      if (assigneeUser) {
        const workspaceId = existingTask.board.workspaceId;
        const assignedByName = session.user.name || "Someone";

        await emitToWorkspace(workspaceId, "notification", {
          message: `${assignedByName} assigned you a task: "${existingTask.title}"`,
          taskId: taskId,
          userId: assigneeId,
          boardId: existingTask.boardId,
        });
      }
    }

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}
