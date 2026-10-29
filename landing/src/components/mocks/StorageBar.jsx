'use client';
import { motion } from 'framer-motion';
import { ease } from '@/lib/motion';

// Fills with scaleX (not width) so it stays on the compositor.
export function StorageBar({ value, color = '#2348d8', height = 4, delay = 0 }) {
  return (
    <div className="overflow-hidden rounded-full bg-slate-800" style={{ height }}>
      <motion.div
        className="h-full w-full rounded-full origin-left"
        style={{ background: color }}
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: value }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.9, ease, delay }}
      />
    </div>
  );
}
