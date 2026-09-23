import React from 'react';

export const GoogleDriveIcon = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M7.71 3.5L1.15 15l3.43 6 6.56-11.5-3.43-6z" fill="#0066DA" />
    <path d="M16.29 3.5H7.71L14.27 15h8.58L16.29 3.5z" fill="#00AC47" />
    <path d="M14.27 15H5.71L2.29 21h17.14L22.85 15h-8.58z" fill="#EA4335" />
    <path d="M7.71 3.5L11.14 9.5 7.71 15.5 4.58 21 1.15 15l6.56-11.5z" fill="#2684FC" opacity="0.1" />
    <path d="M14.27 15l-3.13-5.5 3.13-6 5.16 9-5.16 2.5z" fill="#00832D" opacity="0.1" />
    <path d="M5.71 15h8.56l3.43 6H2.29l3.42-6z" fill="#FFBA00" />
  </svg>
);

export const OneDriveIcon = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" fill="#0078D4" />
  </svg>
);

export const DropboxIcon = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M6 2l6 4-6 4-6-4 6-4zm12 0l6 4-6 4-6-4 6-4zM0 10l6 4-6 4-6-4 6-4zm24 0l6 4-6 4-6-4 6-4zM6 18l6 4 6-4-6-4-6 4z" fill="#0061FF" />
  </svg>
);

export const CloudProviderIcon = ({ provider = 'google_drive', size = 15, className = '' }) => {
  const norm = (provider || '').toLowerCase();
  if (norm.includes('onedrive') || norm.includes('microsoft')) {
    return <OneDriveIcon size={size} className={className} />;
  }
  if (norm.includes('dropbox')) {
    return <DropboxIcon size={size} className={className} />;
  }
  return <GoogleDriveIcon size={size} className={className} />;
};

export const ProviderBadge = ({
  provider = 'google_drive',
  accountEmail = '',
  showLabel = true,
  compact = false,
  className = '',
}) => {
  const getProviderName = () => {
    const norm = (provider || '').toLowerCase();
    if (norm.includes('onedrive')) return 'OneDrive';
    if (norm.includes('dropbox')) return 'Dropbox';
    return 'Google Drive';
  };

  const name = getProviderName();

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium tracking-tight ${className}`}
      style={{
        background: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border)',
        color: 'var(--color-text-secondary)',
      }}
      title={accountEmail ? `${name} (${accountEmail})` : name}
    >
      <CloudProviderIcon provider={provider} size={compact ? 12 : 14} />
      {showLabel && (
        <span className="truncate max-w-[130px]">
          {compact ? name : (accountEmail ? accountEmail.split('@')[0] : name)}
        </span>
      )}
    </div>
  );
};
