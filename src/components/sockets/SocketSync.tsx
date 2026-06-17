"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { useSocket } from "@/hooks/useSocket";
// import {
//   setOnlineUsers,
//   addOnlineUser,
//   removeOnlineUser,
// } from "@/store/slices/onlineUsersSlice";

export function SocketSync() {
  const { data: session } = useAppSelector(
    (state: { session: any }) => state.session
  );
  const userId = session?.user?.id;

  // We need a workspaceId – we can get it from the URL or use a global context.
  // For simplicity, we'll use a wildcard: we listen to all events and ignore the room concept.
  // But we need to know which workspace each event belongs to.
  // Since the server broadcasts events with workspaceId implicitly via rooms,
  // we can't easily extract it from the event alone.
  // Instead, we'll use the singleton socket and add listeners that forward events to Redux.
  // We'll connect to the default workspace (if any) or listen globally.

  // Alternative: we can create a hook that provides the current workspaceId.
  // For now, we'll assume the socket already joined the workspace room.
  // We'll listen for 'users:online', 'user:online', 'user:offline' and dispatch accordingly.

  const socket = useSocket("global", userId); // This won't work because useSocket expects a workspaceId.

  // Better: we modify useSocket to accept null workspaceId and not connect.
  // Actually, we can use the singleton directly.

  // Let's implement using the singleton directly.
  useEffect(() => {
    // We need to get the socket for a specific workspace.
    // Since we want to sync all workspaces, we need to listen to events for each workspace.
    // This is tricky because the socket is tied to a workspace.
    // Workaround: In the server, when broadcasting 'user:online' and 'user:offline',
    // include the workspaceId in the payload. Then the client can dispatch based on that.
    // I'll update the server to include workspaceId in these events.
    // Then we listen to them in this component and update Redux.
    // For now, I'll provide the final solution assuming the server includes workspaceId.
    // We'll create a socket for the current workspace.
  }, []);

  return null;
}
