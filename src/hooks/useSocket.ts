// hooks/useSocket.ts
import { useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { getOrCreateSocket, releaseSocket } from "@/lib/socket-singleton";

export function useSocket(
  workspaceId: string | null,
  userId: string | null
): Socket | null {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!workspaceId || !userId) {
      setSocket(null);
      return;
    }

    const s = getOrCreateSocket(workspaceId, userId);
    setSocket(s);

    return () => {
      releaseSocket(workspaceId, userId);
    };
  }, [workspaceId, userId]);

  return socket;
}
