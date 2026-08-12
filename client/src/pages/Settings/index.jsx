import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  User, HardDrive, Settings as SettingsIcon, AlertTriangle,
  RefreshCw, Plus, LogOut, Shield, Bell, Users,
  ChevronRight, Cloud, LayoutGrid, List, Check, CreditCard,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDrive } from '../../hooks/useDrive';
import { useAuth } from '../../hooks/useAuth';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { formatFileSize } from '../../utils/formatters';
import { setConnectModalOpen } from '../../store/slices/uiSlice';
import { setViewMode, setSortBy } from '../../store/slices/driveSlice';
import { VIEW_MODES, SORT_OPTIONS } from '../../config/constants';
import { getAccountColor } from '../../config/constants';

/* ── Shared section wrapper ── */
const Section = ({ title, description, children }) => (
  <div style={{
    borderRadius: 10,
    border: '1px solid var(--color-border)',
    background: 'var(--color-bg-surface)',
    overflow: 'hidden',
    marginBottom: 12,
  }}>
    {(title || description) && (
      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-bg-elevated)',
      }}>
        {title && (
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
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

/* ── Setting row ── */
const SettingRow = ({ label, description, children }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: 16, flexWrap: 'wrap',
  }}>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: '0.83rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>
        {label}
      </div>
      {description && (
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
          {description}
        </div>
      )}
    </div>
    <div style={{ flexShrink: 0 }}>{children}</div>
  </div>
);

/* ── Segmented control ── */
const SegmentedControl = ({ options, value, onChange }) => (
  <div style={{
    display: 'flex', background: 'var(--color-bg-elevated)',
    border: '1px solid var(--color-border)', borderRadius: 7, padding: 2, gap: 2,
  }}>
    {options.map(opt => (
      <button
        key={opt.value}
        onClick={() => onChange(opt.value)}
        style={{
          padding: '4px 12px', borderRadius: 5, border: 'none', cursor: 'pointer',
          fontSize: '0.78rem', fontWeight: 500,
          background: value === opt.value ? 'var(--color-bg-surface)' : 'transparent',
          color: value === opt.value ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
          boxShadow: value === opt.value ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
          transition: 'all 130ms',
          display: 'flex', alignItems: 'center', gap: 5,
        }}
      >
        {opt.icon && <opt.icon size={13} />}
        {opt.label}
      </button>
    ))}
  </div>
);

/* ── Field label+input combo ── */
const Field = ({ label, children }) => (
  <div>
    <label style={{
      display: 'block', fontSize: '0.72rem', fontWeight: 600,
      color: 'var(--color-text-muted)', textTransform: 'uppercase',
      letterSpacing: '0.05em', marginBottom: 6,
    }}>
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
      width: '100%', padding: '8px 12px', borderRadius: 7,
      border: '1px solid var(--color-border)',
      background: disabled ? 'var(--color-bg-elevated)' : 'var(--color-bg-surface)',
      color: disabled ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
      fontSize: '0.83rem', outline: 'none',
      cursor: disabled ? 'not-allowed' : 'text',
      transition: 'border-color 130ms',
      boxSizing: 'border-box',
    }}
    onFocus={e => { if (!disabled) e.target.style.borderColor = 'var(--color-border-strong)'; }}
    onBlur={e => { e.target.style.borderColor = 'var(--color-border)'; }}
  />
);

/* ── Coming soon placeholder ── */
const ComingSoon = ({ label }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: '40px 24px', textAlign: 'center', gap: 10,
  }}>
    <div style={{
      width: 44, height: 44, borderRadius: 10,
      background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <AlertTriangle size={20} style={{ color: 'var(--color-text-muted)' }} />
    </div>
    <div>
      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 3 }}>
        {label} — coming soon
      </div>
      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
        This section is under active development.
      </div>
    </div>
  </div>
);

/* ── Main Settings page ── */
const Settings = () => {
  const dispatch = useDispatch();
  const { user, signOut } = useAuth();
  const { connectedAccounts, viewMode, sortBy } = useSelector(s => s.drive);
  const { disconnectAccount, refreshAccount } = useDrive();
  const [signOutConfirm, setSignOutConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile',      label: 'Profile',        icon: User },
    { id: 'preferences',  label: 'Preferences',    icon: SettingsIcon },
    { id: 'connected',    label: 'Connected Apps', icon: HardDrive },
    { id: 'security',     label: 'Security',       icon: Shield },
    { id: 'notifications',label: 'Notifications',  icon: Bell },
    { id: 'billing',      label: 'Billing',        icon: CreditCard },
    { id: 'team',         label: 'Team',           icon: Users },
  ];

  const btnStyle = (variant = 'default') => ({
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '7px 14px', borderRadius: 7, border: 'none', cursor: 'pointer',
    fontSize: '0.8rem', fontWeight: 600, transition: 'opacity 150ms',
    ...(variant === 'primary' ? {
      background: 'var(--color-accent)', color: 'var(--color-accent-fg)',
    } : variant === 'danger' ? {
      background: 'transparent', color: '#ef4444',
      border: '1px solid rgba(239,68,68,0.3)',
    } : {
      background: 'var(--color-bg-elevated)',
      color: 'var(--color-text-primary)',
      border: '1px solid var(--color-border)',
    }),
  });

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '24px 16px 48px' }}>
      {/* Page title */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 700,
          color: 'var(--color-text-primary)', letterSpacing: '-0.02em',
        }}>Settings</h1>
        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
          Manage your account, preferences, and connected drives.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* ── Sidebar nav ── */}
        <nav
          className="settings-nav"
          style={{
            width: 200, flexShrink: 0,
            borderRadius: 10, border: '1px solid var(--color-border)',
            background: 'var(--color-bg-surface)',
            overflow: 'hidden', padding: '6px',
            flexDirection: 'column',
          }}
        >
          {/* Mobile: horizontal scroll */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    padding: '8px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                    fontSize: '0.82rem', fontWeight: 500, textAlign: 'left', width: '100%',
                    background: isActive ? 'var(--color-bg-elevated)' : 'transparent',
                    color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                    transition: 'background 130ms, color 130ms',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--color-bg-overlay)'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                >
                  <Icon size={15} style={{ flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{tab.label}</span>
                  {isActive && <ChevronRight size={13} style={{ color: 'var(--color-text-muted)' }} />}
                </button>
              );
            })}
          </div>
        </nav>

        {/* ── Content ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16 }}
            >

              {/* ── Profile ── */}
              {activeTab === 'profile' && (
                <>
                  <Section title="Profile" description="Your name, avatar, and contact information.">
                    {/* Avatar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                      <div style={{
                        width: 64, height: 64, borderRadius: 12, overflow: 'hidden',
                        border: '1px solid var(--color-border)', flexShrink: 0,
                      }}>
                        {user?.photoURL ? (
                          <img src={user.photoURL} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{
                            width: '100%', height: '100%',
                            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontSize: '1.5rem', fontWeight: 700,
                          }}>
                            {user?.displayName?.[0] || user?.email?.[0] || '?'}
                          </div>
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 2 }}>
                          {user?.displayName || 'No name set'}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: 10 }}>
                          {user?.email}
                        </div>
                        {/* Upload photo zone matching reference */}
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '10px 14px', borderRadius: 8,
                          border: '1px solid var(--color-border)',
                          background: 'var(--color-bg-elevated)',
                          cursor: 'pointer',
                        }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: 'var(--color-bg-overlay)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-text-secondary)' }}>
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                              <span style={{ textDecoration: 'underline', fontWeight: 600 }}>Click to upload</span>
                              {' '}or drag and drop
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                              SVG, PNG, JPG or GIF (max. 800×400px)
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}
                         className="grid-cols-1 sm:grid-cols-2">
                      <Field label="Display Name">
                        <TextInput value={user?.displayName || ''} onChange={() => {}} placeholder="Your name" />
                      </Field>
                      <Field label="Email">
                        <TextInput value={user?.email || ''} disabled />
                      </Field>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button style={btnStyle('primary')}>
                        <Check size={13} /> Save changes
                      </button>
                    </div>
                  </Section>

                  {/* Danger zone */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: 16, padding: '16px 20px', borderRadius: 10, flexWrap: 'wrap',
                    border: '1px solid rgba(239,68,68,0.2)',
                    background: 'rgba(239,68,68,0.04)',
                  }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ef4444', marginBottom: 2 }}>Sign out</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        You will be redirected to the login page.
                      </div>
                    </div>
                    <button onClick={() => setSignOutConfirm(true)} style={btnStyle('danger')}>
                      <LogOut size={14} /> Sign out
                    </button>
                  </div>
                </>
              )}

              {/* ── Preferences ── */}
              {activeTab === 'preferences' && (
                <Section title="Preferences" description="Customize how DriveUnify looks and behaves.">
                  <SettingRow
                    label="Default View"
                    description="How files are displayed when you open a folder."
                  >
                    <SegmentedControl
                      value={viewMode}
                      onChange={v => dispatch(setViewMode(v))}
                      options={[
                        { value: VIEW_MODES.LIST,  label: 'List',  icon: List },
                        { value: VIEW_MODES.GRID,  label: 'Grid',  icon: LayoutGrid },
                      ]}
                    />
                  </SettingRow>

                  <Divider />

                  <SettingRow
                    label="Default Sort"
                    description="Initial ordering of files in the file table."
                  >
                    <select
                      value={sortBy}
                      onChange={e => dispatch(setSortBy(e.target.value))}
                      style={{
                        padding: '6px 10px', borderRadius: 7,
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-bg-elevated)',
                        color: 'var(--color-text-primary)',
                        fontSize: '0.82rem', outline: 'none', cursor: 'pointer',
                      }}
                    >
                      {SORT_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </SettingRow>
                </Section>
              )}

              {/* ── Connected Apps ── */}
              {activeTab === 'connected' && (
                <Section title="Connected Drives" description="Manage your linked Google Drive accounts.">
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
                    <button
                      onClick={() => dispatch(setConnectModalOpen(true))}
                      style={btnStyle('default')}
                    >
                      <Plus size={14} /> Add account
                    </button>
                  </div>

                  {connectedAccounts.length === 0 ? (
                    <div style={{
                      textAlign: 'center', padding: '32px 24px',
                      border: '1.5px dashed var(--color-border)', borderRadius: 9,
                    }}>
                      <HardDrive size={28} style={{ color: 'var(--color-text-muted)', margin: '0 auto 8px', opacity: 0.5 }} />
                      <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
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
                      {connectedAccounts.map(account => (
                        <div
                          key={account.email}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '12px 14px', borderRadius: 8,
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-bg-elevated)',
                            flexWrap: 'wrap',
                          }}
                        >
                          {/* Icon */}
                          <div style={{
                            width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                            background: getAccountColor(account.email),
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff',
                          }}>
                            <Cloud size={16} />
                          </div>
                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.83rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                              {account.email}
                            </div>
                            {account.storage && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                                <div style={{
                                  flex: 1, maxWidth: 120, height: 3, borderRadius: 99,
                                  background: 'var(--color-border-strong)', overflow: 'hidden',
                                }}>
                                  <div style={{
                                    width: `${Math.min((account.storage.used / account.storage.limit) * 100, 100)}%`,
                                    height: '100%', borderRadius: 99,
                                    background: getAccountColor(account.email),
                                    transition: 'width 0.5s',
                                  }} />
                                </div>
                                <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                                  {formatFileSize(account.storage.used)} / {formatFileSize(account.storage.limit)}
                                </span>
                              </div>
                            )}
                          </div>
                          {/* Actions */}
                          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                            <button
                              onClick={() => refreshAccount(account.email)}
                              title="Refresh"
                              style={{
                                width: 30, height: 30, borderRadius: 6, border: '1px solid var(--color-border)',
                                background: 'transparent', cursor: 'pointer',
                                color: 'var(--color-text-secondary)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}
                            >
                              <RefreshCw size={13} />
                            </button>
                            <button
                              onClick={() => disconnectAccount(account.email)}
                              style={{
                                padding: '4px 10px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 500,
                                border: '1px solid rgba(239,68,68,0.25)',
                                background: 'transparent', color: '#ef4444', cursor: 'pointer',
                              }}
                            >
                              Disconnect
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Section>
              )}

              {/* ── Other tabs → coming soon ── */}
              {['security', 'notifications', 'billing', 'team'].includes(activeTab) && (
                <Section title={tabs.find(t => t.id === activeTab)?.label}>
                  <ComingSoon label={tabs.find(t => t.id === activeTab)?.label} />
                </Section>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <ConfirmDialog
        open={signOutConfirm}
        onOpenChange={setSignOutConfirm}
        title="Sign out?"
        description="You will be redirected to the login page."
        confirmLabel="Sign Out"
        confirmVariant="danger"
        onConfirm={signOut}
      />
    </div>
  );
};

export default Settings;
