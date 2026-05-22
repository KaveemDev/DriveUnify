import { createSlice } from '@reduxjs/toolkit';
import { VIEW_MODES } from '../../config/constants';

const driveSlice = createSlice({
  name: 'drive',
  initialState: {
    connectedAccounts: [],
    files: [],
    folders: [],
    currentFolder: null,
    selectedAccount: null,
    loading: false,
    error: null,
    viewMode: VIEW_MODES.GRID,
    sortBy: 'name',
    sortDir: 'asc',
    searchQuery: '',
    selectedFiles: [],
  },
  reducers: {
    setConnectedAccounts(state, action) {
      state.connectedAccounts = action.payload;
    },
    addAccount(state, action) {
      const exists = state.connectedAccounts.find(a => a.email === action.payload.email);
      if (!exists) {
        state.connectedAccounts.push(action.payload);
      }
    },
    removeAccount(state, action) {
      state.connectedAccounts = state.connectedAccounts.filter(
        a => a.email !== action.payload
      );
      state.files = state.files.filter(f => f.accountEmail !== action.payload);
      if (state.selectedAccount === action.payload) {
        state.selectedAccount = null;
      }
    },
    updateAccount(state, action) {
      const idx = state.connectedAccounts.findIndex(a => a.email === action.payload.email);
      if (idx !== -1) {
        state.connectedAccounts[idx] = { ...state.connectedAccounts[idx], ...action.payload };
      }
    },
    setFiles(state, action) {
      state.files = action.payload;
    },
    upsertFiles(state, action) {
      const newFiles = action.payload;
      const map = {};
      state.files.forEach(f => { map[f.id + f.accountEmail] = f; });
      newFiles.forEach(f => { map[f.id + f.accountEmail] = f; });
      state.files = Object.values(map);
    },
    removeFile(state, action) {
      state.files = state.files.filter(f => !(f.id === action.payload.id && f.accountEmail === action.payload.accountEmail));
    },
    updateFile(state, action) {
      const idx = state.files.findIndex(
        f => f.id === action.payload.id && f.accountEmail === action.payload.accountEmail
      );
      if (idx !== -1) {
        state.files[idx] = { ...state.files[idx], ...action.payload };
      }
    },
    setFolders(state, action) {
      state.folders = action.payload;
    },
    setCurrentFolder(state, action) {
      state.currentFolder = action.payload;
    },
    setSelectedAccount(state, action) {
      state.selectedAccount = action.payload;
      state.currentFolder = null;
    },
    setLoading(state, action) {
      state.loading = action.payload;
    },
    setError(state, action) {
      state.error = action.payload;
      state.loading = false;
    },
    setViewMode(state, action) {
      state.viewMode = action.payload;
    },
    setSortBy(state, action) {
      state.sortBy = action.payload;
    },
    setSortDir(state, action) {
      state.sortDir = action.payload;
    },
    setSearchQuery(state, action) {
      state.searchQuery = action.payload;
    },
    toggleFileSelection(state, action) {
      const id = action.payload;
      if (state.selectedFiles.includes(id)) {
        state.selectedFiles = state.selectedFiles.filter(f => f !== id);
      } else {
        state.selectedFiles.push(id);
      }
    },
    clearSelection(state) {
      state.selectedFiles = [];
    },
    selectAll(state, action) {
      state.selectedFiles = action.payload;
    },
  },
});

export const {
  setConnectedAccounts, addAccount, removeAccount, updateAccount,
  setFiles, upsertFiles, removeFile, updateFile,
  setFolders, setCurrentFolder, setSelectedAccount,
  setLoading, setError, setViewMode, setSortBy, setSortDir, setSearchQuery,
  toggleFileSelection, clearSelection, selectAll,
} = driveSlice.actions;

export default driveSlice.reducer;
