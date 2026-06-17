import prisma from "@/lib/prisma";

export async function createActivity(data: {
  type: string;
  description: string;
  userId: string;
  workspaceId: string;
  taskId?: string;
  boardId?: string;
  metadata?: any;
}) {
  return prisma.activity.create({
    data: {
      type: data.type,
      description: data.description,
      userId: data.userId,
      workspaceId: data.workspaceId,
      taskId: data.taskId,
      boardId: data.boardId,
      metadata: data.metadata,
    },
  });
}
