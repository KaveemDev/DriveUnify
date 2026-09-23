import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { FolderPlus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { createFolder } from '../../api/googleDriveApi';

export const CreateFolderModal = ({
  open,
  onOpenChange,
  currentFolder,
  connectedAccounts = [],
  onFolderCreated,
}) => {
  const [folderName, setFolderName] = useState('');
  const [selectedEmail, setSelectedEmail] = useState(
    currentFolder?.accountEmail || connectedAccounts[0]?.email || ''
  );
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    const name = folderName.trim();
    if (!name) return;

    const account = connectedAccounts.find(a => a.email === selectedEmail) || connectedAccounts[0];
    if (!account) {
      toast.error('No connected account found');
      return;
    }

    setLoading(true);
    try {
      const parentId = currentFolder?.id || 'root';
      const created = await createFolder(account.accessToken, name, parentId, account.email);
      toast.success(`Folder "${name}" created`);
      onFolderCreated?.({ ...created, accountEmail: account.email });
      setFolderName('');
      onOpenChange(false);
    } catch (err) {
      toast.error(`Failed to create folder: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Create New Folder"
      size="sm"
    >
      <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.78rem',
              fontWeight: 500,
              color: 'var(--color-text-secondary)',
              marginBottom: 6,
            }}
          >
            Folder Name
          </label>
          <input
            type="text"
            placeholder="e.g. Invoices 2026"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            autoFocus
            required
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg-elevated)',
              color: 'var(--color-text-primary)',
              fontSize: '0.85rem',
              outline: 'none',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--color-border-strong)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
          />
        </div>

        {connectedAccounts.length > 1 && !currentFolder && (
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: 500,
                color: 'var(--color-text-secondary)',
                marginBottom: 6,
              }}
            >
              Drive Account
            </label>
            <select
              value={selectedEmail}
              onChange={(e) => setSelectedEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg-elevated)',
                color: 'var(--color-text-primary)',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            >
              {connectedAccounts.map((a) => (
                <option key={a.email} value={a.email}>
                  {a.name ? `${a.name} (${a.email})` : a.email}
                </option>
              ))}
            </select>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            style={{
              padding: '7px 14px',
              borderRadius: 6,
              border: '1px solid var(--color-border)',
              background: 'transparent',
              color: 'var(--color-text-secondary)',
              fontSize: '0.8125rem',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !folderName.trim()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              borderRadius: 6,
              border: 'none',
              background: 'var(--color-accent)',
              color: 'var(--color-accent-fg)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: loading || !folderName.trim() ? 'not-allowed' : 'pointer',
              opacity: loading || !folderName.trim() ? 0.6 : 1,
            }}
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : <FolderPlus size={13} />}
            <span>Create</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
