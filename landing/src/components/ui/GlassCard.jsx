'use client';
import React from 'react';
import { motion } from 'framer-motion';

// Flat surface card (name kept so existing pages keep working).
export const GlassCard = ({ children, className = '', hoverEffect = true, onClick, ...props }) => (
  <motion.div
    whileHover={hoverEffect ? { y: -4, transition: { duration: 0.2 } } : undefined}
    onClick={onClick}
    className={`rounded-3xl bg-surface p-7 ${className}`}
    {...props}
  >
    {children}
  </motion.div>
);
