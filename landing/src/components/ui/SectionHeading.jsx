import React from 'react';

// Page title for the inner marketing pages: one h1, left-aligned, one colour.
export const SectionHeading = ({ badge, title, gradientWord, subtitle, className = '' }) => (
  <div className={`flex flex-col items-start max-w-3xl mb-14 ${className}`}>
    {badge && <span className="mb-4 font-bold text-brand">{badge}</span>}
    <h1 className="text-[clamp(2.5rem,1.4rem+3vw,4rem)] font-bold leading-[1.02] tracking-[-0.035em] text-ink mb-5">
      {title}
      {gradientWord && ` ${gradientWord}`}
    </h1>
    {subtitle && <p className="text-[1.1875rem] text-muted max-w-2xl">{subtitle}</p>}
  </div>
);
