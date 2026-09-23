import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  User,
  HardDrive,
  Settings as SettingsIcon,
  Shield,
  Bell,
  CreditCard,
  Users,
  ChevronRight,
  Cloud,
  LayoutGrid,
  List,
  Check,
  Plus,
  RefreshCw,
  LogOut,
  Moon,
  Sun,
  Lock,
  Smartphone,
  Key,
  Mail,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useDrive } from '../../hooks/useDrive';
import { useAuth } from '../../hooks/useAuth';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { formatFileSize } from '../../utils/formatters';
import { setConnectModalOpen } from '../../store/slices/uiSlice';
import { setViewMode, setSortBy } from '../../store/slices/driveSlice';
import { VIEW_MODES, SORT_OPTIONS } from '../../config/constants';
import { GoogleDriveIcon, OneDriveIcon, DropboxIcon } from '../../components/common/ProviderBadge';

/* ── Section Wrapper ── */
const Section = ({ title, description, children }) => (
  <div
    style={{
      borderRadius: 10,
      border: '1px solid var(--color-border)',
      background: 'var(--color-bg-surface)',
      overflow: 'hidden',
      marginBottom: 16,
    }}
  >
    {(title || description) && (
      <div
        style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-bg-elevated)',
        }}
      >
        {title && (
          <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {title}
          </div>
        )}
        {description && (
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
            {description}
          </div>
        )}
      </div>
    )}
    <div style={{ padding: '16px 20px' }}>{children}</div>
  </div>
);

/* ── Divider ── */
const Divider = () => (
  <div style={{ height: 1, background: 'var(--color-border)', margin: '14px 0' }} />
);

/* ── Setting Row ── */
const SettingRow = ({ label, description, children }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      flexWrap: 'wrap',
    }}
  >
    <div style={{ minWidth: 0, flex: 1 }}>
      <div style={{ fontSize: '0.83rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>
        {label}
      </div>
      {description && (
        <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
          {description}
        </div>
      )}
    </div>
    <div style={{ flexShrink: 0 }}>{children}</div>
  </div>
);

/* ── Segmented Control ── */
const SegmentedControl = ({ options, value, onChange }) => (
  <div
    style={{
      display: 'flex',
      background: 'var(--color-bg-elevated)',
      border: '1px solid var(--color-border)',
      borderRadius: 7,
      padding: 2,
      gap: 2,
    }}
  >
    {options.map((opt) => (
      <button
        key={opt.value}
        onClick={() => onChange(opt.value)}
        style={{
          padding: '5px 12px',
          borderRadius: 5,
          border: 'none',
          cursor: 'pointer',
          fontSize: '0.78rem',
          fontWeight: 500,
          background: value === opt.value ? 'var(--color-bg-surface)' : 'transparent',
          color: value === opt.value ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
          boxShadow: value === opt.value ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          transition: 'all 130ms',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        {opt.icon && <opt.icon size={13} />}
        {opt.label}
      </button>
    ))}
  </div>
);

/* ── Toggle Switch ── */
const ToggleSwitch = ({ checked, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    style={{
      width: 36,
      height: 20,
      borderRadius: 99,
      background: checked ? 'var(--color-accent, #3B82F6)' : 'var(--color-border-strong)',
      border: 'none',
      position: 'relative',
      cursor: 'pointer',
      transition: 'background 150ms ease',
      padding: 2,
    }}
  >
    <div
      style={{
        width: 16,
        height: 16,
        borderRadius: '50%',
        background: '#ffffff',
        transform: checked ? 'translateX(16px)' : 'translateX(0)',
        transition: 'transform 150ms ease',
        boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
      }}
    />
  </button>
);

/* ── Field Combo ── */
const Field = ({ label, children }) => (
  <div>
    <label
      style={{
        display: 'block',
        fontSize: '0.72rem',
        fontWeight: 600,
        color: 'var(--color-text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: 6,
      }}
    >
      {label}
    </label>
    {children}
  </div>
);

const TextInput = ({ value, onChange, disabled, type = 'text', placeholder }) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    disabled={disabled}
    placeholder={placeholder}
    style={{
      width: '100%',
      padding: '8px 12px',
      borderRadius: 7,
      border: '1px solid var(--color-border)',
      background: disabled ? 'var(--color-bg-elevated)' : 'var(--color-bg-surface)',
      color: disabled ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
      fontSize: '0.83rem',
      outline: 'none',
      cursor: disabled ? 'not-allowed' : 'text',
      transition: 'border-color 130ms',
      boxSizing: 'border-box',
    }}
    onFocus={(e) => {
      if (!disabled) e.target.style.borderColor = 'var(--color-border-strong)';
    }}
    onBlur={(e) => {
      e.target.style.borderColor = 'var(--color-border)';
    }}
  />
);

const Settings = () => {
  const dispatch = useDispatch();
  const { user, signOut } = useAuth();
  const { connectedAccounts, viewMode, sortBy } = useSelector((s) => s.drive);
  const { disconnectAccount, refreshAccount } = useDrive();

  const [signOutConfirm, setSignOutConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  // Form states
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [themeMode, setThemeMode] = useState(
    document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );
  const [notifications, setNotifications] = useState({
    storageAlerts: true,
    fileActivity: false,
    securityNotice: true,
  });
  const [twoFactor, setTwoFactor] = useState(false);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'preferences', label: 'Preferences', icon: SettingsIcon },
    { id: 'connected', label: 'Connected Drives', icon: HardDrive },
    { id: 'security', label: 'Security & Auth', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'billing', label: 'Billing & Plan', icon: CreditCard },
  ];

  const handleSaveProfile = () => {
    toast.success('Profile preferences updated');
  };

  const handleToggleTheme = (mode) => {
    setThemeMode(mode);
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('drivehub_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('drivehub_theme', 'light');
    }
  };

  const btnStyle = (variant = 'default') => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 14px',
    borderRadius: 7,
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: 600,
    transition: 'opacity 150ms',
    ...(variant === 'primary'
      ? { background: 'var(--color-accent, #3b82f6)', color: 'var(--color-accent-fg, #ffffff)' }
      : variant === 'danger'
      ? { background: 'transparent', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }
      : {
          background: 'var(--color-bg-elevated)',
          color: 'var(--color-text-primary)',
          border: '1px solid var(--color-border)',
        }),
  });

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 20px 48px' }}>
      {/* Page Title */}
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            margin: '0 0 4px',
            fontSize: '1.25rem',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            letterSpacing: '-0.02em',
          }}
        >
          Settings & Account Management
        </h1>
        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
          Manage your cloud storage settings, interface preferences, security, and linked drives.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Navigation Sidebar */}
        <nav
          style={{
            width: 210,
            flexShrink: 0,
            borderRadius: 10,
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg-surface)',
            overflow: 'hidden',
            padding: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  padding: '8px 10px',
                  borderRadius: 6,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  textAlign: 'left',
                  width: '100%',
                  background: isActive ? 'var(--color-bg-elevated)' : 'transparent',
                  color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                  transition: 'background 130ms, color 130ms',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'var(--color-bg-overlay)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
              >
                <Icon size={15} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{tab.label}</span>
                {isActive && (
                  <ChevronRight size={13} style={{ color: 'var(--color-text-muted)' }} />
                )}
              </button>
            );
          })}
        </nav>

        {/* Tab Content Panel */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
            >
              {/* ── 1. Profile Tab ── */}
              {activeTab === 'profile' && (
                <>
                  <Section
                    title="Profile Details"
                    description="Your identity, avatar, and Google authentication."
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        marginBottom: 20,
                      }}
                    >
                      <div
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: 12,
                          overflow: 'hidden',
                          border: '1px solid var(--color-border)',
                          flexShrink: 0,
                          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontSize: '1.4rem',
                          fontWeight: 700,
                        }}
                      >
                        {user?.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt="Avatar"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          (user?.displayName?.[0] || user?.email?.[0] || 'U').toUpperCase()
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '0.88rem',
                            fontWeight: 600,
                            color: 'var(--color-text-primary)',
                          }}
                        >
                          {user?.displayName || 'Authenticated User'}
                        </div>
                        <div
                          style={{
                            fontSize: '0.76rem',
                            color: 'var(--color-text-muted)',
                            marginTop: 2,
                          }}
                        >
                          {user?.email}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                        gap: 14,
                        marginBottom: 16,
                      }}
                    >
                      <Field label="Display Name">
                        <TextInput
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Your full name"
                        />
                      </Field>
                      <Field label="Email Address">
                        <TextInput value={user?.email || ''} disabled />
                      </Field>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button onClick={handleSaveProfile} style={btnStyle('primary')}>
                        <Check size={13} /> Save changes
                      </button>
                    </div>
                  </Section>

                  {/* Danger Zone: Sign Out */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 16,
                      padding: '16px 20px',
                      borderRadius: 10,
                      flexWrap: 'wrap',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      background: 'rgba(239, 68, 68, 0.04)',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          color: '#ef4444',
                          marginBottom: 2,
                        }}
                      >
                        Session Sign Out
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>
                        End your active DriveUnify cloud management session.
                      </div>
                    </div>
                    <button onClick={() => setSignOutConfirm(true)} style={btnStyle('danger')}>
                      <LogOut size={14} /> Sign out
                    </button>
                  </div>
                </>
              )}

              {/* ── 2. Preferences Tab ── */}
              {activeTab === 'preferences' && (
                <Section
                  title="Interface & Explorer Preferences"
                  description="Customize the appearance, theme, and default layout of your workspace."
                >
                  <SettingRow
                    label="Theme Mode"
                    description="Switch between Linear-grade sleek dark mode and high-contrast light mode."
                  >
                    <SegmentedControl
                      value={themeMode}
                      onChange={handleToggleTheme}
                      options={[
                        { value: 'dark', label: 'Dark', icon: Moon },
                        { value: 'light', label: 'Light', icon: Sun },
                      ]}
                    />
                  </SettingRow>

                  <Divider />

                  <SettingRow
                    label="Default View Mode"
                    description="Default presentation when navigating between storage directories."
                  >
                    <SegmentedControl
                      value={viewMode}
                      onChange={(v) => dispatch(setViewMode(v))}
                      options={[
                        { value: VIEW_MODES.GRID, label: 'Grid', icon: LayoutGrid },
                        { value: VIEW_MODES.LIST, label: 'List', icon: List },
                      ]}
                    />
                  </SettingRow>

                  <Divider />

                  <SettingRow
                    label="Default File Sorting"
                    description="Automatic sorting criterion applied across file folders."
                  >
                    <select
                      value={sortBy}
                      onChange={(e) => dispatch(setSortBy(e.target.value))}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 7,
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-bg-elevated)',
                        color: 'var(--color-text-primary)',
                        fontSize: '0.8125rem',
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {SORT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </SettingRow>
                </Section>
              )}

              {/* ── 3. Connected Drives Tab ── */}
              {activeTab === 'connected' && (
                <Section
                  title="Linked Cloud Storage Accounts"
                  description="Connect and manage Google Drive accounts with real-time sync."
                >
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                    <button
                      onClick={() => dispatch(setConnectModalOpen(true))}
                      style={btnStyle('default')}
                    >
                      <Plus size={14} /> Connect Another Drive
                    </button>
                  </div>

                  {connectedAccounts.length === 0 ? (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '32px 24px',
                        border: '1.5px dashed var(--color-border)',
                        borderRadius: 9,
                      }}
                    >
                      <HardDrive
                        size={28}
                        style={{ color: 'var(--color-text-muted)', margin: '0 auto 8px', opacity: 0.5 }}
                      />
                      <div
                        style={{
                          fontSize: '0.85rem',
                          fontWeight: 500,
                          color: 'var(--color-text-secondary)',
                          marginBottom: 6,
                        }}
                      >
                        No drives connected yet
                      </div>
                      <button
                        onClick={() => dispatch(setConnectModalOpen(true))}
                        style={{ ...btnStyle('primary'), margin: '0 auto' }}
                      >
                        Connect Google Drive
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {connectedAccounts.map((account) => (
                        <div
                          key={account.email}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: '12px 14px',
                            borderRadius: 8,
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-bg-elevated)',
                            flexWrap: 'wrap',
                          }}
                        >
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 8,
                              background: 'rgba(52, 168, 83, 0.1)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <GoogleDriveIcon size={18} />
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: '0.83rem',
                                fontWeight: 600,
                                color: 'var(--color-text-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                              }}
                            >
                              <span>{account.email}</span>
                              {account.needsReconnect && (
                                <span
                                  style={{
                                    fontSize: '0.65rem',
                                    color: '#ef4444',
                                    background: 'rgba(239,68,68,0.1)',
                                    padding: '1px 5px',
                                    borderRadius: 4,
                                  }}
                                >
                                  Expired
                                </span>
                              )}
                            </div>
                            {account.storage && (
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                  marginTop: 4,
                                }}
                              >
                                <div
                                  style={{
                                    flex: 1,
                                    maxWidth: 120,
                                    height: 3,
                                    borderRadius: 99,
                                    background: 'var(--color-border-strong)',
                                    overflow: 'hidden',
                                  }}
                                >
                                  <div
                                    style={{
                                      width: `${Math.min(
                                        (account.storage.used / account.storage.limit) * 100,
                                        100
                                      )}%`,
                                      height: '100%',
                                      borderRadius: 99,
                                      background: '#34A853',
                                      transition: 'width 0.5s',
                                    }}
                                  />
                                </div>
                                <span
                                  style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}
                                >
                                  {formatFileSize(account.storage.used)} /{' '}
                                  {formatFileSize(account.storage.limit)}
                                </span>
                              </div>
                            )}
                          </div>

                          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                            <button
                              onClick={() => refreshAccount(account.email)}
                              title="Sync files"
                              style={{
                                width: 30,
                                height: 30,
                                borderRadius: 6,
                                border: '1px solid var(--color-border)',
                                background: 'transparent',
                                cursor: 'pointer',
                                color: 'var(--color-text-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <RefreshCw size={13} />
                            </button>
                            <button
                              onClick={() => disconnectAccount(account.email)}
                              style={{
                                padding: '4px 10px',
                                borderRadius: 6,
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                border: '1px solid rgba(239,68,68,0.25)',
                                background: 'transparent',
                                color: '#ef4444',
                                cursor: 'pointer',
                              }}
                            >
                              Disconnect
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Future Integrations Roadmap Notice */}
                  <div
                    style={{
                      marginTop: 14,
                      padding: '12px 14px',
                      borderRadius: 8,
                      border: '1px dashed var(--color-border)',
                      background: 'var(--color-bg-base)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.74rem',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ display: 'flex', gap: 6, opacity: 0.5 }}>
                        <OneDriveIcon size={16} />
                        <DropboxIcon size={16} />
                      </div>
                      <span>
                        Microsoft OneDrive & Dropbox connectors are scheduled for release in{' '}
                        <strong>v2.1</strong>.
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: '0.65rem',
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: 'var(--color-bg-elevated)',
                        color: 'var(--color-text-secondary)',
                        fontWeight: 600,
                      }}
                    >
                      Roadmap
                    </span>
                  </div>
                </Section>
              )}

              {/* ── 4. Security Tab ── */}
              {activeTab === 'security' && (
                <Section
                  title="Security & Cloud Session Auth"
                  description="OAuth token policies, access safeguards, and session timeouts."
                >
                  <SettingRow
                    label="Google OAuth 2.0 Access"
                    description="Tokens are handled securely via Cloud Functions with zero server-side file retention."
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        color: '#10b981',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                      }}
                    >
                      <Shield size={14} />
                      <span>Encrypted SSL</span>
                    </div>
                  </SettingRow>

                  <Divider />

                  <SettingRow
                    label="Automatic Token Refresh"
                    description="Silently requests fresh access tokens before 1-hour expiration."
                  >
                    <ToggleSwitch checked={true} onChange={() => {}} />
                  </SettingRow>

                  <Divider />

                  <SettingRow
                    label="Strict Multi-Factor Re-authentication"
                    description="Require biometric or Google 2FA verification when linking new drives."
                  >
                    <ToggleSwitch checked={twoFactor} onChange={setTwoFactor} />
                  </SettingRow>
                </Section>
              )}

              {/* ── 5. Notifications Tab ── */}
              {activeTab === 'notifications' && (
                <Section
                  title="Notifications & Alerts"
                  description="Choose which notifications and system warnings you want to receive."
                >
                  <SettingRow
                    label="Drive Storage Threshold Warnings"
                    description="Alert when connected accounts exceed 85% of available Google Drive capacity."
                  >
                    <ToggleSwitch
                      checked={notifications.storageAlerts}
                      onChange={(v) =>
                        setNotifications((prev) => ({ ...prev, storageAlerts: v }))
                      }
                    />
                  </SettingRow>

                  <Divider />

                  <SettingRow
                    label="Security & Token Expiry Alerts"
                    description="Display toast and dashboard warnings if an account token requires re-authentication."
                  >
                    <ToggleSwitch
                      checked={notifications.securityNotice}
                      onChange={(v) =>
                        setNotifications((prev) => ({ ...prev, securityNotice: v }))
                      }
                    />
                  </SettingRow>

                  <Divider />

                  <SettingRow
                    label="Batch Transfer Progress Reports"
                    description="Show live progress when transferring files across accounts."
                  >
                    <ToggleSwitch
                      checked={notifications.fileActivity}
                      onChange={(v) =>
                        setNotifications((prev) => ({ ...prev, fileActivity: v }))
                      }
                    />
                  </SettingRow>
                </Section>
              )}

              {/* ── 6. Billing Tab ── */}
              {activeTab === 'billing' && (
                <Section
                  title="Plan & Capacity"
                  description="Your DriveUnify workspace license and connected drive allowances."
                >
                  <div
                    style={{
                      padding: '14px',
                      borderRadius: 8,
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-bg-elevated)',
                      marginBottom: 14,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: '0.88rem',
                          fontWeight: 600,
                          color: 'var(--color-text-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <span>DriveUnify Pro Community Edition</span>
                        <Zap size={14} style={{ color: '#F59E0B' }} />
                      </div>
                      <div
                        style={{
                          fontSize: '0.74rem',
                          color: 'var(--color-text-muted)',
                          marginTop: 3,
                        }}
                      >
                        Unlimited Google Drive integrations • Client-side encryption • Free during v2.0
                      </div>
                    </div>
                    <span
                      style={{
                        padding: '4px 8px',
                        borderRadius: 6,
                        background: 'rgba(16, 185, 129, 0.1)',
                        color: '#10b981',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    >
                      Active Free Tier
                    </span>
                  </div>
                </Section>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <ConfirmDialog
        open={signOutConfirm}
        onOpenChange={setSignOutConfirm}
        title="Sign out of DriveUnify?"
        description="You will be returned to the login screen and will need to authenticate with Google again."
        confirmLabel="Sign Out"
        confirmVariant="danger"
        onConfirm={signOut}
      />
    </div>
  );
};

export default Settings;
