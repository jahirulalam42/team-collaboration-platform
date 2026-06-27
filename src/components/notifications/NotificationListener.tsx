"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAppSelector, useAppDispatch } from "@/app/store/hooks";
import { useSocket } from "@/hooks/useSocket";
import {
  addNotification,
  Notification,
} from "@/app/store/slices/notificationSlice";

export function NotificationListener() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { data: session } = useAppSelector((state) => state.session);
  const userId: any = session?.user?.id;

  // Extract workspaceId from URL: /workspace/[workspaceId]/...
  const match = pathname.match(/^\/workspace\/([^\/]+)/);
  const workspaceId = match ? match[1] : null;

  const socket = useSocket(workspaceId, userId);

  useEffect(() => {
    if (!socket) return;

    // ----- 1. Real‑time toast notification (existing) -----
    const handleNotification = (data: {
      message: string;
      taskId?: string;
      userId?: string;
      boardId?: string;
    }) => {
      // Only show if the notification is for the current user
      if (data.userId && data.userId !== userId) return;

      toast(data.message, {
        action: {
          label: "View Task",
          onClick: () => {
            if (data.boardId) {
              router.push(`/workspace/${workspaceId}/board/${data.boardId}`);
            } else if (data.taskId) {
              router.push(`/workspace/${workspaceId}`);
            }
          },
        },
        duration: 5000,
      });
    };

    // ----- 2. Persistent notification (bell icon) -----
    const handleNewNotification = (data: {
      notification: Notification;
      userId: string;
    }) => {
      // Only add if it's for the current user
      if (data.userId === userId) {
        dispatch(addNotification(data.notification));
      }
    };

    socket.on("notification", handleNotification);
    socket.on("notification:new", handleNewNotification);

    return () => {
      socket.off("notification", handleNotification);
      socket.off("notification:new", handleNewNotification);
    };
  }, [socket, workspaceId, userId, router, dispatch]);

  return null;
}
