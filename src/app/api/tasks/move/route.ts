import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// app/api/tasks/move/route.ts
export async function PATCH(req: Request) {
  const { taskId, newColumnId, newOrder, oldColumnId } = await req.json();

  // 1. Update the moved task
  await prisma.task.update({
    where: { id: taskId },
    data: { columnId: newColumnId, order: newOrder },
  });

  // 2. Reorder remaining tasks in the old column (if needed)
  if (oldColumnId && oldColumnId !== newColumnId) {
    await prisma.$executeRaw`
        UPDATE "tasks" 
        SET "order" = "order" - 1 
        WHERE "columnId" = ${oldColumnId} AND "order" > ${newOrder}
      `;
  }

  // 3. Reorder tasks in the new column (shift those after the insertion point)
  await prisma.$executeRaw`
      UPDATE "tasks"
      SET "order" = "order" + 1
      WHERE "columnId" = ${newColumnId} AND "order" >= ${newOrder} AND id != ${taskId}
    `;

  return NextResponse.json({ success: true });
}
