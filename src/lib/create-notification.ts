import prisma from "@/lib/prisma";
import { emitToWorkspace } from "./socket-emitter";

interface CreateNotificationParams {
  userId: string; // recipient
  type: string;
  title: string;
  message: string;
  link?: string;
  workspaceId: string; // for broadcasting
}

export async function createNotification(params: CreateNotificationParams) {
  const notification = await prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link,
    },
  });

  // Broadcast real‑time via WebSocket to the workspace (client will filter by userId)
  try {
    await emitToWorkspace(params.workspaceId, "notification:new", {
      notification,
      userId: params.userId, // target user
    });
  } catch (wsError) {
    console.warn("Failed to broadcast notification:", wsError);
  }

  return notification;
}
