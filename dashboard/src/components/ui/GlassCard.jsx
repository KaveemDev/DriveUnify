import React from 'react';
import { motion } from 'framer-motion';

export const GlassCard = ({
  children,
  className = '',
  hoverEffect = true,
  delay = 0,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, delay }}
      className={`
        relative overflow-hidden rounded-2xl p-6 md:p-8
        glass
        shadow-[0_2px_12px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-glass
        ${hoverEffect ? 'transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:hover:shadow-2xl cursor-pointer' : ''}
        ${className}
      `}
    >
      {/* Top highlight line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-black/[0.04] to-transparent dark:via-white/10 pointer-events-none" />
      {children}
    </motion.div>
  );
};
