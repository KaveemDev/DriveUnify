import React from 'react';

export const GradientText = ({ 
  children, 
  className = '', 
  variant = 'blue' // blue, purple, mixed
}) => {
  const gradients = {
    blue: "from-blue-400 to-blue-600",
    purple: "from-purple-400 to-purple-600",
    mixed: "from-blue-400 via-indigo-400 to-purple-500",
  };

  return (
    <span className={`bg-clip-text text-transparent bg-gradient-to-r ${gradients[variant]} ${className}`}>
      {children}
    </span>
  );
};
