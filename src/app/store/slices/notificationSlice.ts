import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "@/app/store/store";

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

interface NotificationState {
  items: Notification[];
  unreadCount: number;
  loading: boolean;
}

const initialState: NotificationState = {
  items: [],
  unreadCount: 0,
  loading: false,
};

export const fetchNotifications = createAsyncThunk(
  "notifications/fetch",
  async (limit: number = 20) => {
    const res = await fetch(`/api/notifications?limit=${limit}`);
    if (!res.ok) throw new Error("Failed to fetch notifications");
    const data = await res.json();
    return data; // { notifications, unreadCount }
  }
);

export const markAsRead = createAsyncThunk(
  "notifications/markRead",
  async (id: string) => {
    const res = await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    if (!res.ok) throw new Error("Failed to mark as read");
    return id;
  }
);

export const markAllAsRead = createAsyncThunk(
  "notifications/markAllRead",
  async () => {
    const res = await fetch("/api/notifications/mark-all-read", {
      method: "POST",
    });
    if (!res.ok) throw new Error("Failed to mark all as read");
    return;
  }
);

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Notification>) => {
      // Add to the top of the list
      state.items = [action.payload, ...state.items];
      if (!action.payload.read) state.unreadCount += 1;
    },
    markReadOptimistic: (state, action: PayloadAction<string>) => {
      const notif = state.items.find((n) => n.id === action.payload);
      if (notif && !notif.read) {
        notif.read = true;
        state.unreadCount -= 1;
      }
    },
    markAllReadOptimistic: (state) => {
      state.items.forEach((n) => (n.read = true));
      state.unreadCount = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.notifications;
        state.unreadCount = action.payload.unreadCount;
      })
      .addCase(fetchNotifications.rejected, (state) => {
        state.loading = false;
      })
      .addCase(markAsRead.fulfilled, (state, action) => {
        const notif = state.items.find((n) => n.id === action.payload);
        if (notif && !notif.read) {
          notif.read = true;
          state.unreadCount -= 1;
        }
      })
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.items.forEach((n) => (n.read = true));
        state.unreadCount = 0;
      });
  },
});

export const { addNotification, markReadOptimistic, markAllReadOptimistic } =
  notificationSlice.actions;

export const selectNotifications = (state: RootState) =>
  state.notifications.items;
export const selectUnreadCount = (state: RootState) =>
  state.notifications.unreadCount;

export default notificationSlice.reducer;
