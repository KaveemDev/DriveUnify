import { useState } from 'react';
import {
  HelpCircle, MessageCircle, Book, Zap, ChevronRight,
  ExternalLink, Mail, Search, ArrowRight, CheckCircle2,
  LifeBuoy, FileQuestion, Video
} from 'lucide-react';
import { motion } from 'framer-motion';

/* ── reusable card ── */
const SupportCard = ({ icon: Icon, title, description, action, onClick, external }) => (
  <motion.div whileHover={{ y: -1 }} transition={{ duration: 0.15 }}>
    <div
      onClick={onClick}
      style={{
        padding: '20px',
        borderRadius: 10,
        border: '1px solid var(--color-border)',
        background: 'var(--color-bg-surface)',
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex', flexDirection: 'column', gap: 12,
        transition: 'border-color 130ms, box-shadow 130ms',
        height: '100%',
      }}
      onMouseEnter={e => {
        if (onClick) {
          e.currentTarget.style.borderColor = 'var(--color-border-strong)';
          e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)';
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--color-border)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 9,
        background: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--color-text-secondary)', flexShrink: 0,
      }}>
        <Icon size={20} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: '0.875rem', fontWeight: 600,
          color: 'var(--color-text-primary)', marginBottom: 4,
        }}>{title}</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
          {description}
        </div>
      </div>
      {action && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: '0.78rem', fontWeight: 500,
          color: 'var(--color-text-secondary)',
        }}>
          {action}
          {external ? <ExternalLink size={12} /> : <ArrowRight size={12} />}
        </div>
      )}
    </div>
  </motion.div>
);

const FAQ_ITEMS = [
  {
    q: 'How do I connect a Google Drive account?',
    a: 'Click "Connect Drive" in the sidebar or the Upload button in the top bar. You\'ll be redirected to Google to authorize DriveUnify.'
  },
  {
    q: 'Can I connect multiple Google accounts?',
    a: 'Yes! DriveUnify supports unlimited Google accounts. Each account\'s files are color-coded so you can tell them apart at a glance.'
  },
  {
    q: 'How does file transfer between drives work?',
    a: 'Right-click any file and choose "Copy to Drive". You can then select the destination account. Files are transferred securely via the Google Drive API.'
  },
  {
    q: 'Is my data stored on DriveUnify servers?',
    a: 'No. DriveUnify acts as a bridge — your files remain in Google Drive at all times. We only store your OAuth tokens securely in Firestore.'
  },
  {
    q: 'What happens when I delete a file?',
    a: 'Deleting moves the file to your Google Drive trash. You can choose "Permanently Delete" to bypass trash entirely. Restoring requires going to drive.google.com.'
  },
  {
    q: 'My token expired — what should I do?',
    a: 'Click the "Reconnect" button next to the expired account in the sidebar, or go to Settings → Connected Apps. This will refresh your authorization.'
  },
];

const FAQItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      borderBottom: '1px solid var(--color-border)',
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 12, padding: '14px 0', background: 'transparent', border: 'none',
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-primary)', lineHeight: 1.4 }}>
          {q}
        </span>
        <ChevronRight
          size={15}
          style={{
            color: 'var(--color-text-muted)', flexShrink: 0,
            transform: open ? 'rotate(90deg)' : 'rotate(0)',
            transition: 'transform 200ms',
          }}
        />
      </button>
      {open && (
        <div style={{
          fontSize: '0.8rem', color: 'var(--color-text-secondary)',
          lineHeight: 1.6, paddingBottom: 14,
        }}>
          {a}
        </div>
      )}
    </div>
  );
};

const Support = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFAQ = FAQ_ITEMS.filter(item =>
    !searchQuery ||
    item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{
      maxWidth: 800, margin: '0 auto',
      padding: '24px 16px 48px',
    }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          margin: '0 0 6px', fontSize: '1.25rem', fontWeight: 700,
          color: 'var(--color-text-primary)', letterSpacing: '-0.02em',
        }}>
          Support
        </h1>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
          Get help with DriveUnify — documentation, contact, and FAQs.
        </p>
      </div>

      {/* Quick links grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: 12, marginBottom: 32,
      }}>
        <SupportCard
          icon={Book}
          title="Documentation"
          description="Step-by-step guides for every feature in DriveUnify."
          action="Read docs"
          external
          onClick={() => window.open('/docs', '_blank')}
        />
        <SupportCard
          icon={Video}
          title="Video Tutorials"
          description="Watch walkthroughs to get up and running quickly."
          action="Watch videos"
          external
          onClick={() => window.open('https://youtube.com', '_blank')}
        />
        <SupportCard
          icon={MessageCircle}
          title="Community Forum"
          description="Ask questions and share tips with other users."
          action="Open forum"
          external
          onClick={() => window.open('https://github.com', '_blank')}
        />
        <SupportCard
          icon={Mail}
          title="Contact Us"
          description="Send us a message and we'll respond within 24 hours."
          action="Send email"
          onClick={() => window.location.href = 'mailto:support@driveunify.app'}
        />
      </div>

      {/* Status banner */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 16px', borderRadius: 9,
        border: '1px solid rgba(34,197,94,0.25)',
        background: 'rgba(34,197,94,0.06)',
        marginBottom: 32,
      }}>
        <CheckCircle2 size={16} style={{ color: '#22c55e', flexShrink: 0 }} />
        <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', flex: 1 }}>
          All systems are operational.
        </span>
        <a
          href="https://status.driveunify.app"
          target="_blank"
          rel="noreferrer"
          style={{
            fontSize: '0.78rem', fontWeight: 500,
            color: 'var(--color-text-secondary)',
            display: 'flex', alignItems: 'center', gap: 4,
            textDecoration: 'none',
          }}
        >
          Status page <ExternalLink size={11} />
        </a>
      </div>

      {/* FAQ */}
      <div style={{
        borderRadius: 10, border: '1px solid var(--color-border)',
        background: 'var(--color-bg-surface)', overflow: 'hidden',
      }}>
        {/* FAQ Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 20px',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-bg-elevated)',
        }}>
          <FileQuestion size={16} style={{ color: 'var(--color-text-muted)' }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)', flex: 1 }}>
            Frequently Asked Questions
          </span>

          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{
              position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--color-text-muted)', pointerEvents: 'none',
            }} />
            <input
              type="text"
              placeholder="Search FAQs…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                padding: '5px 10px 5px 28px',
                width: 180, borderRadius: 7,
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg-surface)',
                color: 'var(--color-text-primary)',
                fontSize: '0.78rem', outline: 'none',
              }}
            />
          </div>
        </div>

        <div style={{ padding: '0 20px' }}>
          {filteredFAQ.length === 0 ? (
            <div style={{
              padding: '32px 0', textAlign: 'center',
              color: 'var(--color-text-muted)', fontSize: '0.82rem',
            }}>
              No FAQs match "{searchQuery}"
            </div>
          ) : (
            filteredFAQ.map((item, i) => (
              <FAQItem key={i} q={item.q} a={item.a} />
            ))
          )}
        </div>
      </div>

      {/* Contact card */}
      <div style={{
        marginTop: 24, padding: '20px',
        borderRadius: 10, border: '1px solid var(--color-border)',
        background: 'var(--color-bg-surface)',
        display: 'flex', alignItems: 'center', gap: 16,
        flexWrap: 'wrap',
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 9,
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <LifeBuoy size={20} style={{ color: 'var(--color-text-secondary)' }} />
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 3 }}>
            Still need help?
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
            Our support team is available Monday–Friday, 9am–6pm IST.
          </div>
        </div>
        <a
          href="mailto:support@driveunify.app"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 7,
            border: '1px solid var(--color-border)',
            background: 'transparent', cursor: 'pointer',
            color: 'var(--color-text-primary)',
            fontSize: '0.82rem', fontWeight: 500,
            textDecoration: 'none',
            transition: 'background 130ms',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-overlay)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <Mail size={14} />
          Email support
        </a>
      </div>
    </div>
  );
};

export default Support;
