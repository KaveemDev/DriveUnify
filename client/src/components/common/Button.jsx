import { clsx } from 'clsx';

const variants = {
  primary: 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg hover:shadow-blue-500/25',
  secondary: 'bg-slate-700 hover:bg-slate-600 text-slate-100 border border-slate-600',
  ghost: 'hover:bg-slate-800 text-slate-300 hover:text-slate-100',
  danger: 'bg-red-600 hover:bg-red-500 text-white',
  outline: 'border border-slate-600 hover:border-slate-500 text-slate-300 hover:text-slate-100 hover:bg-slate-800',
};

const sizes = {
  xs: 'px-2.5 py-1 text-xs gap-1',
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-base gap-2',
};

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  loading,
  icon: Icon,
  iconRight: IconRight,
  onClick,
  type = 'button',
  ...props
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center font-medium rounded-lg',
        'transition-all duration-150 cursor-pointer',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : Icon ? (
        <Icon size={size === 'xs' || size === 'sm' ? 14 : 16} />
      ) : null}
      {children}
      {!loading && IconRight && <IconRight size={size === 'xs' || size === 'sm' ? 14 : 16} />}
    </button>
  );
};
