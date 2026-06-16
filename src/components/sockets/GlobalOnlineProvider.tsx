"use client";

// components/sockets/GlobalOnlineProvider.tsx
//
// Problem this solves:
// OnlineUsersProvider only creates a socket when pathname matches /workspace/[id].
// So on /dashboard, workspaceId is null → no socket → no online data → shows 0.
// Navigating to a workspace fixes it because only then does the socket connect.
//
// Fix:
// This component fetches all workspaces the user belongs to, then opens one
// socket per workspace (reusing the singleton, so no duplicate connections if
// OnlineUsersProvider is also mounted for the current workspace page).
// It populates the same Redux onlineUsersSlice, so the dashboard reads live
// counts immediately on first load.

import { useEffect, useRef } from "react";
import { Socket } from "socket.io-client";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { useWorkspaces } from "@/hooks/useWorkspace";
import {
  setOnlineUsers,
  addOnlineUser,
  removeOnlineUser,
} from "@/app/store/slices/onlineUsersSlice";
import { getOrCreateSocket, releaseSocket } from "@/lib/socket-singleton";

interface SocketEntry {
  socket: Socket;
  workspaceId: string;
  handlers: {
    handleUsersOnline: (data: {
      workspaceId: string;
      userIds: string[];
    }) => void;
    handleUserOnline: (data: { userId: string; workspaceId: string }) => void;
    handleUserOffline: (data: { userId: string; workspaceId: string }) => void;
  };
}

export function GlobalOnlineProvider() {
  const dispatch = useAppDispatch();
  const { data: session } = useAppSelector((state) => state.session);
  const userId = session?.user?.id;
  const { data: workspaces } = useWorkspaces();

  // Keep a stable ref of active socket entries so cleanup always has them
  const entriesRef = useRef<Map<string, SocketEntry>>(new Map());

  useEffect(() => {
    if (!userId || !workspaces?.length) return;

    const workspaceIds: string[] = workspaces.map(
      (ws: { id: string }) => ws.id
    );
    const newEntries = new Map<string, SocketEntry>();

    for (const workspaceId of workspaceIds) {
      // Skip if already subscribed from a previous effect run
      if (entriesRef.current.has(workspaceId)) {
        newEntries.set(workspaceId, entriesRef.current.get(workspaceId)!);
        continue;
      }

      const socket = getOrCreateSocket(workspaceId, userId);

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

      // Request current online list — works whether socket is already
      // connected or still connecting
      if (socket.connected) {
        socket.emit("request-online-users");
      } else {
        socket.once("connect", () => socket.emit("request-online-users"));
      }

      newEntries.set(workspaceId, {
        socket,
        workspaceId,
        handlers: { handleUsersOnline, handleUserOnline, handleUserOffline },
      });
    }

    entriesRef.current = newEntries;

    return () => {
      // Only clean up entries when the component unmounts (userId/workspaces
      // changing mid-session is rare; if needed, add that cleanup separately)
    };
  }, [userId, workspaces, dispatch]);

  // Full cleanup on unmount
  useEffect(() => {
    return () => {
      if (!userId) return;
      for (const {
        socket,
        workspaceId,
        handlers,
      } of entriesRef.current.values()) {
        socket.off("users:online", handlers.handleUsersOnline);
        socket.off("user:online", handlers.handleUserOnline);
        socket.off("user:offline", handlers.handleUserOffline);
        releaseSocket(workspaceId, userId);
      }
      entriesRef.current.clear();
    };
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
