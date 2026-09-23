import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import {
  Home, Folder, Clock, Star, Users, Trash2,
  Plus, Settings, HelpCircle, ChevronLeft, Sun, Moon,
  Cloud, LogOut
} from 'lucide-react';
import { AccountItem } from './AccountItem';
import { GoogleDriveIcon, OneDriveIcon, DropboxIcon } from '../common/ProviderBadge';
import { setSidebarOpen, setConnectModalOpen, setActiveNav } from '../../store/slices/uiSlice';
import { setSelectedAccount, setCurrentFolder } from '../../store/slices/driveSlice';
import { useDrive } from '../../hooks/useDrive';
import { useColorMode } from '../../theme';
import { useAuth } from '../../hooks/useAuth';

export const Sidebar = ({ onSelectView }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { connectedAccounts, selectedAccount } = useSelector((s) => s.drive);
  const { activeNav } = useSelector((s) => s.ui);
  const { disconnectAccount, refreshAccount, reconnectAccount } = useDrive();
  const { mode, toggleColorMode } = useColorMode();
  const { user, signOut } = useAuth();

  const isSettings = location.pathname === '/settings';
  const isSupport = location.pathname === '/support';

  const navItems = [
    { id: 'home', label: 'Home', icon: Home, to: '/dashboard' },
    { id: 'files', label: 'My Files', icon: Folder, to: '/dashboard' },
    { id: 'recent', label: 'Recent', icon: Clock, to: '/dashboard' },
    { id: 'starred', label: 'Starred', icon: Star, to: '/dashboard' },
    { id: 'shared', label: 'Shared', icon: Users, to: '/dashboard' },
    { id: 'trash', label: 'Trash', icon: Trash2, to: '/dashboard' },
  ];

  const handleNavClick = (itemId) => {
    dispatch(setSelectedAccount(null));
    dispatch(setCurrentFolder(null));
    dispatch(setActiveNav(itemId));
    onSelectView?.(itemId);
  };

  return (
    <aside
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: 'var(--sidebar-width)',
        minWidth: 'var(--sidebar-width)',
        background: 'var(--color-bg-sidebar)',
        borderRight: '1px solid var(--color-border)',
        userSelect: 'none',
      }}
    >
      {/* ── Top: Brand + Collapse ── */}
      <div
        style={{
          height: 'var(--header-height)',
          padding: '0 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0,
        }}
      >
        <Link
          to="/dashboard"
          onClick={() => handleNavClick('home')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              background: 'var(--color-accent)',
              color: 'var(--color-accent-fg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Cloud size={15} />
          </div>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--color-text-primary)' }}>
            DriveUnify
          </span>
          <span
            style={{
              fontSize: '0.625rem',
              fontWeight: 500,
              padding: '1px 5px',
              borderRadius: 4,
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-muted)',
            }}
          >
            v2.0
          </span>
        </Link>

        {/* Collapse toggle (desktop / mobile) */}
        <button
          onClick={() => dispatch(setSidebarOpen(false))}
          title="Collapse sidebar"
          style={{
            width: 26,
            height: 26,
            borderRadius: 5,
            border: '1px solid var(--color-border)',
            background: 'transparent',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background var(--transition-fast)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg-overlay)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <ChevronLeft size={14} />
        </button>
      </div>

      {/* ── Primary Navigation ── */}
      <div style={{ padding: '12px 10px 6px', display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === '/dashboard' && !selectedAccount && activeNav === item.id;

          return (
            <Link
              key={item.id}
              to={item.to}
              onClick={() => handleNavClick(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                padding: '6px 10px',
                borderRadius: 6,
                border: 'none',
                background: isActive ? 'var(--color-bg-elevated)' : 'transparent',
                color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                fontSize: '0.8125rem',
                fontWeight: isActive ? 600 : 500,
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'background var(--transition-fast), color var(--transition-fast)',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'var(--color-bg-overlay)';
                  e.currentTarget.style.color = 'var(--color-text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--color-text-secondary)';
                }
              }}
            >
              <Icon size={15} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.8 }} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div style={{ margin: '8px 12px', height: 1, background: 'var(--color-border)' }} />

      {/* ── Connected Storage Section ── */}
      <div
        style={{
          flex: 1,
          padding: '0 10px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
        className="scrollbar-thin"
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 8px 4px',
            fontSize: '0.675rem',
            fontWeight: 600,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: 'var(--color-text-muted)',
          }}
        >
          <span>Connected Storage</span>
          <span style={{ fontSize: '0.65rem' }}>{connectedAccounts.length}</span>
        </div>

        {/* Google Drive accounts */}
        {connectedAccounts.map((account) => (
          <AccountItem
            key={account.email}
            account={account}
            onDisconnect={disconnectAccount}
            onRefresh={refreshAccount}
            onReconnect={reconnectAccount}
          />
        ))}

        {/* Connect Google Drive Action */}
        <button
          onClick={() => dispatch(setConnectModalOpen(true))}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            width: '100%',
            padding: '6px 8px',
            borderRadius: 6,
            border: '1px dashed var(--color-border)',
            background: 'transparent',
            color: 'var(--color-text-muted)',
            fontSize: '0.78rem',
            fontWeight: 500,
            cursor: 'pointer',
            marginTop: 4,
            marginBottom: 10,
            transition: 'background var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--color-bg-overlay)';
            e.currentTarget.style.borderColor = 'var(--color-border-strong)';
            e.currentTarget.style.color = 'var(--color-text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'var(--color-border)';
            e.currentTarget.style.color = 'var(--color-text-muted)';
          }}
        >
          <Plus size={13} />
          <span>Connect Google Drive</span>
        </button>

        {/* Multi-cloud Roadmap: OneDrive & Dropbox */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 8px 4px',
            fontSize: '0.65rem',
            fontWeight: 600,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: 'var(--color-text-muted)',
            opacity: 0.65,
          }}
        >
          <span>Coming in v2.1</span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '5px 8px',
            borderRadius: 6,
            opacity: 0.45,
            fontSize: '0.75rem',
            color: 'var(--color-text-secondary)',
            cursor: 'default',
          }}
          title="OneDrive integration coming in v2.1"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <OneDriveIcon size={14} />
            <span>OneDrive</span>
          </div>
          <span style={{ fontSize: '0.58rem', padding: '1px 4px', borderRadius: 3, background: 'var(--color-bg-elevated)', color: 'var(--color-text-muted)' }}>
            Soon
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '5px 8px',
            borderRadius: 6,
            opacity: 0.45,
            fontSize: '0.75rem',
            color: 'var(--color-text-secondary)',
            cursor: 'default',
          }}
          title="Dropbox integration coming in v2.1"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <DropboxIcon size={14} />
            <span>Dropbox</span>
          </div>
          <span style={{ fontSize: '0.58rem', padding: '1px 4px', borderRadius: 3, background: 'var(--color-bg-elevated)', color: 'var(--color-text-muted)' }}>
            Soon
          </span>
        </div>
      </div>

      {/* ── Bottom Section: Settings, Support, Profile ── */}
      <div
        style={{
          borderTop: '1px solid var(--color-border)',
          padding: '8px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          flexShrink: 0,
        }}
      >
        <Link
          to="/support"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            padding: '5px 8px',
            borderRadius: 6,
            color: isSupport ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
            background: isSupport ? 'var(--color-bg-elevated)' : 'transparent',
            fontSize: '0.78rem',
            fontWeight: isSupport ? 600 : 500,
            textDecoration: 'none',
            transition: 'background var(--transition-fast)',
          }}
          onMouseEnter={(e) => !isSupport && (e.currentTarget.style.background = 'var(--color-bg-overlay)')}
          onMouseLeave={(e) => !isSupport && (e.currentTarget.style.background = 'transparent')}
        >
          <HelpCircle size={14} />
          <span>Help & Support</span>
        </Link>

        <Link
          to="/settings"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            padding: '5px 8px',
            borderRadius: 6,
            color: isSettings ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
            background: isSettings ? 'var(--color-bg-elevated)' : 'transparent',
            fontSize: '0.78rem',
            fontWeight: isSettings ? 600 : 500,
            textDecoration: 'none',
            transition: 'background var(--transition-fast)',
          }}
          onMouseEnter={(e) => !isSettings && (e.currentTarget.style.background = 'var(--color-bg-overlay)')}
          onMouseLeave={(e) => !isSettings && (e.currentTarget.style.background = 'transparent')}
        >
          <Settings size={14} />
          <span>Settings</span>
        </Link>

        {/* User Profile strip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            padding: '8px 6px 4px',
            marginTop: 4,
            borderTop: '1px solid var(--color-border-subtle)',
          }}
        >
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '0.7rem',
              fontWeight: 600,
              flexShrink: 0,
              overflow: 'hidden',
            }}
          >
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              (user?.displayName?.[0] || user?.email?.[0] || 'U').toUpperCase()
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {user?.displayName || 'My Account'}
            </div>
            <div
              style={{
                fontSize: '0.675rem',
                color: 'var(--color-text-muted)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {user?.email || ''}
            </div>
          </div>

          <button
            onClick={toggleColorMode}
            title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              width: 24,
              height: 24,
              borderRadius: 5,
              border: '1px solid var(--color-border)',
              background: 'transparent',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {mode === 'dark' ? <Sun size={12} /> : <Moon size={12} />}
          </button>
        </div>
      </div>
    </aside>
  );
};
