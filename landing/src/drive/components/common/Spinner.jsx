import { clsx } from 'clsx';

const sizeMap = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-3',
  xl: 'h-16 w-16 border-4',
};

export const Spinner = ({ size = 'md', className }) => (
  <div
    className={clsx(
      'animate-spin rounded-full border-slate-700 border-t-blue-500',
      sizeMap[size],
      className
    )}
  />
);

export const FullscreenSpinner = () => (
  <div className="fixed inset-0 bg-slate-950 flex items-center justify-center z-50">
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-4 border-slate-800" />
        <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-transparent border-t-blue-500 animate-spin" />
      </div>
      <p className="text-slate-400 text-sm">Loading DriveUnify…</p>
    </div>
  </div>
);

export const InlineSpinner = ({ text = 'Loading…' }) => (
  <div className="flex items-center justify-center gap-3 py-12">
    <Spinner size="md" />
    <span className="text-slate-400 text-sm">{text}</span>
  </div>
);
