import React from 'react';
import { GradientText } from './GradientText';

export const SectionHeading = ({
  badge,
  title,
  gradientWord,
  subtitle,
  align = 'center',
  className = '',
}) => {
  const alignments = {
    center: 'text-center items-center mx-auto',
    left: 'text-left items-start',
  };

  return (
    <div className={`flex flex-col max-w-3xl mb-16 ${alignments[align] || alignments.center} ${className}`}>
      {badge && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-4">
          {badge}
        </span>
      )}
      <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4 leading-tight">
        {title}{' '}
        {gradientWord && <GradientText>{gradientWord}</GradientText>}
      </h2>
      {subtitle && (
        <p className="text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
};
