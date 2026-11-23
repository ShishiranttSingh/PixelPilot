'use client';

interface IconButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
}

export function IconButton({ children, onClick }: IconButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 30,
        height: 30,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 7,
        color: 'var(--color-text-secondary)',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.color = 'var(--color-text-primary)';
        el.style.background = 'rgba(255,255,255,0.06)';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.color = 'var(--color-text-secondary)';
        el.style.background = 'transparent';
      }}
    >
      {children}
    </button>
  );
}
