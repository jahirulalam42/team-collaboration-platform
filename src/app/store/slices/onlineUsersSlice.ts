// store/slices/onlineUsersSlice.ts
import { createSlice, PayloadAction, createSelector } from "@reduxjs/toolkit";
import { RootState } from "@/app/store/store";

interface OnlineUsersState {
  [workspaceId: string]: string[];
}

const initialState: OnlineUsersState = {};

const onlineUsersSlice = createSlice({
  name: "onlineUsers",
  initialState,
  reducers: {
    setOnlineUsers: (
      state,
      action: PayloadAction<{ workspaceId: string; userIds: string[] }>
    ) => {
      const { workspaceId, userIds } = action.payload;
      state[workspaceId] = userIds;
    },
    addOnlineUser: (
      state,
      action: PayloadAction<{ workspaceId: string; userId: string }>
    ) => {
      const { workspaceId, userId } = action.payload;
      if (!state[workspaceId]) state[workspaceId] = [];
      if (!state[workspaceId].includes(userId)) {
        state[workspaceId].push(userId);
      }
    },
    removeOnlineUser: (
      state,
      action: PayloadAction<{ workspaceId: string; userId: string }>
    ) => {
      const { workspaceId, userId } = action.payload;
      if (state[workspaceId]) {
        state[workspaceId] = state[workspaceId].filter((id) => id !== userId);
        if (state[workspaceId].length === 0) {
          delete state[workspaceId];
        }
      }
    },
  },
});

export const { setOnlineUsers, addOnlineUser, removeOnlineUser } =
  onlineUsersSlice.actions;

// Memoized selector for a specific workspace
export const selectOnlineUsers = createSelector(
  (state: RootState) => state.onlineUsers,
  (_: RootState, workspaceId: string) => workspaceId,
  (onlineUsers, workspaceId) => onlineUsers[workspaceId] || []
);

// New: total unique online users across all workspaces
export const selectTotalOnlineUsers = createSelector(
  (state: RootState) => state.onlineUsers,
  (onlineUsers) => {
    const allUserIds = new Set<string>();
    Object.values(onlineUsers).forEach((userIds) => {
      userIds.forEach((id) => allUserIds.add(id));
    });
    return allUserIds.size;
  }
);

export default onlineUsersSlice.reducer;
