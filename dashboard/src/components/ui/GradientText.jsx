import React from 'react';

export const GradientText = ({ 
  children, 
  className = '', 
  variant = 'blue' // blue, purple, mixed
}) => {
  const gradients = {
    blue: "from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-blue-600",
    purple: "from-purple-600 to-pink-600 dark:from-purple-400 dark:to-purple-600",
    mixed: "from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-500",
  };

  return (
    <span className={`bg-clip-text text-transparent bg-gradient-to-r ${gradients[variant]} ${className}`}>
      {children}
    </span>
  );
};
