import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    loading: false,
    initialized: false,
    error: null,
  },
  reducers: {
    setUser(state, action) {
      state.user = action.payload;
      state.error = null;
    },
    setLoading(state, action) {
      state.loading = action.payload;
    },
    setInitialized(state, action) {
      state.initialized = action.payload;
    },
    setError(state, action) {
      state.error = action.payload;
      state.loading = false;
    },
    logout(state) {
      state.user = null;
      state.error = null;
      state.loading = false;
    },
  },
});

export const { setUser, setLoading, setInitialized, setError, logout } = authSlice.actions;
export default authSlice.reducer;
