import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarOpen: true,
    connectModalOpen: false,
    previewFile: null,
    theme: 'dark',
    notifications: [],
    offlineBanner: false,
    isSearchFocused: false,
    transferModalOpen: false,
    transferFile: null,
  },
  reducers: {
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen(state, action) {
      state.sidebarOpen = action.payload;
    },
    setConnectModalOpen(state, action) {
      state.connectModalOpen = action.payload;
    },
    setPreviewFile(state, action) {
      state.previewFile = action.payload;
    },
    setTheme(state, action) {
      state.theme = action.payload;
    },
    addNotification(state, action) {
      state.notifications.push({
        id: Date.now().toString(),
        type: 'info',
        ...action.payload,
        createdAt: Date.now(),
      });
    },
    removeNotification(state, action) {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    clearNotifications(state) {
      state.notifications = [];
    },
    setOfflineBanner(state, action) {
      state.offlineBanner = action.payload;
    },
    setSearchFocused(state, action) {
      state.isSearchFocused = action.payload;
    },
    setTransferModalOpen(state, action) {
      state.transferModalOpen = action.payload;
    },
    setTransferFile(state, action) {
      state.transferFile = action.payload;
    },
  },
});

export const {
  toggleSidebar, setSidebarOpen,
  setConnectModalOpen, setPreviewFile,
  setTheme, addNotification, removeNotification, clearNotifications,
  setOfflineBanner, setSearchFocused,
  setTransferModalOpen, setTransferFile,
} = uiSlice.actions;

export default uiSlice.reducer;
