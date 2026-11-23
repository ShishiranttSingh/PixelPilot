import TopNav from './components/TopNav'
import HeroSection from './components/HeroSection'
import StatsRow from './components/StatsRow'
import ImageWorkspace from './components/ImageWorkspace'
import WorkflowBuilder from './components/WorkflowBuilder'
import BottomWidgets from './components/BottomWidgets'

export default function App() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-base)', display: 'flex', flexDirection: 'column' }}>
      <TopNav />
      <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <HeroSection />
        <StatsRow />

        {/* Main workspace */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 340px',
          gap: '20px',
          padding: '0 24px 24px',
        }}>
          <ImageWorkspace />
          <WorkflowBuilder />
        </div>

        <BottomWidgets />
      </main>
    </div>
  )
}
