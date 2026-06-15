import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // 1. Get session (fix double await)
  const session = await auth.api.getSession({
    query: { disableCookieCache: true },
    headers: await headers(),
  });

  // 2. Authentication guard
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 3. Parse request body
  const { title, columnId, boardId, assigneeId, dueDate } = await req.json();

  // Validate required fields
  if (!title || !columnId || !boardId) {
    return NextResponse.json(
      { error: "Missing required fields: title, columnId, boardId" },
      { status: 400 }
    );
  }

  // 4. Get current max order in that column
  const maxOrder = await prisma.task.aggregate({
    where: { columnId },
    _max: { order: true },
  });
  const newOrder = (maxOrder._max.order ?? -1) + 1;

  // 5. Create task with all required fields
  const task = await prisma.task.create({
    data: {
      title,
      columnId,
      boardId,
      order: newOrder,
      status: columnId,
      assigneeId: assigneeId || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      createdById: session.user.id,
    },
    include: { assignee: true, createdBy: true },
  });

  return NextResponse.json(task);
}
