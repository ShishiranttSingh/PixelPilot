export function PageContainer({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ flex: 1, padding: 32, display: 'flex', flexDirection: 'column' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', width: '100%', flex: 1 }}>
        {children}
      </div>
    </div>
  );
}
