// DriveUnify mark: layered drives, three streams merging into one. Source: landing/public/brand/driveunify-mark.svg
export function LogoMark({ size = 24, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className={className} style={{ flexShrink: 0 }}>
      <g fill="#2348d8">
        <rect width="44" height="44" rx="12" opacity="0.3" />
        <rect x="10" y="10" width="44" height="44" rx="12" opacity="0.55" />
        <rect x="20" y="20" width="44" height="44" rx="12" />
      </g>
      <g fill="none" strokeWidth="4.5" strokeLinecap="round">
        <path d="M30 32c7 0 9 10 16 10" stroke="#cfd8fc" />
        <path d="M30 52c7 0 9-10 16-10" stroke="#7d95f2" />
        <path d="M30 42h22" stroke="#fff" />
      </g>
    </svg>
  );
}
