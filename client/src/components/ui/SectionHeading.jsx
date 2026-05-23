import React from 'react';
import { motion } from 'framer-motion';
import { GradientText } from './GradientText';

export const SectionHeading = ({
  badge,
  title,
  highlight,
  description,
  align = 'center',
  className = ''
}) => {
  const alignClass = {
    center: 'text-center items-center',
    left: 'text-left items-start',
    right: 'text-right items-end',
  }[align];

  return (
    <div className={`flex flex-col mb-14 max-w-3xl mx-auto ${alignClass} ${className}`}>
      {badge && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="px-3 py-1 rounded-full text-xs font-semibold tracking-widest uppercase bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-500/20 mb-5"
        >
          {badge}
        </motion.div>
      )}

      <motion.h2
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.08 }}
        className="text-3xl md:text-5xl font-bold tracking-tight mb-5 text-slate-900 dark:text-slate-100"
      >
        {title} {highlight && <GradientText variant="mixed">{highlight}</GradientText>}
      </motion.h2>

      {description && (
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.16 }}
          className="text-base md:text-lg text-slate-500 dark:text-slate-400 max-w-2xl"
        >
          {description}
        </motion.p>
      )}
    </div>
  );
};
