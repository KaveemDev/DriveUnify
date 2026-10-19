import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import driveReducer from './slices/driveSlice';
import uploadReducer from './slices/uploadSlice';
import uiReducer from './slices/uiSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    drive: driveReducer,
    upload: uploadReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore non-serializable values in upload state (AbortControllers etc.)
        ignoredActions: ['upload/addUpload'],
        ignoredPaths: ['upload.abortControllers'],
      },
    }),
});

export default store;
