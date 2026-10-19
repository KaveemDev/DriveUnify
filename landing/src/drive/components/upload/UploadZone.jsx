import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useSelector } from 'react-redux';
import { Upload, CloudUpload } from 'lucide-react';
import { clsx } from 'clsx';
import { useUpload } from '../../hooks/useUpload';
import toast from 'react-hot-toast';

export const UploadZone = ({ children, targetFolderId = null }) => {
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);
  const { connectedAccounts } = useSelector(s => s.drive);
  const { uploadFiles } = useUpload();

  const handleFiles = useCallback(async (files) => {
    if (files.length === 0) return;

    if (connectedAccounts.length === 0) {
      toast.error('Connect a Google Drive account first');
      return;
    }

    if (connectedAccounts.length === 1) {
      toast(`Uploading ${files.length} file${files.length > 1 ? 's' : ''}…`, { icon: '📤' });
      uploadFiles(files, connectedAccounts[0].email, targetFolderId);
    } else {
      setPendingFiles(files);
      setShowAccountPicker(true);
    }
  }, [connectedAccounts, uploadFiles, targetFolderId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFiles,
    noClick: true,
    noKeyboard: true,
  });

  const triggerFileSelect = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = (e) => {
      if (e.target.files?.length) handleFiles(Array.from(e.target.files));
    };
    input.click();
  };

  return (
    <div {...getRootProps()} className="relative flex-1 flex flex-col min-h-0 h-full">
      <input {...getInputProps()} />

      {children}

      {/* Full-window drag overlay */}
      {isDragActive && (
        <div className="drop-overlay animate-fade-in">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="relative">
              <div className="h-24 w-24 rounded-full bg-brand-soft border-2 border-dashed border-brand flex items-center justify-center animate-pulse-subtle">
                <CloudUpload size={40} className="text-brand" strokeWidth={1.5} />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-white mb-1">Drop files to upload</p>
              <p className="text-muted text-sm">
                {connectedAccounts.length > 0
                  ? `Uploading to ${connectedAccounts[0].email}`
                  : 'Connect a drive account first'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Account picker popover */}
      {showAccountPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="glass rounded-2xl p-5 w-72 shadow-glass animate-slide-up">
            <h3 className="text-base font-semibold text-ink mb-1">Upload to which account?</h3>
            <p className="text-xs text-muted mb-4">{pendingFiles.length} file{pendingFiles.length > 1 ? 's' : ''} selected</p>
            <div className="space-y-2">
              {connectedAccounts.map(account => (
                <button
                  key={account.email}
                  className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-raised transition-colors cursor-pointer"
                  onClick={() => {
                    setShowAccountPicker(false);
                    toast(`Uploading ${pendingFiles.length} file${pendingFiles.length > 1 ? 's' : ''}…`, { icon: '📤' });
                    uploadFiles(pendingFiles, account.email, targetFolderId);
                    setPendingFiles([]);
                  }}
                >
                  <div className="h-7 w-7 rounded-full bg-brand flex items-center justify-center text-brand-ink text-xs font-bold shrink-0">
                    {account.email[0].toUpperCase()}
                  </div>
                  <span className="text-sm text-ink truncate">{account.email}</span>
                </button>
              ))}
            </div>
            <button
              className="mt-3 w-full text-sm text-muted hover:text-ink transition-colors cursor-pointer py-1"
              onClick={() => { setShowAccountPicker(false); setPendingFiles([]); }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Named export for programmatic file picker
export { };
export const UploadTrigger = ({ children, accountEmail, folderId }) => {
  const { uploadFiles } = useUpload();

  const handleClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = (e) => {
      if (e.target.files?.length) {
        uploadFiles(Array.from(e.target.files), accountEmail, folderId);
      }
    };
    input.click();
  };

  return <div onClick={handleClick}>{children}</div>;
};
