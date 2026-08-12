import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Home, LayoutGrid, Files, FileText, Table2, FolderOpen, Users,
  LayoutTemplate, BarChart2, LineChart, Lock, Pen, Settings,
  HelpCircle, ExternalLink, Plus, Cloud, Sun, Moon, ChevronLeft,
  ChevronDown, ChevronRight
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { AccountItem } from './AccountItem';
import { StorageBar } from './StorageBar';
import { setSidebarOpen, setConnectModalOpen } from '../../store/slices/uiSlice';
import { setSelectedAccount } from '../../store/slices/driveSlice';
import { useDrive } from '../../hooks/useDrive';
import { useColorMode } from '../../theme';
import { useAuth } from '../../hooks/useAuth';

/* ── helper ── */
const NavItem = ({ icon: Icon, label, to, active, onClick, indent = false, badge, children, expandable }) => {
  const [open, setOpen] = useState(true);
  if (expandable) {
    return (
      <div>
        <button
          onClick={() => setOpen(o => !o)}
          className={`sidebar-nav-item w-full ${active ? 'active' : ''}`}
          style={{ paddingLeft: indent ? '28px' : undefined }}
        >
          {Icon && <Icon size={15} style={{ flexShrink: 0 }} />}
          <span className="flex-1 truncate">{label}</span>
          {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </button>
        {open && children}
      </div>
    );
  }
  const content = (
    <>
      {Icon && <Icon size={15} style={{ flexShrink: 0 }} />}
      <span className="flex-1 truncate">{label}</span>
      {badge != null && (
        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{badge}</span>
      )}
    </>
  );
  if (to) {
    return (
      <Link
        to={to}
        className={`sidebar-nav-item ${active ? 'active' : ''}`}
        style={{ paddingLeft: indent ? '28px' : undefined }}
        onClick={onClick}
      >
        {content}
      </Link>
    );
  }
  return (
    <button
      className={`sidebar-nav-item ${active ? 'active' : ''}`}
      style={{ paddingLeft: indent ? '28px' : undefined }}
      onClick={onClick}
    >
      {content}
    </button>
  );
};

const SubItem = ({ label, onClick, onAdd }) => (
  <div className="flex items-center group" style={{ paddingLeft: '28px' }}>
    <button
      onClick={onClick}
      className="sidebar-nav-item flex-1"
      style={{ paddingLeft: '8px', fontSize: '0.78rem', fontWeight: 400 }}
    >
      <span className="truncate">{label}</span>
    </button>
    {onAdd && (
      <button
        onClick={onAdd}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded"
        style={{ color: 'var(--color-text-muted)', flexShrink: 0, marginRight: '4px' }}
        title={`Add ${label}`}
      >
        <Plus size={13} />
      </button>
    )}
  </div>
);

const SectionLabel = ({ children }) => (
  <div style={{
    fontSize: '0.67rem', fontWeight: 600, letterSpacing: '0.06em',
    color: 'var(--color-text-muted)', padding: '10px 8px 4px',
    textTransform: 'uppercase'
  }}>
    {children}
  </div>
);

export const Sidebar = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { connectedAccounts, files, selectedAccount } = useSelector(s => s.drive);
  const { disconnectAccount, refreshAccount, reconnectAccount } = useDrive();
  const { mode, toggleColorMode } = useColorMode();
  const { user } = useAuth();

  const isDashboard = location.pathname === '/dashboard' && !selectedAccount;
  const isSettings  = location.pathname === '/settings';
  const isSupport   = location.pathname === '/support';

  return (
    <div className="flex flex-col h-full scrollbar-thin overflow-y-auto" style={{
      background: 'var(--color-bg-sidebar)',
      borderRight: '1px solid var(--color-border)',
      width: 'var(--sidebar-width)',
      minWidth: 'var(--sidebar-width)',
    }}>

      {/* ── User profile ── */}
      <div style={{
        padding: '12px 12px 10px',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex', alignItems: 'center', gap: '10px',
      }}>
        {/* Avatar */}
        <div style={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
          overflow: 'hidden', border: '1px solid var(--color-border)',
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: '0.75rem', fontWeight: 600,
        }}>
          {user?.photoURL
            ? <img src={user.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : (user?.displayName?.[0] || user?.email?.[0] || 'U')
          }
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '0.8rem', fontWeight: 600,
            color: 'var(--color-text-primary)', lineHeight: 1.2,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {user?.displayName || 'My Account'}
          </div>
          <div style={{
            fontSize: '0.7rem', color: 'var(--color-text-muted)', lineHeight: 1.2,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {user?.email || ''}
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
          <button
            onClick={toggleColorMode}
            title={mode === 'dark' ? 'Light mode' : 'Dark mode'}
            style={{
              width: 26, height: 26, borderRadius: 6, border: '1px solid var(--color-border)',
              background: 'transparent', cursor: 'pointer',
              color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 130ms'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-overlay)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {mode === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
          </button>
          <button
            onClick={() => dispatch(setSidebarOpen(false))}
            title="Close sidebar"
            style={{
              width: 26, height: 26, borderRadius: 6, border: '1px solid var(--color-border)',
              background: 'transparent', cursor: 'pointer',
              color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 130ms'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-overlay)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            className="md:hidden"
          >
            <ChevronLeft size={13} />
          </button>
        </div>
      </div>

      {/* ── Primary Navigation ── */}
      <div style={{ padding: '8px 8px 0' }}>
        <NavItem icon={Home} label="Home" to="/dashboard" active={isDashboard}
          onClick={() => dispatch(setSelectedAccount(null))} />

      </div>

      <div style={{ margin: '0 8px', height: '1px', background: 'var(--color-border)' }} />

      <div style={{ margin: '0 8px', height: '1px', background: 'var(--color-border)' }} />

      {/* ── Connected Drives ── */}
      <div style={{ flex: 1, padding: '4px 8px', overflowY: 'auto' }}>
        <SectionLabel>Connected Drives</SectionLabel>

        {connectedAccounts.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '20px 8px',
            color: 'var(--color-text-muted)', fontSize: '0.75rem',
          }}>
            <Cloud size={24} style={{ margin: '0 auto 6px', opacity: 0.4 }} />
            No drives connected
          </div>
        ) : (
          connectedAccounts.map(account => (
            <AccountItem
              key={account.email}
              account={account}
              onDisconnect={disconnectAccount}
              onRefresh={refreshAccount}
              onReconnect={reconnectAccount}
            />
          ))
        )}

        {/* Connect button */}
        <button
          onClick={() => dispatch(setConnectModalOpen(true))}
          className="sidebar-nav-item w-full mt-1"
          style={{ color: 'var(--color-text-muted)', gap: 6 }}
        >
          <div style={{
            width: 18, height: 18, borderRadius: 4, border: '1.5px dashed var(--color-border-strong)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Plus size={10} />
          </div>
          <span style={{ fontSize: '0.78rem' }}>Connect Drive</span>
        </button>
      </div>

      {/* ── Storage Bar ── */}
      <StorageBar />

      {/* ── Bottom links ── */}
      <div style={{
        borderTop: '1px solid var(--color-border)',
        padding: '6px 8px 8px',
      }}>
        <NavItem icon={HelpCircle}  label="Support"  to="/support"  active={isSupport} />
        <NavItem icon={Settings}    label="Settings" to="/settings" active={isSettings} />
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 8px 2px',
        }}>
          <div style={{
            width: 18, height: 18, borderRadius: 4,
            background: 'var(--qa-icon-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Cloud size={11} color="var(--qa-icon-fg)" />
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            DriveUnify
          </span>
          <span style={{
            marginLeft: 'auto', fontSize: '0.65rem',
            color: 'var(--color-text-muted)', fontWeight: 500,
          }}>v2.0</span>
        </div>
      </div>
    </div>
  );
};
