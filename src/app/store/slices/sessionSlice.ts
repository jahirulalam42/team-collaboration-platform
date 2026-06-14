// store/slices/sessionSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { authClient } from "@/lib/auth-client";

export interface Session {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
  } | null;
}

interface SessionState {
  data: Session | null;
  loading: boolean;
}

export const fetchSession = createAsyncThunk("session/fetch", async () => {
  const { data } = await authClient.getSession();
  return data as Session | null;
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
