'use client';

import React, { useState, useEffect } from 'react';
import { PageContainer } from '@/components/layout/page-container';
import { useAccent } from '@/context/accent-context';
import { useAuth } from '@/context/auth-context';
import { ACCENT_PALETTES } from '@/lib/accent-theme';
import type { AccentId } from '@/lib/accent-theme';
import { getCreditBalance } from '@/lib/credit-service';
import api from '@/lib/api';
import { fetchNotifications } from '@/lib/notifications';
import type { Notification } from '@/types/notification';
import {
  User, CreditCard, Palette, BarChart2, HardDrive, Activity, AlertTriangle, Trash2, RefreshCw,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

type SectionId = 'account' | 'billing' | 'usage' | 'storage' | 'activity' | 'appearance' | 'danger';

interface Section { id: SectionId; label: string; icon: React.ReactNode }

const SECTIONS: Section[] = [
  { id: 'account',    label: 'Account',    icon: <User size={15} /> },
  { id: 'billing',    label: 'Billing',    icon: <CreditCard size={15} /> },
  { id: 'usage',      label: 'Usage',      icon: <BarChart2 size={15} /> },
  { id: 'storage',    label: 'Storage',    icon: <HardDrive size={15} /> },
  { id: 'activity',   label: 'Activity',   icon: <Activity size={15} /> },
  { id: 'appearance', label: 'Appearance', icon: <Palette size={15} /> },
  { id: 'danger',     label: 'Danger Zone', icon: <AlertTriangle size={15} /> },
];

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

function SettingsCard({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-xl)',
        padding: 24,
        boxShadow: 'var(--color-accent-glow)',
        transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
      }}
      onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = 'var(--color-border-default)'; el.style.boxShadow = 'var(--color-accent-glow-hover)'; }}
      onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = 'var(--color-border-subtle)'; el.style.boxShadow = 'var(--color-accent-glow)'; }}
    >
      <p style={{ margin: 0, fontSize: 16, fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--color-text-primary)', letterSpacing: '-0.01em' }}>{title}</p>
      {desc && <p style={{ margin: '4px 0 16px', fontSize: 12.5, fontFamily: 'var(--font-body)', color: 'var(--color-text-muted)' }}>{desc}</p>}
      {children}
    </div>
  );
}

function InputRow({ label, desc, placeholder, defaultValue, disabled }: {
  label: string; desc?: string; placeholder?: string; defaultValue?: string; disabled?: boolean;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--color-border-subtle)' }}>
      <div>
        <p style={{ margin: 0, fontSize: 13.5, fontFamily: 'var(--font-body)', fontWeight: 500, color: 'var(--color-text-primary)' }}>{label}</p>
        {desc && <p style={{ margin: '2px 0 0', fontSize: 11.5, fontFamily: 'var(--font-body)', color: 'var(--color-text-muted)' }}>{desc}</p>}
      </div>
      <input
        defaultValue={defaultValue}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          width: 240, padding: '8px 12px',
          background: disabled ? 'var(--color-bg-base)' : 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border-default)', borderRadius: 8,
          color: disabled ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
          fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box',
          opacity: disabled ? 0.6 : 1, cursor: disabled ? 'not-allowed' : 'text',
        }}
        onFocus={e => { if (!disabled) e.currentTarget.style.borderColor = 'var(--color-accent)'; }}
        onBlur={e => { e.currentTarget.style.borderColor = 'var(--color-border-default)'; }}
      />
    </div>
  );
}

function ActionButton({
  icon, label, variant = 'ghost', onClick, disabled,
}: {
  icon?: React.ReactNode; label: string; variant?: 'primary' | 'ghost' | 'danger';
  onClick?: () => void; disabled?: boolean;
}) {
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px',
        borderRadius: 8,
        border: isPrimary ? 'none' : '1px solid var(--color-border-default)',
        background: isPrimary
          ? 'var(--color-accent-gradient)'
          : isDanger ? 'rgba(239,68,68,0.12)' : 'transparent',
        color: isPrimary ? 'white' : isDanger ? '#ef4444' : 'var(--color-text-secondary)',
        fontSize: 12.5, fontFamily: 'var(--font-body)', fontWeight: 500, cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: isPrimary ? 'var(--color-accent-button-glow)' : 'none',
        transition: 'all 0.15s ease',
        opacity: disabled ? 0.5 : 1,
      }}
      onMouseEnter={e => { if (!disabled && !isPrimary && !isDanger) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--color-text-primary)'; } }}
      onMouseLeave={e => { if (!disabled && !isPrimary && !isDanger) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-secondary)'; } }}
    >
      {icon} {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Profile Summary Card
// ---------------------------------------------------------------------------

function ProfileSummaryCard({ username, email, credits, loading }: {
  username: string; email: string; credits: number | null; loading: boolean;
}) {
  const shimmer: React.CSSProperties = {
    background: 'var(--color-bg-elevated)',
    borderRadius: 8,
    animation: 'pulse 1.5s ease-in-out infinite',
  };

  if (loading) {
    return (
      <div style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-xl)',
        padding: 24,
        boxShadow: 'var(--color-accent-glow)',
        display: 'flex', alignItems: 'center', gap: 20,
        marginBottom: 24,
      }}>
        <div style={{ ...shimmer, width: 56, height: 56, borderRadius: 14, flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ ...shimmer, width: 140, height: 18 }} />
          <div style={{ ...shimmer, width: 200, height: 14 }} />
        </div>
        <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
          <div style={{ ...shimmer, width: 80, height: 52, borderRadius: 10 }} />
          <div style={{ ...shimmer, width: 80, height: 52, borderRadius: 10 }} />
        </div>
      </div>
    );
  }

  const initials = username !== '—' ? username.slice(0, 2).toUpperCase() : '??';
  const plan = credits !== null && credits > 200 ? 'Pro Plan' : 'Starter Plan';
  const displayCredits = credits !== null ? credits : '—';

  return (
    <div style={{
      background: 'var(--color-bg-card)',
      border: '1px solid var(--color-border-subtle)',
      borderRadius: 'var(--radius-xl)',
      padding: 24,
      boxShadow: 'var(--color-accent-glow)',
      display: 'flex', alignItems: 'center', gap: 20,
      marginBottom: 24,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 14, flexShrink: 0,
        background: 'var(--color-accent-gradient)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'white',
        boxShadow: 'var(--color-accent-button-glow)',
      }}>
        {initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 17, fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--color-text-primary)', letterSpacing: '-0.01em' }}>
          {username}
        </p>
        <p style={{ margin: '2px 0 0', fontSize: 13, fontFamily: 'var(--font-body)', color: 'var(--color-text-muted)' }}>
          {email}
        </p>
      </div>
      <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
        <div style={{ textAlign: 'center', padding: '8px 16px', borderRadius: 10, background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)' }}>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}>Plan</p>
          <p style={{ margin: '2px 0 0', fontSize: 14, fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--color-text-primary)' }}>{plan}</p>
        </div>
        <div style={{ textAlign: 'center', padding: '8px 16px', borderRadius: 10, background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)' }}>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}>Credits</p>
          <p style={{ margin: '2px 0 0', fontSize: 14, fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--color-accent)' }}>{displayCredits}</p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section: Account
// ---------------------------------------------------------------------------

function AccountSection({ username, email }: { username: string; email: string }) {
  const [showSwitchDialog, setShowSwitchDialog] = useState(false);
  const [usernameValue, setUsernameValue] = useState(username);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async () => {
    if (!usernameValue.trim() || usernameValue === username) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      await api.patch('/users/me', { username: usernameValue.trim() });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setSaveError(msg ?? 'Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SettingsCard title="Account Details" desc="Manage your account information.">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--color-border-subtle)' }}>
          <div>
            <p style={{ margin: 0, fontSize: 13.5, fontFamily: 'var(--font-body)', fontWeight: 500, color: 'var(--color-text-primary)' }}>Username</p>
            <p style={{ margin: '2px 0 0', fontSize: 11.5, fontFamily: 'var(--font-body)', color: 'var(--color-text-muted)' }}>Your unique username</p>
          </div>
          <input
            value={usernameValue}
            onChange={e => { setUsernameValue(e.target.value); setSaveSuccess(false); setSaveError(null); }}
            placeholder="username"
            style={{
              width: 240, padding: '8px 12px',
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border-default)', borderRadius: 8,
              color: 'var(--color-text-primary)', fontSize: 13,
              fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'var(--color-accent)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--color-border-default)'; }}
          />
        </div>
        <InputRow label="Email" desc="Contact support to change your email address." defaultValue={email} placeholder="email" disabled />
        {saveError && (
          <p style={{ margin: '8px 0 0', fontSize: 12.5, fontFamily: 'var(--font-body)', color: '#ef4444' }}>{saveError}</p>
        )}
        {saveSuccess && (
          <p style={{ margin: '8px 0 0', fontSize: 12.5, fontFamily: 'var(--font-body)', color: 'var(--color-success)' }}>Changes saved successfully.</p>
        )}
        <div style={{ paddingTop: 16, display: 'flex', gap: 10 }}>
          <ActionButton
            icon={<RefreshCw size={13} />}
            label={saving ? 'Saving…' : 'Save Changes'}
            variant="primary"
            onClick={handleSave}
            disabled={saving || usernameValue === username || !usernameValue.trim()}
          />
        </div>
      </SettingsCard>

      <SettingsCard title="Switch Account" desc="Switch to a different authenticated account.">
        <div style={{ padding: '8px 0' }}>
          <p style={{ margin: '0 0 12px', fontSize: 13, fontFamily: 'var(--font-body)', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
            Accounts authenticated within the last 7 days can be switched to immediately. Others will require password verification.
          </p>
          <ActionButton
            icon={<RefreshCw size={13} />}
            label="Switch Account"
            onClick={() => setShowSwitchDialog(true)}
          />
          {/* TODO: implement account switching dialog with 7-day auth check */}
        </div>
      </SettingsCard>

      {showSwitchDialog && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setShowSwitchDialog(false)}>
          <div style={{
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-xl)', padding: 28, width: 380,
            boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
          }} onClick={e => e.stopPropagation()}>
            <p style={{ margin: '0 0 8px', fontSize: 16, fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--color-text-primary)' }}>Switch Account</p>
            <p style={{ margin: '0 0 20px', fontSize: 13, fontFamily: 'var(--font-body)', color: 'var(--color-text-muted)' }}>
              Account switching is not yet available. This feature will be enabled in a future update.
            </p>
            <ActionButton label="Close" onClick={() => setShowSwitchDialog(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section: Billing
// ---------------------------------------------------------------------------

function BillingSection({ credits }: { credits: number | null }) {
  console.log("BillingSection credits:", credits);
  const displayCredits = credits !== null ? credits : '—';
  const plan = credits !== null && credits > 200 ? 'Pro' : 'Starter';
  const usedPercent = credits !== null ? Math.min((credits / 250) * 100, 100) : 0;
  console.log("usedPercent:", usedPercent);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SettingsCard title="Subscription" desc="Your current plan and billing status.">
        <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
          {[
            { label: 'Plan', value: plan, color: 'var(--color-text-primary)' },
            { label: 'Credits', value: String(displayCredits), color: 'var(--color-accent)' },
            { label: 'Renewal', value: '—', color: 'var(--color-text-primary)' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ flex: 1, padding: 16, borderRadius: 10, background: 'var(--color-bg-elevated)', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}>{label}</p>
              <p style={{ margin: '4px 0 0', fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 600, color }}>{value}</p>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16 }}>
          <ActionButton icon={<CreditCard size={14} />} label="Manage Subscription" variant="primary" />
          {/* TODO: link to billing portal when Stripe integration is available */}
        </div>
      </SettingsCard>

      <SettingsCard title="Credit Usage" desc="Current credit balance.">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
          <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'var(--color-border-subtle)', overflow: 'hidden' }}>
            <div style={{
              width: `${usedPercent}%`, height: '100%', borderRadius: 4,
              background: 'var(--color-accent-gradient-horiz)',
              transition: 'width 0.4s ease',
            }} />
          </div>
          <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
            {displayCredits} remaining
          </span>
        </div>
      </SettingsCard>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section: Usage
// ---------------------------------------------------------------------------

function UsageSection() {
  // TODO: replace with real API call to GET /users/me/stats or equivalent
  const stats = [
    { label: 'Images Enhanced', value: '—' },
    { label: 'Workflows Executed', value: '—' },
    { label: 'Credits Used This Month', value: '—' },
  ];

  return (
    <SettingsCard title="Usage" desc="Your processing activity for this billing period.">
      {/* TODO: fetch from backend usage metrics endpoint */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 8 }}>
        {stats.map(({ label, value }) => (
          <div key={label} style={{
            padding: 16, borderRadius: 10, background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border-subtle)', textAlign: 'center',
          }}>
            <p style={{ margin: 0, fontSize: 22, fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--color-text-primary)' }}>{value}</p>
            <p style={{ margin: '4px 0 0', fontSize: 11.5, fontFamily: 'var(--font-body)', color: 'var(--color-text-muted)' }}>{label}</p>
          </div>
        ))}
      </div>
    </SettingsCard>
  );
}

// ---------------------------------------------------------------------------
// Section: Storage
// ---------------------------------------------------------------------------

function StorageSection() {
  // TODO: replace with real API call to GET /images/stats or equivalent
  return (
    <SettingsCard title="Storage" desc="Your stored images and disk usage.">
      {/* TODO: fetch from backend storage metrics endpoint */}
      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        {[
          { label: 'Images Stored', value: '—' },
          { label: 'Storage Used', value: '—' },
        ].map(({ label, value }) => (
          <div key={label} style={{
            flex: 1, padding: 16, borderRadius: 10, background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border-subtle)', textAlign: 'center',
          }}>
            <p style={{ margin: 0, fontSize: 22, fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--color-text-primary)' }}>{value}</p>
            <p style={{ margin: '4px 0 0', fontSize: 11.5, fontFamily: 'var(--font-body)', color: 'var(--color-text-muted)' }}>{label}</p>
          </div>
        ))}
      </div>
    </SettingsCard>
  );
}

// ---------------------------------------------------------------------------
// Section: Activity
// ---------------------------------------------------------------------------

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  if (Math.floor(hours / 24) === 1) return 'yesterday';
  return `${Math.floor(hours / 24)}d ago`;
}

function ActivitySection() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications()
      .then(data => setNotifications(data.slice(0, 5)))
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <SettingsCard title="Recent Activity" desc="Your latest workflow and credit events.">
      {loading && (
        <div style={{ padding: '24px 0', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}>Loading…</p>
        </div>
      )}

      {!loading && notifications.length === 0 && (
        <div style={{ padding: '24px 0', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', fontFamily: 'var(--font-body)' }}>No recent activity.</p>
          <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}>We'll show important events here.</p>
        </div>
      )}

      {!loading && notifications.length > 0 && (
        <div style={{ marginTop: 8 }}>
          {notifications.map((n, i) => (
            <div key={n.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '11px 0',
              borderBottom: i < notifications.length - 1 ? '1px solid var(--color-border-subtle)' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {!n.is_read && (
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-accent)', flexShrink: 0 }} />
                )}
                <div style={{ paddingLeft: n.is_read ? 16 : 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: n.is_read ? 400 : 600, color: 'var(--color-text-primary)', fontFamily: 'var(--font-body)' }}>{n.title}</p>
                  <p style={{ margin: '1px 0 0', fontSize: 11.5, color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}>{n.message}</p>
                </div>
              </div>
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', marginLeft: 16 }}>
                {relativeTime(n.created_at)}
              </span>
            </div>
          ))}
        </div>
      )}
    </SettingsCard>
  );
}

// ---------------------------------------------------------------------------
// Section: Appearance
// ---------------------------------------------------------------------------

const ACCENT_OPTIONS: { id: AccentId; color: string }[] = [
  { id: 'blue',   color: '#3b82f6' },
  { id: 'purple', color: '#8b5cf6' },
  { id: 'green',  color: '#10b981' },
  { id: 'amber',  color: '#f59e0b' },
  { id: 'red',    color: '#ef4444' },
  { id: 'pink',   color: '#ec4899' },
];

function AppearanceSection({ accentId, setAccentId }: { accentId: AccentId; setAccentId: (id: AccentId) => void }) {
  return (
    <SettingsCard title="Appearance" desc="Customize your PixelPilot experience.">
      <div style={{ padding: '12px 0', borderBottom: '1px solid var(--color-border-subtle)' }}>
        <p style={{ margin: '0 0 10px', fontSize: 13.5, fontFamily: 'var(--font-body)', fontWeight: 500, color: 'var(--color-text-primary)' }}>Accent Color</p>
        <div style={{ display: 'flex', gap: 10 }}>
          {ACCENT_OPTIONS.map(opt => (
            <div
              key={opt.id}
              onClick={() => setAccentId(opt.id)}
              title={opt.id}
              style={{
                width: 30, height: 30, borderRadius: '50%', background: opt.color, cursor: 'pointer',
                border: accentId === opt.id ? '2px solid white' : '2px solid transparent',
                boxShadow: accentId === opt.id ? `0 0 0 2px ${opt.color}` : 'none',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            />
          ))}
        </div>
      </div>
      <div style={{ paddingTop: 12 }}>
        <p style={{ margin: 0, fontSize: 12.5, fontFamily: 'var(--font-body)', color: 'var(--color-text-muted)' }}>
          PixelPilot is dark mode only. Additional appearance options will be available in a future update.
        </p>
      </div>
    </SettingsCard>
  );
}

// ---------------------------------------------------------------------------
// Section: Danger Zone
// ---------------------------------------------------------------------------

type DeleteStep = 'idle' | 'password' | 'otp' | 'confirm';

function DangerSection() {
  const [step, setStep] = useState<DeleteStep>('idle');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmText, setConfirmText] = useState('');

  const reset = () => { setStep('idle'); setPassword(''); setOtp(''); setConfirmText(''); };

  return (
    <SettingsCard title="Danger Zone" desc="Irreversible account actions. Proceed with caution.">
      <div style={{
        marginTop: 8, padding: 16, borderRadius: 10,
        border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.05)',
      }}>
        <p style={{ margin: '0 0 4px', fontSize: 13.5, fontFamily: 'var(--font-body)', fontWeight: 600, color: '#ef4444' }}>Delete Account</p>
        <p style={{ margin: '0 0 14px', fontSize: 12.5, fontFamily: 'var(--font-body)', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
          Permanently delete your account, all images, workflows, and data. This action cannot be undone.
        </p>

        {step === 'idle' && (
          <ActionButton icon={<Trash2 size={13} />} label="Delete Account" variant="danger" onClick={() => setStep('password')} />
        )}

        {step === 'password' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ margin: 0, fontSize: 12.5, fontFamily: 'var(--font-body)', color: 'var(--color-text-secondary)' }}>Step 1 of 3 — Enter your password to continue.</p>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Current password"
              style={{
                width: 280, padding: '8px 12px', background: 'var(--color-bg-elevated)',
                border: '1px solid rgba(239,68,68,0.4)', borderRadius: 8,
                color: 'var(--color-text-primary)', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              {/* TODO: POST /auth/verify-password then trigger OTP send */}
              <ActionButton label="Continue" variant="danger" onClick={() => setStep('otp')} disabled={!password} />
              <ActionButton label="Cancel" onClick={reset} />
            </div>
          </div>
        )}

        {step === 'otp' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ margin: 0, fontSize: 12.5, fontFamily: 'var(--font-body)', color: 'var(--color-text-secondary)' }}>Step 2 of 3 — Enter the verification code sent to your email.</p>
            <input
              type="text"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              placeholder="6-digit code"
              maxLength={6}
              style={{
                width: 180, padding: '8px 12px', background: 'var(--color-bg-elevated)',
                border: '1px solid rgba(239,68,68,0.4)', borderRadius: 8,
                color: 'var(--color-text-primary)', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none',
                letterSpacing: '0.12em',
              }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              {/* TODO: POST /auth/verify-otp */}
              <ActionButton label="Verify" variant="danger" onClick={() => setStep('confirm')} disabled={otp.length < 6} />
              <ActionButton label="Cancel" onClick={reset} />
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ margin: 0, fontSize: 12.5, fontFamily: 'var(--font-body)', color: 'var(--color-text-secondary)' }}>
              Step 3 of 3 — Type <span style={{ fontFamily: 'var(--font-mono)', color: '#ef4444', fontWeight: 600 }}>DELETE</span> to permanently delete your account.
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder="Type DELETE"
              style={{
                width: 220, padding: '8px 12px', background: 'var(--color-bg-elevated)',
                border: '1px solid rgba(239,68,68,0.4)', borderRadius: 8,
                color: '#ef4444', fontSize: 13, fontFamily: 'var(--font-mono)', outline: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              {/* TODO: DELETE /users/me — backend endpoint not yet implemented */}
              <ActionButton
                icon={<Trash2 size={13} />}
                label="Permanently Delete Account"
                variant="danger"
                disabled={confirmText !== 'DELETE'}
                onClick={() => { /* TODO: call DELETE /users/me */ }}
              />
              <ActionButton label="Cancel" onClick={reset} />
            </div>
          </div>
        )}
      </div>
    </SettingsCard>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SectionId>('account');
  const { accentId, setAccentId } = useAccent();
  const { user } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    getCreditBalance().then(setCredits).catch(() => setCredits(0));
  }, []);

  const username = user?.username ?? '—';
  const email = user?.email ?? '—';

  function renderSection() {
    switch (activeSection) {
      case 'account':    return <AccountSection username={username} email={email} />;
      case 'billing':    return <BillingSection credits={credits} />;
      case 'usage':      return <UsageSection />;
      case 'storage':    return <StorageSection />;
      case 'activity':   return <ActivitySection />;
      case 'appearance': return <AppearanceSection accentId={accentId} setAccentId={setAccentId} />;
      case 'danger':     return <DangerSection />;
    }
  }

  return (
    <PageContainer>
      {/* Profile Summary */}
      <ProfileSummaryCard username={username} email={email} credits={credits} loading={!user && credits === null} />

      <div style={{ display: 'flex', gap: 24, minHeight: 'calc(100vh - 260px)' }}>
        {/* Sidebar */}
        <div style={{
          width: 200, flexShrink: 0,
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-xl)',
          padding: 8, height: 'fit-content',
          boxShadow: 'var(--color-accent-glow)',
        }}>
          <p style={{ margin: '4px 8px 8px', fontSize: 11, fontFamily: 'var(--font-body)', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Settings</p>
          {SECTIONS.map(s => {
            const isDanger = s.id === 'danger';
            const isActive = activeSection === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8,
                  border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left',
                  background: isActive
                    ? isDanger ? 'rgba(239,68,68,0.1)' : 'var(--color-accent-dim)'
                    : 'transparent',
                  color: isActive
                    ? isDanger ? '#ef4444' : 'var(--color-accent)'
                    : isDanger ? 'rgba(239,68,68,0.7)' : 'var(--color-text-secondary)',
                  fontWeight: isActive ? 600 : 400,
                  fontSize: 13, fontFamily: 'var(--font-body)',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = isDanger ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.04)';
                    e.currentTarget.style.color = isDanger ? '#ef4444' : 'var(--color-text-primary)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = isDanger ? 'rgba(239,68,68,0.7)' : 'var(--color-text-secondary)';
                  }
                }}
              >
                {s.icon} {s.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {renderSection()}
        </div>
      </div>
    </PageContainer>
  );
}