"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAppSelector } from "@/app/store/hooks";
import { useSocket } from "@/hooks/useSocket";

export function NotificationListener() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useAppSelector((state) => state.session);
  const userId = session?.user?.id;

  // Extract workspaceId from URL: /workspace/[workspaceId]/...
  const match = pathname.match(/^\/workspace\/([^\/]+)/);
  const workspaceId = match ? match[1] : null;

  const socket = useSocket(workspaceId, userId);

  useEffect(() => {
    if (!socket) return;

    const handleNotification = (data: {
      message: string;
      taskId?: string;
      userId?: string; // target user (if any)
      boardId?: string;
    }) => {
      // ✅ Only show the toast if the notification is intended for the current user
      if (data.userId && data.userId !== userId) {
        // This notification is for someone else – ignore it
        return;
      }

      toast(data.message, {
        action: {
          label: "View Task",
          onClick: () => {
            if (data.boardId) {
              router.push(`/workspace/${workspaceId}/board/${data.boardId}`);
            } else if (data.taskId) {
              // Fallback: go to workspace page
              router.push(`/workspace/${workspaceId}`);
            }
          },
        },
        duration: 5000,
      });
    };

    socket.on("notification", handleNotification);

    return () => {
      socket.off("notification", handleNotification);
    };
  }, [socket, workspaceId, userId, router]);

  return null;
}
