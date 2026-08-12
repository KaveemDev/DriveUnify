import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, RefreshCw, PlugZap, ChevronDown, ChevronRight } from 'lucide-react';
import { setSelectedAccount } from '../../store/slices/driveSlice';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { formatFileSize } from '../../utils/formatters';
import { getAccountColor } from '../../config/constants';
import { getInitials } from '../../utils/formatters';

export const AccountItem = ({ account, onDisconnect, onRefresh, onReconnect }) => {
  const dispatch = useDispatch();
  const { selectedAccount } = useSelector(s => s.drive);
  const [showConfirm, setShowConfirm] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [hovered, setHovered] = useState(false);

  const isExpired  = account.needsReconnect || account.expired;
  const isSelected = selectedAccount === account.email;
  const color      = getAccountColor(account.email);
  const storage    = account.storage;
  const usedPct    = storage ? Math.min(100, storage.usedPercent) : 0;

  const handleSelect     = () => dispatch(setSelectedAccount(isSelected ? null : account.email));
  const handleDisconnect = async () => {
    setDisconnecting(true);
    try { await onDisconnect(account.email); }
    finally { setDisconnecting(false); setShowConfirm(false); }
  };
  const handleReconnect  = async (e) => {
    e.stopPropagation();
    setReconnecting(true);
    try { await onReconnect?.(account.email); }
    finally { setReconnecting(false); }
  };

  return (
    <>
      <div
        onClick={handleSelect}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '5px 6px',
          borderRadius: 6, cursor: 'pointer', marginBottom: 2,
          background: isSelected
            ? 'var(--color-bg-elevated)'
            : hovered ? 'var(--color-bg-overlay)' : 'transparent',
          transition: 'background 130ms',
        }}
      >
        {/* Avatar */}
        <div style={{
          width: 24, height: 24, borderRadius: '50%',
          background: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: '0.6rem', fontWeight: 700, flexShrink: 0,
          overflow: 'hidden',
        }}>
          {account.picture
            ? <img src={account.picture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : getInitials(account.email)
          }
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '0.775rem', fontWeight: 500, lineHeight: 1.2,
            color: 'var(--color-text-primary)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {account.name || account.email.split('@')[0]}
            {isExpired && (
              <span style={{
                marginLeft: 4, fontSize: '0.6rem', background: '#f97316',
                color: '#fff', borderRadius: 3, padding: '1px 4px', fontWeight: 600,
              }}>expired</span>
            )}
          </div>
          {storage && (
            <div style={{ marginTop: 3, display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{
                flex: 1, height: 3, borderRadius: 99,
                background: 'var(--color-border-strong)', overflow: 'hidden',
              }}>
                <div style={{
                  width: `${usedPct}%`, height: '100%', borderRadius: 99,
                  background: usedPct > 80 ? '#ef4444' : color,
                  transition: 'width 0.4s',
                }} />
              </div>
              <span style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)', flexShrink: 0 }}>
                {formatFileSize(storage.used)}
              </span>
            </div>
          )}
        </div>

        {/* Actions — show on hover */}
        {hovered && (
          <div style={{ display: 'flex', gap: 2, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
            {isExpired ? (
              <button
                onClick={handleReconnect}
                disabled={reconnecting}
                title="Reconnect"
                style={{
                  padding: '2px 6px', borderRadius: 4, border: '1px solid #f97316',
                  background: 'transparent', color: '#f97316', fontSize: '0.65rem',
                  cursor: 'pointer', fontWeight: 600,
                }}
              >
                {reconnecting ? '…' : 'Reconnect'}
              </button>
            ) : (
              <button
                onClick={e => { e.stopPropagation(); onRefresh?.(account.email); }}
                title="Refresh"
                style={{
                  width: 20, height: 20, borderRadius: 4, border: '1px solid var(--color-border)',
                  background: 'transparent', color: 'var(--color-text-muted)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <RefreshCw size={11} />
              </button>
            )}
            <button
              onClick={e => { e.stopPropagation(); setShowConfirm(true); }}
              title="Disconnect"
              style={{
                width: 20, height: 20, borderRadius: 4, border: '1px solid var(--color-border)',
                background: 'transparent', color: '#ef4444', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X size={11} />
            </button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Disconnect account?"
        description={`This will remove ${account.email} and all its files from DriveUnify. The files in Google Drive are not affected.`}
        confirmLabel="Disconnect"
        confirmVariant="danger"
        loading={disconnecting}
        onConfirm={handleDisconnect}
      />
    </>
  );
};
