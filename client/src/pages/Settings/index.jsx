import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  User, HardDrive, Settings as SettingsIcon, AlertTriangle,
  RefreshCw, Plus, LogOut, Shield, CreditCard, Bell, Users,
  ChevronRight, Cloud
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
import { AnimatedButton } from '../../components/ui';

const Section = ({ title, icon: Icon, children }) => (
  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 overflow-hidden">
    <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
      <Icon size={16} className="text-slate-500 dark:text-slate-400" />
      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{title}</span>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const Settings = () => {
  const dispatch = useDispatch();
  const { user, signOut } = useAuth();
  const { connectedAccounts, viewMode, sortBy } = useSelector(s => s.drive);
  const { disconnectAccount, refreshAccount } = useDrive();
  const [signOutConfirm, setSignOutConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'connected', label: 'Connected Apps', icon: HardDrive },
    { id: 'team', label: 'Team', icon: Users },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Settings</h1>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar tabs */}
        <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible md:w-52 flex-shrink-0 pb-2 md:pb-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 md:w-full ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon size={17} />
                <span>{tab.label}</span>
                {isActive && <ChevronRight size={14} className="ml-auto opacity-40 hidden md:block" />}
              </button>
            );
          })}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col gap-4"
            >
              {activeTab === 'profile' && (
                <>
                  <Section title="Profile" icon={User}>
                    <div className="flex flex-col sm:flex-row gap-6 items-start">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 flex-shrink-0">
                        {user?.photoURL ? (
                          <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                            {user?.displayName?.[0] || '?'}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-4 w-full">
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Display Name</label>
                            <input
                              type="text"
                              defaultValue={user?.displayName}
                              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-colors"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email</label>
                            <input
                              type="email"
                              defaultValue={user?.email}
                              disabled
                              className="w-full bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-400 dark:text-slate-500 cursor-not-allowed"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <AnimatedButton size="sm">Save Changes</AnimatedButton>
                        </div>
                      </div>
                    </div>
                  </Section>

                  <Section title="Preferences" icon={SettingsIcon}>
                    <div className="space-y-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-200">Default View</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">How files are displayed</p>
                        </div>
                        <div className="flex bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5">
                          <button
                            onClick={() => dispatch(setViewMode(VIEW_MODES.GRID))}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === VIEW_MODES.GRID ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'}`}
                          >
                            Grid
                          </button>
                          <button
                            onClick={() => dispatch(setViewMode(VIEW_MODES.LIST))}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === VIEW_MODES.LIST ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'}`}
                          >
                            List
                          </button>
                        </div>
                      </div>
                      <div className="h-px bg-slate-100 dark:bg-slate-800" />
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-200">Default Sort</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">How files are ordered initially</p>
                        </div>
                        <select
                          value={sortBy}
                          onChange={(e) => dispatch(setSortBy(e.target.value))}
                          className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                        >
                          {SORT_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </Section>

                  <div className="flex items-center justify-between p-5 rounded-2xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/10">
                    <div>
                      <p className="font-semibold text-red-700 dark:text-red-400 text-sm">Sign Out</p>
                      <p className="text-xs text-red-500 dark:text-red-500 mt-0.5">You will need to log in again</p>
                    </div>
                    <button
                      onClick={() => setSignOutConfirm(true)}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700/60 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    >
                      <LogOut size={15} /> Sign Out
                    </button>
                  </div>
                </>
              )}

              {activeTab === 'connected' && (
                <Section title="Connected Drives" icon={HardDrive}>
                  <div className="space-y-4">
                    <div className="flex justify-end">
                      <button
                        onClick={() => dispatch(setConnectModalOpen(true))}
                        className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <Plus size={15} /> Add another account
                      </button>
                    </div>

                    {connectedAccounts.length === 0 ? (
                      <div className="text-center py-10 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                        <HardDrive size={36} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                        <p className="text-slate-500 dark:text-slate-400 text-sm">No drives connected yet.</p>
                        <button
                          onClick={() => dispatch(setConnectModalOpen(true))}
                          className="mt-3 text-sm text-blue-500 hover:underline"
                        >
                          Connect your first drive
                        </button>
                      </div>
                    ) : (
                      connectedAccounts.map(account => (
                        <div
                          key={account.email}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                              style={{ backgroundColor: getAccountColor(account.email) }}
                            >
                              <Cloud size={18} />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900 dark:text-white">{account.email}</p>
                              {account.storage && (
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="w-28 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-blue-500 rounded-full"
                                      style={{ width: `${Math.min((account.storage.used / account.storage.limit) * 100, 100)}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-slate-500 dark:text-slate-400">
                                    {formatFileSize(account.storage.used)} / {formatFileSize(account.storage.limit)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => refreshAccount(account.email)}
                              title="Refresh"
                              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                              <RefreshCw size={15} />
                            </button>
                            <button
                              onClick={() => disconnectAccount(account.email)}
                              className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                              Disconnect
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Section>
              )}

              {['security', 'notifications', 'billing', 'team'].includes(activeTab) && (
                <Section title={tabs.find(t => t.id === activeTab)?.label} icon={tabs.find(t => t.id === activeTab)?.icon || AlertTriangle}>
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                      <AlertTriangle size={28} className="text-slate-400" />
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 font-medium">Coming soon</p>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">This section is under active development.</p>
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
