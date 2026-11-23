const IconPixelPilot = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <rect width="28" height="28" rx="7" fill="url(#pp-grad)" />
    <path d="M8 14L11 8L14 14L17 10L20 14" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="20" cy="14" r="2" fill="white" fillOpacity="0.9" />
    <defs>
      <linearGradient id="pp-grad" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
        <stop stopColor="#3b82f6" />
        <stop offset="1" stopColor="#8b5cf6" />
      </linearGradient>
    </defs>
  </svg>
)

const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
    <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.3" />
    <path d="M10 10L13 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
)

const IconBell = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M8 2a4 4 0 0 0-4 4v3L2 11h12l-2-2V6a4 4 0 0 0-4-4Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    <path d="M6.5 12.5a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
)

const IconSun = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
    <circle cx="7.5" cy="7.5" r="2.5" stroke="currentColor" strokeWidth="1.3" />
    <path d="M7.5 1v1.5M7.5 12.5V14M1 7.5h1.5M12.5 7.5H14M2.75 2.75l1.06 1.06M11.19 11.19l1.06 1.06M2.75 12.25l1.06-1.06M11.19 3.81l1.06-1.06" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
)

const IconMoon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
    <path d="M12.5 9A6 6 0 0 1 6 2.5a6 6 0 1 0 6.5 6.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const IconMonitor = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
    <rect x="1" y="2" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
    <path d="M5 13h5M7.5 11v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
)

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NavigationItem {
  label: string
  route: string
}

export type Theme = 'light' | 'dark' | 'system'

export interface TopNavProps {
  applicationName: string
  navigationItems: NavigationItem[]
  activeNavigation: string
  userInitials: string
  searchPlaceholder: string
  searchShortcut: string
  hasNotifications: boolean
  theme: Theme
  isLoading?: boolean
  onNavigationChange: (route: string) => void
  onSearch: () => void
  onNotificationsClick: () => void
  onThemeToggle: () => void
  onProfileClick: () => void
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function NavIconButton({
  children,
  badge = false,
  onClick,
  ariaLabel,
}: {
  children: React.ReactNode
  badge?: boolean
  onClick?: () => void
  ariaLabel?: string
}) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      style={{
        position: 'relative',
        width: 32,
        height: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        border: '1px solid transparent',
        borderRadius: 8,
        color: 'var(--color-text-secondary)',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.background = 'rgba(255,255,255,0.06)'
        el.style.color = 'var(--color-text-primary)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.background = 'transparent'
        el.style.color = 'var(--color-text-secondary)'
      }}
    >
      {children}
      {badge && (
        <span style={{
          position: 'absolute',
          top: 5,
          right: 5,
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: 'var(--color-accent-blue)',
          border: '1.5px solid var(--color-bg-base)',
        }} />
      )}
    </button>
  )
}

function SkeletonBlock({ width, height = 16, radius = 6 }: { width: number | string; height?: number; radius?: number }) {
  return (
    <div style={{
      width,
      height,
      borderRadius: radius,
      background: 'rgba(255,255,255,0.06)',
      flexShrink: 0,
    }} />
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TopNav({
  applicationName,
  navigationItems,
  activeNavigation,
  userInitials,
  searchPlaceholder,
  searchShortcut,
  hasNotifications,
  theme,
  isLoading = false,
  onNavigationChange,
  onSearch,
  onNotificationsClick,
  onThemeToggle,
  onProfileClick,
}: TopNavProps) {
  const ThemeIcon = theme === 'dark' ? IconMoon : theme === 'system' ? IconMonitor : IconSun
  const themeLabel = theme === 'dark' ? 'Switch to light theme' : theme === 'system' ? 'Switch to dark theme' : 'Switch to dark theme'

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      style={{
        height: 56,
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        borderBottom: '1px solid var(--color-border-subtle)',
        background: 'rgba(9,10,13,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        gap: 32,
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <IconPixelPilot />
        {isLoading ? (
          <SkeletonBlock width={80} height={14} />
        ) : (
          <span style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 15,
            color: 'var(--color-text-primary)',
            letterSpacing: '-0.02em',
          }}>
            {applicationName}
          </span>
        )}
      </div>

      {/* Nav links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBlock key={i} width={64} height={28} radius={8} />
          ))
        ) : navigationItems.length === 0 ? null : (
          navigationItems.map(item => {
            const isActive = activeNavigation === item.route || activeNavigation === item.label
            return (
              <button
                key={item.route}
                onClick={() => onNavigationChange(item.route)}
                aria-current={isActive ? 'page' : undefined}
                style={{
                  background: isActive ? 'rgba(255,255,255,0.06)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '6px 12px',
                  borderRadius: 8,
                  fontFamily: 'var(--font-body)',
                  fontSize: 13.5,
                  fontWeight: isActive ? 500 : 400,
                  color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.color = 'var(--color-text-primary)'
                }}
                onMouseLeave={e => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.color = 'var(--color-text-secondary)'
                }}
              >
                {item.label}
              </button>
            )
          })
        )}
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {isLoading ? (
          <>
            <SkeletonBlock width={140} height={32} radius={8} />
            <SkeletonBlock width={32} height={32} radius={8} />
            <SkeletonBlock width={32} height={32} radius={8} />
            <div style={{ width: 1, height: 20, background: 'var(--color-border-subtle)', margin: '0 4px' }} />
            <SkeletonBlock width={30} height={30} radius={10} />
          </>
        ) : (
          <>
            {/* Search */}
            <button
              onClick={onSearch}
              aria-label="Open search"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 12px',
                background: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 8,
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                fontSize: 12.5,
                fontFamily: 'var(--font-body)',
              }}
            >
              <IconSearch />
              <span>{searchPlaceholder}</span>
              {searchShortcut && (
                <span style={{
                  marginLeft: 8,
                  padding: '1px 6px',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: 4,
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-text-muted)',
                }}>
                  {searchShortcut}
                </span>
              )}
            </button>

            {/* Bell */}
            <NavIconButton
              badge={hasNotifications}
              onClick={onNotificationsClick}
              ariaLabel={hasNotifications ? 'View notifications (unread)' : 'View notifications'}
            >
              <IconBell />
            </NavIconButton>

            {/* Theme */}
            <NavIconButton onClick={onThemeToggle} ariaLabel={themeLabel}>
              <ThemeIcon />
            </NavIconButton>

            {/* Divider */}
            <div style={{ width: 1, height: 20, background: 'var(--color-border-subtle)', margin: '0 4px' }} />

            {/* Avatar */}
            <button
              onClick={onProfileClick}
              aria-label="Open profile menu"
              style={{
                width: 30,
                height: 30,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 600,
                fontFamily: 'var(--font-display)',
                color: 'white',
                cursor: 'pointer',
                flexShrink: 0,
                border: 'none',
              }}
            >
              {userInitials || '??'}
            </button>
          </>
        )}
      </div>
    </nav>
  )
}