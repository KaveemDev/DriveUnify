'use client';
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export const AnimatedButton = ({
  children,
  to,
  href,
  onClick,
  variant = 'primary',
  size = 'md',
  className = '',
  icon: Icon,
  disabled = false,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-bold transition-transform duration-300 rounded-full select-none cursor-pointer whitespace-nowrap';

  const variants = {
    primary: 'bg-brand text-brand-ink hover:-translate-y-0.5 active:scale-[0.97]',
    secondary: 'bg-raised text-ink hover:-translate-y-0.5 active:scale-[0.97]',
    outline: 'bg-transparent text-ink border border-line hover:bg-raised',
    ghost: 'bg-transparent text-muted hover:text-ink',
    danger: 'bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20',
  };

  const sizes = {
    sm: 'text-sm h-9 px-4 gap-1.5',
    md: 'text-[0.9375rem] h-11 px-5 gap-2',
    lg: 'text-base h-[52px] px-6 gap-2.5',
  };

  const combinedClasses = `${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className} ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`;

  const content = (
    <>
      <span>{children}</span>
      {Icon && <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />}
    </>
  );

  const destination = to || href;
  if (destination) {
    return (
      <Link href={destination} className={combinedClasses} {...props}>
        {content}
      </Link>
    );
  }

  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={combinedClasses}
      {...props}
    >
      {content}
    </motion.button>
  );
};
