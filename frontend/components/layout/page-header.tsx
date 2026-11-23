export function PageHeader({ title, description, actions }: {
  title: string,
  description?: string,
  actions?: React.ReactNode
}) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      marginBottom: 32,
    }}>
      <div>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 28,
          fontWeight: 600,
          color: 'var(--color-text-primary)',
          margin: 0,
          letterSpacing: '-0.02em',
        }}>{title}</h1>
        {description && (
          <p style={{
            fontSize: 14,
            fontFamily: 'var(--font-body)',
            color: 'var(--color-text-secondary)',
            margin: '4px 0 0 0',
          }}>{description}</p>
        )}
      </div>
      {actions && <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>{actions}</div>}
    </div>
  );
}
