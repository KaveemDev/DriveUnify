import { ChevronRight, Home, HardDrive } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { setCurrentFolder } from '../../store/slices/driveSlice';
import { getAccountColor } from '../../config/constants';

export const FileBreadcrumb = ({ onNavigateRoot }) => {
  const dispatch     = useDispatch();
  const { currentFolder } = useSelector(s => s.drive);

  const handleRoot = () => {
    dispatch(setCurrentFolder(null));
    onNavigateRoot?.();
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 4,
      fontSize: '0.78rem', color: 'var(--color-text-secondary)',
      flexWrap: 'wrap',
    }}>
      <button
        onClick={handleRoot}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: !currentFolder ? 'var(--color-bg-overlay)' : 'transparent',
          border: 'none', cursor: 'pointer',
          color: !currentFolder ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
          padding: '3px 7px', borderRadius: 5, fontSize: '0.78rem', fontWeight: 500,
          transition: 'background 130ms, color 130ms',
        }}
        onMouseEnter={e => { if (currentFolder) e.currentTarget.style.background = 'var(--color-bg-overlay)'; }}
        onMouseLeave={e => { if (currentFolder) e.currentTarget.style.background = 'transparent'; }}
      >
        <Home size={12} />
        All Files
      </button>

      {currentFolder && (
        <>
          <ChevronRight size={12} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />

          {currentFolder.accountEmail && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{
                  width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                  background: getAccountColor(currentFolder.accountEmail),
                }} />
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                  {currentFolder.accountEmail.split('@')[0]}
                </span>
              </div>
              <ChevronRight size={12} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
            </>
          )}

          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '3px 8px', borderRadius: 5,
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg-elevated)',
            color: 'var(--color-text-primary)', fontSize: '0.78rem', fontWeight: 500,
          }}>
            <HardDrive size={11} />
            {currentFolder.name}
          </div>
        </>
      )}
    </div>
  );
};
