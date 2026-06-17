import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createActivity } from "@/lib/create-activity";

// -------------------- GET --------------------
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

    // Verify user has access to this task's workspace
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

    const attachments = await prisma.attachment.findMany({
      where: { taskId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(attachments);
  } catch (error) {
    console.error("Error fetching attachments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// -------------------- POST --------------------
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      query: { disableCookieCache: true },
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const taskId = formData.get("taskId") as string;

    if (!file || !taskId) {
      return NextResponse.json(
        { error: "Missing file or taskId" },
        { status: 400 }
      );
    }

    // Verify task and workspace membership
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { board: true },
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

    // For demo, we'll just store a placeholder URL. In production, upload to S3/Cloudinary.
    const fileUrl = `/uploads/${Date.now()}_${file.name}`;

    const attachment = await prisma.attachment.create({
      data: {
        filename: file.name,
        fileUrl,
        fileSize: file.size,
        mimeType: file.type,
        taskId,
        uploadedBy: session.user.id,
      },
    });

    // Log activity
    await createActivity({
      type: "attachment_added",
      description: `${session.user.name} attached "${file.name}" to "${task.title}"`,
      userId: session.user.id,
      workspaceId: task.board.workspaceId,
      taskId,
      boardId: task.boardId,
    });

    // Broadcast via WebSocket (optional)
    try {
      const { emitToWorkspace } = await import("@/lib/socket-emitter");
      await emitToWorkspace(task.board.workspaceId, "attachment:added", {
        taskId,
        attachmentId: attachment.id,
        userId: session.user.id,
      });
    } catch (wsError) {
      console.warn("WebSocket broadcast failed:", wsError);
    }

    return NextResponse.json(attachment, { status: 201 });
  } catch (error) {
    console.error("Error uploading attachment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
