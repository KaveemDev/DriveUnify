import { CheckCircle2, XCircle, X, RotateCcw, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { FileIcon } from '../explorer/FileIcon';
import { formatFileSize } from '../../utils/formatters';
import { getMimeTypeCategory } from '../../config/constants';

export const UploadProgressItem = ({
  upload,
  progress,
  error,
  onCancel,
  onRetry,
  onRemove,
}) => {
  const category = getMimeTypeCategory(upload.fileType || '');
  const isUploading = upload.status === 'uploading' || upload.status === 'pending';
  const isComplete = upload.status === 'complete';
  const isFailed = upload.status === 'failed';
  const isCancelled = upload.status === 'cancelled';

  return (
    <div className={clsx(
      'flex items-center gap-3 px-3 py-2.5 rounded-xl',
      'bg-slate-800/50 border border-slate-700/50',
      'transition-all duration-200'
    )}>
      {/* Icon */}
      <div className="shrink-0">
        {isComplete ? (
          <CheckCircle2 size={18} className="text-emerald-400" />
        ) : isFailed ? (
          <XCircle size={18} className="text-red-400" />
        ) : (
          <FileIcon category={category} size={18} />
        )}
      </div>

      {/* Info + Progress */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-300 truncate">{upload.fileName}</p>
        <p className="text-[10px] text-slate-600 mb-1">{formatFileSize(upload.fileSize)}</p>

        {(isUploading) && (
          <div className="relative h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-violet-500 rounded-full transition-all duration-300"
              style={{ width: `${progress || 0}%` }}
            />
          </div>
        )}

        {isFailed && error && (
          <p className="text-[10px] text-red-400 truncate">{error}</p>
        )}
        {isCancelled && (
          <p className="text-[10px] text-slate-600">Cancelled</p>
        )}
      </div>

      {/* Percent / Status */}
      <div className="shrink-0 text-right">
        {isUploading && (
          <span className="text-xs text-slate-500">{progress || 0}%</span>
        )}
        {isComplete && (
          <span className="text-xs text-emerald-500">Done</span>
        )}
      </div>

      {/* Action buttons */}
      <div className="shrink-0 flex items-center gap-1">
        {isUploading && (
          <button
            className="p-1 rounded-md hover:bg-slate-700 text-slate-500 hover:text-slate-300 cursor-pointer"
            onClick={() => onCancel?.(upload.id)}
            title="Cancel"
          >
            <X size={12} />
          </button>
        )}
        {isFailed && (
          <>
            <button
              className="p-1 rounded-md hover:bg-slate-700 text-slate-500 hover:text-blue-400 cursor-pointer"
              onClick={() => onRetry?.(upload)}
              title="Retry"
            >
              <RotateCcw size={12} />
            </button>
            <button
              className="p-1 rounded-md hover:bg-slate-700 text-slate-500 hover:text-slate-300 cursor-pointer"
              onClick={() => onRemove?.(upload.id)}
              title="Dismiss"
            >
              <X size={12} />
            </button>
          </>
        )}
        {(isComplete || isCancelled) && (
          <button
            className="p-1 rounded-md hover:bg-slate-700 text-slate-500 hover:text-slate-300 cursor-pointer"
            onClick={() => onRemove?.(upload.id)}
            title="Dismiss"
          >
            <X size={12} />
          </button>
        )}
      </div>
    </div>
  );
};
