import { clsx } from 'clsx';

export const Input = ({
  label,
  error,
  icon: Icon,
  className,
  inputClassName,
  ...props
}) => {
  return (
    <div className={clsx('flex flex-col gap-1.5', className)}>
      {label && (
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <Icon size={16} />
          </div>
        )}
        <input
          className={clsx(
            'w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg',
            'text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm shadow-sm',
            'transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            Icon ? 'pl-9 pr-3 py-2.5' : 'px-3 py-2.5',
            error && 'border-red-500 focus:ring-red-500',
            inputClassName
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
};
