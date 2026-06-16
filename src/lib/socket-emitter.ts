// lib/socket-emitter.ts
import { io, Socket } from "socket.io-client";

const SOCKET_URL = "http://localhost:3001";

export async function emitToWorkspace(
  workspaceId: string,
  event: string,
  data: any
) {
  return new Promise<void>((resolve, reject) => {
    const socket: Socket = io(SOCKET_URL, {
      auth: { userId: "system", workspaceId },
      transports: ["websocket"],
      reconnection: false,
    });

    socket.on("connect", () => {
      // ✅ Ask the SERVER to broadcast — eliminates the race condition!
      socket.emit("broadcast-to-workspace", { workspaceId, event, data });

      setTimeout(() => {
        socket.disconnect();
        resolve();
      }, 200); // Small delay to ensure the server processes the emit
    });

    socket.on("connect_error", (err) => {
      socket.disconnect();
      reject(err);
    });
  });
}
