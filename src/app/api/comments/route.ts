// app/api/comments/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createActivity } from "@/lib/create-activity";
import { emitToWorkspace } from "@/lib/socket-emitter";
import { createNotification } from "@/lib/create-notification";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      query: { disableCookieCache: true },
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content, taskId, parentId } = await req.json();
    if (!content?.trim()) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }
    if (!taskId) {
      return NextResponse.json(
        { error: "taskId is required" },
        { status: 400 }
      );
    }

    // 1. Fetch task with board, assignee, creator (needed for notifications)
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        board: true,
        assignee: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // 2. Verify membership
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: task.board.workspaceId,
          userId: session.user.id,
        },
      },
    });
    if (!membership) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 });
    }

    // 3. Validate parentId if provided
    if (parentId) {
      const parent = await prisma.comment.findUnique({
        where: { id: parentId },
        select: { taskId: true },
      });
      if (!parent || parent.taskId !== taskId) {
        return NextResponse.json(
          { error: "Invalid parent comment" },
          { status: 400 }
        );
      }
    }

    // 4. Create comment
    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        userId: session.user.id,
        taskId,
        parentId: parentId || null,
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });

    // 5. Log activity
    await createActivity({
      type: "comment_added",
      description: `${session.user.name} commented on "${task.title}"`,
      userId: session.user.id,
      workspaceId: task.board.workspaceId,
      taskId: task.id,
      boardId: task.boardId,
    });

    // 6. Broadcast via WebSocket (live update)
    try {
      await emitToWorkspace(task.board.workspaceId, "comment:added", {
        commentId: comment.id,
        taskId: task.id,
        userId: session.user.id,
      });
    } catch (wsError) {
      console.warn("WebSocket broadcast failed:", wsError);
    }

    // 7. 🔔 Create persistent notifications for assignee and creator
    const commenterId = session.user.id;
    const commenterName = session.user.name || "Someone";
    const taskTitle = task.title;
    const workspaceId = task.board.workspaceId;
    const boardId = task.boardId;
    const link = `/workspace/${workspaceId}/board/${boardId}`;

    // Notify the assignee (if they exist and are not the commenter)
    if (task.assigneeId && task.assigneeId !== commenterId) {
      await createNotification({
        userId: task.assigneeId,
        type: "comment_added",
        title: "New Comment",
        message: `${commenterName} commented on "${taskTitle}"`,
        link,
        workspaceId,
      });
    }

    // Notify the creator (if they exist, are not the commenter, and are not the assignee)
    if (
      task.createdById &&
      task.createdById !== commenterId &&
      task.createdById !== task.assigneeId
    ) {
      await createNotification({
        userId: task.createdById,
        type: "comment_added",
        title: "New Comment",
        message: `${commenterName} commented on "${taskTitle}"`,
        link,
        workspaceId,
      });
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error },
      { status: 500 }
    );
  }
}

// GET /api/comments?taskId=...
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
    const taskId = searchParams.get("taskId");
    if (!taskId) {
      return NextResponse.json({ error: "taskId required" }, { status: 400 });
    }

    // Verify access
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { board: { include: { workspace: true } } },
    });
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: task.board.workspaceId,
          userId: session.user.id,
        },
      },
    });
    if (!membership) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 });
    }

    const comments = await prisma.comment.findMany({
      where: { taskId, parentId: null },
      orderBy: { createdAt: "asc" },
      include: {
        user: { select: { id: true, name: true, image: true } },
        replies: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
