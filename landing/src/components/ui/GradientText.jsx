import React from 'react';

export const GradientText = ({ children, className = '', variant = 'primary' }) => {
  const gradients = {
    primary: 'from-blue-400 via-indigo-300 to-purple-400',
    mixed: 'from-blue-400 via-teal-300 to-indigo-400',
    sunset: 'from-amber-300 via-orange-400 to-rose-400',
  };

  return (
    <span
      className={`bg-gradient-to-r ${gradients[variant] || gradients.primary} bg-clip-text text-transparent ${className}`}
    >
      {children}
    </span>
  );
};
