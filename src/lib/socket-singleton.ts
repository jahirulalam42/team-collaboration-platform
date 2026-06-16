// lib/socket-singleton.ts
import { io, Socket } from "socket.io-client";

const SOCKET_URL = "http://localhost:3001";
const activeSockets = new Map<string, { socket: Socket; refCount: number }>();

function getKey(workspaceId: string, userId: string) {
  return `${workspaceId}::${userId}`;
}

export function getOrCreateSocket(workspaceId: string, userId: string): Socket {
  const key = getKey(workspaceId, userId);
  const existing = activeSockets.get(key);

  if (existing) {
    existing.refCount++;
    return existing.socket;
  }

  const socket = io(SOCKET_URL, {
    auth: { userId, workspaceId },
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 5,
  });

  activeSockets.set(key, { socket, refCount: 1 });
  return socket;
}

export function releaseSocket(workspaceId: string, userId: string) {
  const key = getKey(workspaceId, userId);
  const entry = activeSockets.get(key);
  if (!entry) return;

  entry.refCount--;
  if (entry.refCount <= 0) {
    entry.socket.disconnect();
    activeSockets.delete(key);
  }
}
