import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export const AnimatedButton = ({
  children,
  to,
  onClick,
  variant = 'primary', // primary, secondary, outline, ghost
  size = 'md', // sm, md, lg
  className = '',
  fullWidth = false,
  icon: Icon,
  type = 'button',
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-ring outline-none";
  
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-500 shadow-sm hover:shadow-md",
    secondary: "bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 dark:border-slate-700",
    outline: "bg-transparent text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/40",
    ghost: "bg-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50",
  };
  
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-5 py-2.5 text-sm",
    lg: "px-8 py-3.5 text-base",
  };
  
  const widthClass = fullWidth ? "w-full" : "";
  const combinedClasses = `${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`;
  
  const content = (
    <>
      {children}
      {Icon && <Icon className={`ml-2 ${size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'}`} />}
    </>
  );

  if (to) {
    return (
      <Link to={to} className="block w-fit">
        <motion.div
          whileHover={{ scale: 1.02, translateY: -1 }}
          whileTap={{ scale: 0.98 }}
          className={combinedClasses}
        >
          {content}
        </motion.div>
      </Link>
    );
  }

  return (
    <motion.button
      type={type}
      onClick={onClick}
      whileHover={{ scale: 1.02, translateY: -1 }}
      whileTap={{ scale: 0.98 }}
      className={combinedClasses}
    >
      {content}
    </motion.button>
  );
};
