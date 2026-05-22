import { useState, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { nanoid } from '@reduxjs/toolkit';
import toast from 'react-hot-toast';
import {
  addUpload, updateUploadProgress, completeUpload,
  failUpload, cancelUpload, clearCompleted,
} from '../store/slices/uploadSlice';
import { upsertFiles } from '../store/slices/driveSlice';
import { uploadFile } from '../services/google-drive/upload';
import { UPLOAD_MAX_SIZE } from '../config/constants';

const MAX_CONCURRENT = 3;

export const useUpload = () => {
  const dispatch = useDispatch();
  const { connectedAccounts } = useSelector(s => s.drive);
  const abortControllersRef = useRef({});
  const [isUploading, setIsUploading] = useState(false);

  const getAccount = (email) =>
    connectedAccounts.find(a => a.email === email) || connectedAccounts[0];

  const uploadSingleFile = useCallback(async (file, uploadId, accountEmail, folderId) => {
    const account = getAccount(accountEmail);
    if (!account) {
      dispatch(failUpload({ id: uploadId, error: 'No connected account found' }));
      return;
    }

    const controller = new AbortController();
    abortControllersRef.current[uploadId] = controller;

    try {
      const result = await uploadFile(account.accessToken, file, {
        folderId,
        accountEmail,
        signal: controller.signal,
        onProgress: (progress) => {
          dispatch(updateUploadProgress({ id: uploadId, progress }));
        },
      });

      dispatch(completeUpload({ id: uploadId, result }));
      dispatch(upsertFiles([result]));
      toast.success(`"${file.name}" uploaded`);
    } catch (err) {
      if (err.message === 'Upload cancelled') {
        dispatch(cancelUpload(uploadId));
      } else {
        dispatch(failUpload({ id: uploadId, error: err.message }));
        toast.error(`Failed to upload "${file.name}"`);
      }
    } finally {
      delete abortControllersRef.current[uploadId];
    }
  }, [dispatch, connectedAccounts]);

  // ── Queue-based concurrent upload (max 3 at a time) ──────────
  const uploadFiles = useCallback(async (files, targetAccountEmail, targetFolderId = null) => {
    const validFiles = Array.from(files).filter(file => {
      if (file.size > UPLOAD_MAX_SIZE) {
        toast.error(`"${file.name}" exceeds the 5GB limit`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    const uploadQueue = validFiles.map(file => {
      const uploadId = nanoid();
      dispatch(addUpload({
        id: uploadId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        accountEmail: targetAccountEmail,
        folderId: targetFolderId,
      }));
      return { file, uploadId, accountEmail: targetAccountEmail, folderId: targetFolderId };
    });

    setIsUploading(true);

    // Process in chunks of MAX_CONCURRENT
    for (let i = 0; i < uploadQueue.length; i += MAX_CONCURRENT) {
      const batch = uploadQueue.slice(i, i + MAX_CONCURRENT);
      await Promise.allSettled(
        batch.map(({ file, uploadId, accountEmail, folderId }) =>
          uploadSingleFile(file, uploadId, accountEmail, folderId)
        )
      );
    }

    setIsUploading(false);
  }, [dispatch, uploadSingleFile]);

  const cancelUploadAction = useCallback((uploadId) => {
    abortControllersRef.current[uploadId]?.abort();
    dispatch(cancelUpload(uploadId));
  }, [dispatch]);

  const retryUpload = useCallback((upload) => {
    // Re-trigger with same params — for simplicity, open file picker
    toast('Please re-select the file to retry', { icon: 'ℹ️' });
  }, []);

  const clearCompletedUploads = useCallback(() => {
    dispatch(clearCompleted());
  }, [dispatch]);

  return {
    uploadFiles,
    cancelUploadAction,
    retryUpload,
    clearCompletedUploads,
    isUploading,
    connectedAccounts,
  };
};
