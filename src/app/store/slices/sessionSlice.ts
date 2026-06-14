// store/slices/sessionSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { authClient } from "@/lib/auth-client";

export interface Session {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    emailVerified?: boolean;
    createdAt: string;
    updatedAt: string;
  } | null;
  session: {
    id: string;
    userId: string;
    token: string;
    expiresAt: string;
    createdAt: string;
    updatedAt: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  };
}
interface SessionState {
  data: Session | null;
  loading: boolean;
}

export const fetchSession = createAsyncThunk("session/fetch", async () => {
  const { data } = await authClient.getSession();

  if (!data || !data.session || !data.user) return null;

  return {
    user: {
      ...data.user,
      createdAt: data.user.createdAt.toISOString(),
      updatedAt: data.user.updatedAt.toISOString(),
    },
    session: {
      ...data.session,
      expiresAt: data.session.expiresAt.toISOString(),
      createdAt: data.session.createdAt.toISOString(),
      updatedAt: data.session.updatedAt.toISOString(),
    },
  } as Session;
});

export const logout = createAsyncThunk("session/logout", async () => {
  await authClient.signOut();
  return null;
});

const initialState: SessionState = {
  data: null,
  loading: true,
};

const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSession.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSession.fulfilled, (state, action) => {
        state.data = action.payload;
        state.loading = false;
      })
      .addCase(fetchSession.rejected, (state) => {
        state.loading = false;
        state.data = null;
      })
      .addCase(logout.fulfilled, (state) => {
        state.data = null;
        state.loading = false;
      });
  },
});

export default sessionSlice.reducer;
