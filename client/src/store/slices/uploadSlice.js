import { createSlice } from '@reduxjs/toolkit';

const uploadSlice = createSlice({
  name: 'upload',
  initialState: {
    uploads: [],       // all upload records
    progress: {},      // { [uploadId]: 0-100 }
    errors: {},        // { [uploadId]: errorMessage }
    isMinimized: false,
  },
  reducers: {
    addUpload(state, action) {
      const upload = {
        id: action.payload.id,
        fileName: action.payload.fileName,
        fileSize: action.payload.fileSize,
        fileType: action.payload.fileType,
        accountEmail: action.payload.accountEmail,
        folderId: action.payload.folderId,
        status: 'pending', // pending | uploading | complete | failed | cancelled
        createdAt: Date.now(),
      };
      state.uploads.push(upload);
      state.progress[action.payload.id] = 0;
    },
    setUploadStatus(state, action) {
      const up = state.uploads.find(u => u.id === action.payload.id);
      if (up) up.status = action.payload.status;
    },
    updateUploadProgress(state, action) {
      const up = state.uploads.find(u => u.id === action.payload.id);
      if (up) {
        up.status = 'uploading';
        state.progress[action.payload.id] = action.payload.progress;
      }
    },
    completeUpload(state, action) {
      const up = state.uploads.find(u => u.id === action.payload.id);
      if (up) {
        up.status = 'complete';
        up.result = action.payload.result;
        state.progress[action.payload.id] = 100;
      }
    },
    failUpload(state, action) {
      const up = state.uploads.find(u => u.id === action.payload.id);
      if (up) {
        up.status = 'failed';
        state.errors[action.payload.id] = action.payload.error;
      }
    },
    cancelUpload(state, action) {
      const up = state.uploads.find(u => u.id === action.payload);
      if (up) up.status = 'cancelled';
    },
    removeUpload(state, action) {
      state.uploads = state.uploads.filter(u => u.id !== action.payload);
      delete state.progress[action.payload];
      delete state.errors[action.payload];
    },
    clearCompleted(state) {
      const completedIds = state.uploads
        .filter(u => u.status === 'complete' || u.status === 'cancelled')
        .map(u => u.id);
      state.uploads = state.uploads.filter(
        u => u.status !== 'complete' && u.status !== 'cancelled'
      );
      completedIds.forEach(id => {
        delete state.progress[id];
        delete state.errors[id];
      });
    },
    setMinimized(state, action) {
      state.isMinimized = action.payload;
    },
  },
});

export const {
  addUpload, setUploadStatus, updateUploadProgress,
  completeUpload, failUpload, cancelUpload, removeUpload,
  clearCompleted, setMinimized,
} = uploadSlice.actions;

export default uploadSlice.reducer;
