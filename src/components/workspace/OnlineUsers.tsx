"use client";
import { useEffect, useState } from "react";
import { useSocket } from "@/hooks/useSocket";
import { useWorkspaceMembers } from "@/hooks/useWorkspace";

export function OnlineUsers({ workspaceId, userId }: any) {
  const socket = useSocket(workspaceId, userId);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const { data: members } = useWorkspaceMembers(workspaceId);

  useEffect(() => {
    if (!socket) return;

    // ✅ Destructure the payload – it's { workspaceId, userIds: [...] }
    socket.on("users:online", ({ userIds }) => {
      setOnlineUserIds(userIds || []);
    });

    // ✅ user:online now sends { userId, workspaceId }
    socket.on("user:online", ({ userId }) => {
      setOnlineUserIds((prev) => {
        if (prev.includes(userId)) return prev;
        return [...prev, userId];
      });
    });

    // ✅ user:offline sends { userId, workspaceId }
    socket.on("user:offline", ({ userId }) => {
      setOnlineUserIds((prev) => prev.filter((id) => id !== userId));
    });

    socket.emit("request-online-users");

    return () => {
      socket.off("users:online");
      socket.off("user:online");
      socket.off("user:offline");
    };
  }, [socket]);

  // Safely filter members
  const onlineUsers =
    members?.filter((m: any) => m.userId && onlineUserIds.includes(m.userId)) ||
    [];

  return (
    <div className="flex items-center gap-2">
      {onlineUsers.map((m: any) => (
        <div key={m.userId} className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-sm">{m.user.name}</span>
        </div>
      ))}
    </div>
  );
}
