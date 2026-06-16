// server.ts
const { Server } = require("socket.io");
const http = require("http");

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ✅ FIX: Map<workspaceId, Map<userId, Set<socketId>>>
// This allows us to track multiple tabs per user
const onlineUsers = new Map();

io.on("connection", (socket) => {
  const { userId, workspaceId } = socket.handshake.auth;
  if (!userId || !workspaceId) {
    socket.disconnect();
    return;
  }

  socket.join(`workspace:${workspaceId}`);
  socket.data.userId = userId;
  socket.data.workspaceId = workspaceId;

  // --- Track online users (multi-tab aware) ---
  if (!onlineUsers.has(workspaceId)) {
    onlineUsers.set(workspaceId, new Map());
  }
  const wsUsers = onlineUsers.get(workspaceId);

  if (!wsUsers.has(userId)) {
    wsUsers.set(userId, new Set());
  }

  // Check if this is the FIRST tab for this user
  const isFirstConnection = wsUsers.get(userId).size === 0;
  wsUsers.get(userId).add(socket.id);

  // Only broadcast "user:online" if this is the first tab
  if (isFirstConnection) {
    socket
      .to(`workspace:${workspaceId}`)
      .emit("user:online", { userId, workspaceId });
  }

  // Send the current list of unique online users to the new socket
  const usersOnline = Array.from(wsUsers.keys());
  socket.emit("users:online", { workspaceId, userIds: usersOnline });

  // --- Task Events ---
  socket.on("task:move", (data) => {
    socket.to(`workspace:${workspaceId}`).emit("task:moved", {
      ...data,
      userId,
    });
  });

  // ✅ FIX: API Broadcast Relay (used by Next.js API routes)
  socket.on("broadcast-to-workspace", ({ workspaceId: wsId, event, data }) => {
    io.to(`workspace:${wsId}`).emit(event, data);
  });

  // --- Typing Events ---
  socket.on("typing:start", ({ taskId }) => {
    socket
      .to(`workspace:${workspaceId}`)
      .emit("typing:start", { userId, taskId });
  });

  socket.on("typing:stop", ({ taskId }) => {
    socket
      .to(`workspace:${workspaceId}`)
      .emit("typing:stop", { userId, taskId });
  });

  // --- Disconnect ---
  socket.on("disconnect", () => {
    const wsId = socket.data.workspaceId;
    const uId = socket.data.userId;

    if (wsId && onlineUsers.has(wsId)) {
      const wsUsers = onlineUsers.get(wsId);

      if (wsUsers.has(uId)) {
        wsUsers.get(uId).delete(socket.id);

        // If the user has no more active sockets (all tabs closed)
        if (wsUsers.get(uId).size === 0) {
          wsUsers.delete(uId);
          // Broadcast offline only when ALL tabs are closed
          socket
            .to(`workspace:${wsId}`)
            .emit("user:offline", { userId: uId, workspaceId: wsId });
        }
      }
      if (wsUsers.size === 0) {
        onlineUsers.delete(wsId);
      }
    }
  });

  socket.on("join-workspace", (id) => {
    socket.join(`workspace:${id}`);
  });

  socket.on("request-online-users", () => {
    const wsId = socket.data.workspaceId;
    if (wsId && onlineUsers.has(wsId)) {
      const users = Array.from(onlineUsers.get(wsId).keys());
      socket.emit("users:online", { workspaceId: wsId, userIds: users });
    } else {
      socket.emit("users:online", { workspaceId: wsId, userIds: [] });
    }
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});
