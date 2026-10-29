import { createSlice } from '@reduxjs/toolkit';
import { VIEW_MODES } from '../../config/constants';
import { getAccountId } from '../../utils/helpers';

const driveSlice = createSlice({
  name: 'drive',
  initialState: {
    connectedAccounts: [],
    folders: [],
    currentFolder: null,
    selectedAccount: null,
    loading: false,
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
      const exists = state.connectedAccounts.find(a => getAccountId(a) === getAccountId(action.payload));
      if (!exists) {
        state.connectedAccounts.push(action.payload);
      }
    },
    // payload: account id (see getAccountId)
    removeAccount(state, action) {
      state.connectedAccounts = state.connectedAccounts.filter(
        a => getAccountId(a) !== action.payload
      );
      if (state.selectedAccount === action.payload) {
        state.selectedAccount = null;
      }
    },
    // payload: { id, ...fields } where id is the account id (see getAccountId)
    updateAccount(state, action) {
      const idx = state.connectedAccounts.findIndex(a => getAccountId(a) === action.payload.id);
      if (idx !== -1) {
        state.connectedAccounts[idx] = { ...state.connectedAccounts[idx], ...action.payload };
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
  setFolders, setCurrentFolder, setSelectedAccount,
  setLoading, setViewMode, setSortBy, setSortDir, setSearchQuery,
  toggleFileSelection, clearSelection, selectAll,
} = driveSlice.actions;

export default driveSlice.reducer;
