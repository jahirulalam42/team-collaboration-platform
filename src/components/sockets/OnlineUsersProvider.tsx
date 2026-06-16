"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { useSocket } from "@/hooks/useSocket";
import {
  setOnlineUsers,
  addOnlineUser,
  removeOnlineUser,
} from "@/app/store/slices/onlineUsersSlice";

export function OnlineUsersProvider() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { data: session } = useAppSelector((state) => state.session);
  const userId = session?.user?.id;

  const match = pathname.match(/^\/workspace\/([^\/]+)/);
  const workspaceId = match ? match[1] : null;

  const socket = useSocket(workspaceId, userId);

  useEffect(() => {
    if (!socket || !workspaceId) return;

    const handleUsersOnline = (data: {
      workspaceId: string;
      userIds: string[];
    }) => {
      if (data.workspaceId === workspaceId) {
        dispatch(setOnlineUsers({ workspaceId, userIds: data.userIds }));
      }
    };

    const handleUserOnline = (data: {
      userId: string;
      workspaceId: string;
    }) => {
      if (data.workspaceId === workspaceId) {
        dispatch(addOnlineUser({ workspaceId, userId: data.userId }));
      }
    };

    const handleUserOffline = (data: {
      userId: string;
      workspaceId: string;
    }) => {
      if (data.workspaceId === workspaceId) {
        dispatch(removeOnlineUser({ workspaceId, userId: data.userId }));
      }
    };

    socket.on("users:online", handleUsersOnline);
    socket.on("user:online", handleUserOnline);
    socket.on("user:offline", handleUserOffline);

    socket.emit("request-online-users");

    return () => {
      socket.off("users:online", handleUsersOnline);
      socket.off("user:online", handleUserOnline);
      socket.off("user:offline", handleUserOffline);
    };
  }, [socket, workspaceId, dispatch]);

  return null;
}
