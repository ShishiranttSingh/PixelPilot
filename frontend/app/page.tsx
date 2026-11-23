'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconPixelPilot = () => (
  <svg width="32" height="32" viewBox="0 0 28 28" fill="none">
    <rect width="28" height="28" rx="7" fill="url(#pp-land-grad)" />
    <path d="M8 14L11 8L14 14L17 10L20 14" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="20" cy="14" r="2" fill="white" fillOpacity="0.9" />
    <defs>
      <linearGradient id="pp-land-grad" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
        <stop stopColor="#3b82f6" />
        <stop offset="1" stopColor="#8b5cf6" />
      </linearGradient>
    </defs>
  </svg>
);

const IconZap = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M11 2L4 11h7l-2 7 7-9h-7l2-7Z" fill="currentColor" />
  </svg>
);

const IconCpu = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <rect x="5" y="5" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.4" />
    <path d="M8 5V3M12 5V3M8 17v-2M12 17v-2M5 8H3M5 12H3M17 8h-2M17 12h-2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <rect x="8" y="8" width="4" height="4" rx="1" fill="currentColor" opacity="0.5" />
  </svg>
);

const IconShield = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M10 2L3 5v5c0 4.5 3 7.4 7 8 4-0.6 7-3.5 7-8V5l-7-3Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconPlugin = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M8 3v3H5l5 5 5-5h-3V3H8Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M4 13H3a1 1 0 000 2h1v1a1 1 0 002 0v-1h8v1a1 1 0 002 0v-1h1a1 1 0 000-2h-1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const IconActivity = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M2 10h3l2-6 4 12 2-6h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconCloud = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M5 14a4 4 0 01-.5-7.9A5 5 0 0114.5 8H15a3 3 0 010 6H5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
  </svg>
);

const IconArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M2 7l4 4 6-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ─── Data ─────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: <IconZap />,
    label: 'Auto Analysis',
    title: 'Instant Image Intelligence',
    description: 'Heuristic engine automatically detects blur, noise, and resolution issues before any processing begins.',
    color: '#3b82f6',
    dim: 'rgba(59,130,246,0.12)',
  },
  {
    icon: <IconCpu />,
    label: 'Intelligent Pipelines',
    title: 'Sequential AI Execution',
    description: 'Orchestrates Real-ESRGAN, NAFNet, and Restormer in optimal order based on detected image characteristics.',
    color: '#8b5cf6',
    dim: 'rgba(139,92,246,0.12)',
  },
  {
    icon: <IconShield />,
    label: 'Production Grade',
    title: 'ONNX Runtime Inference',
    description: 'Built on ONNX Runtime for blazing fast, reliable inference that scales to production workloads.',
    color: '#10b981',
    dim: 'rgba(16,185,129,0.12)',
  },
  {
    icon: <IconPlugin />,
    label: 'Plugin Based',
    title: 'Extensible Enhancement',
    description: 'Modular plugin architecture lets you compose custom enhancement pipelines for any use case.',
    color: '#f59e0b',
    dim: 'rgba(245,158,11,0.12)',
  },
  {
    icon: <IconActivity />,
    label: 'Real-time Monitoring',
    title: 'Live Workflow Tracking',
    description: 'Monitor every stage of your enhancement pipeline in real time with granular job status reporting.',
    color: '#ec4899',
    dim: 'rgba(236,72,153,0.12)',
  },
  {
    icon: <IconCloud />,
    label: 'Cloud Processing',
    title: 'Scalable Infrastructure',
    description: 'Celery-backed distributed processing with Cloudinary integration for effortless cloud-scale throughput.',
    color: '#06b6d4',
    dim: 'rgba(6,182,212,0.12)',
  },
];

const WORKFLOW_STEPS = [
  { step: '01', label: 'Image Upload', desc: 'Drag, drop, or import from cloud storage' },
  { step: '02', label: 'Image Analysis', desc: 'Heuristic scoring across 12 quality dimensions' },
  { step: '03', label: 'AI Pipeline', desc: 'Model selection and execution order optimized' },
  { step: '04', label: 'Processing', desc: 'Distributed Celery workers handle enhancement' },
  { step: '05', label: 'Result Generation', desc: 'Output validated and quality-checked' },
  { step: '06', label: 'Export', desc: 'Download or sync directly to your workflow' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [loading, user, router]);

  if (loading || user) return null;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#090a0d',
      color: 'white',
      fontFamily: 'var(--font-body, system-ui, sans-serif)',
      overflowX: 'hidden',
    }}>

      {/* ── Top Nav ── */}
      <nav style={{
        height: 64,
        display: 'flex',
        alignItems: 'center',
        padding: '0 32px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(9,10,13,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <IconPixelPilot />
          <span style={{
            fontFamily: 'var(--font-display, system-ui)',
            fontWeight: 700,
            fontSize: 17,
            letterSpacing: '-0.02em',
            color: 'white',
          }}>PixelPilot</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/login" style={{
            padding: '8px 18px',
            borderRadius: 9,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.8)',
            fontSize: 14,
            fontWeight: 500,
            textDecoration: 'none',
            transition: 'all 0.15s ease',
          }}>
            Login
          </Link>
          <Link href="/register" style={{
            padding: '8px 18px',
            borderRadius: 9,
            background: 'linear-gradient(135deg, #3b82f6 0%, #6d5ce7 100%)',
            border: 'none',
            color: 'white',
            fontSize: 14,
            fontWeight: 600,
            textDecoration: 'none',
            boxShadow: '0 0 20px rgba(59,130,246,0.3)',
          }}>
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{
        padding: '100px 32px 80px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background glows */}
        <div style={{
          position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)',
          width: 700, height: 500,
          background: 'radial-gradient(ellipse, rgba(59,130,246,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: 0, left: '20%',
          width: 400, height: 400,
          background: 'radial-gradient(ellipse, rgba(139,92,246,0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', maxWidth: 820, margin: '0 auto' }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 14px',
            background: 'rgba(59,130,246,0.1)',
            border: '1px solid rgba(59,130,246,0.25)',
            borderRadius: 99,
            fontSize: 12,
            fontFamily: 'var(--font-mono, monospace)',
            color: '#60a5fa',
            fontWeight: 500,
            letterSpacing: '0.04em',
            marginBottom: 32,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }} />
            v1.0 · Production Ready
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display, system-ui)',
            fontSize: 'clamp(40px, 6vw, 72px)',
            fontWeight: 800,
            letterSpacing: '-0.04em',
            lineHeight: 1.1,
            margin: '0 0 24px',
            color: 'white',
          }}>
            Intelligent AI Workflows<br />
            <span style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Perfected for Every Pixel.
            </span>
          </h1>

          <p style={{
            fontSize: 18,
            lineHeight: 1.7,
            color: 'rgba(255,255,255,0.5)',
            maxWidth: 560,
            margin: '0 auto 40px',
          }}>
            PixelPilot analyzes your images and orchestrates custom-built AI pipelines to deliver professional results instantly — no manual configuration required.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/register" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '13px 28px',
              borderRadius: 11,
              background: 'linear-gradient(135deg, #3b82f6 0%, #6d5ce7 100%)',
              color: 'white',
              fontSize: 15,
              fontWeight: 600,
              textDecoration: 'none',
              boxShadow: '0 0 32px rgba(59,130,246,0.35)',
            }}>
              Get Started Free <IconArrowRight />
            </Link>
            <Link href="/login" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '13px 28px',
              borderRadius: 11,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.8)',
              fontSize: 15,
              fontWeight: 500,
              textDecoration: 'none',
            }}>
              Login to Dashboard
            </Link>
          </div>

          {/* Social proof strip */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 32,
            marginTop: 56,
            paddingTop: 32,
            borderTop: '1px solid rgba(255,255,255,0.06)',
            flexWrap: 'wrap',
          }}>
            {[
              { value: '4×', label: 'Upscale Quality' },
              { value: '< 2s', label: 'Processing Time' },
              { value: '6+', label: 'AI Models' },
              { value: '99.9%', label: 'Uptime SLA' },
            ].map(({ value, label }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'white', letterSpacing: '-0.03em' }}>{value}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{
        padding: '80px 32px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0.015)',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{
              display: 'inline-block',
              padding: '4px 14px',
              background: 'rgba(139,92,246,0.12)',
              border: '1px solid rgba(139,92,246,0.2)',
              borderRadius: 99,
              fontSize: 12,
              fontFamily: 'var(--font-mono, monospace)',
              color: '#a78bfa',
              marginBottom: 16,
              letterSpacing: '0.04em',
            }}>
              CAPABILITIES
            </div>
            <h2 style={{
              fontFamily: 'var(--font-display, system-ui)',
              fontSize: 'clamp(28px, 4vw, 42px)',
              fontWeight: 700,
              letterSpacing: '-0.03em',
              margin: 0,
              color: 'white',
            }}>
              Everything you need to enhance at scale
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 16,
          }}>
            {FEATURES.map(f => (
              <div key={f.label} style={{
                padding: '24px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 14,
                transition: 'border-color 0.2s ease',
              }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: f.dim,
                  border: `1px solid ${f.color}30`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: f.color,
                  marginBottom: 16,
                }}>
                  {f.icon}
                </div>
                <div style={{
                  fontSize: 11,
                  fontFamily: 'var(--font-mono, monospace)',
                  color: f.color,
                  fontWeight: 500,
                  letterSpacing: '0.06em',
                  marginBottom: 6,
                }}>
                  {f.label.toUpperCase()}
                </div>
                <h3 style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: 'white',
                  margin: '0 0 8px',
                  fontFamily: 'var(--font-display, system-ui)',
                  letterSpacing: '-0.01em',
                }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'rgba(255,255,255,0.45)', margin: 0 }}>
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Workflow Showcase ── */}
      <section style={{ padding: '80px 32px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{
              display: 'inline-block',
              padding: '4px 14px',
              background: 'rgba(59,130,246,0.1)',
              border: '1px solid rgba(59,130,246,0.2)',
              borderRadius: 99,
              fontSize: 12,
              fontFamily: 'var(--font-mono, monospace)',
              color: '#60a5fa',
              marginBottom: 16,
              letterSpacing: '0.04em',
            }}>
              WORKFLOW
            </div>
            <h2 style={{
              fontFamily: 'var(--font-display, system-ui)',
              fontSize: 'clamp(28px, 4vw, 42px)',
              fontWeight: 700,
              letterSpacing: '-0.03em',
              margin: 0,
              color: 'white',
            }}>
              From upload to enhanced in seconds
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {WORKFLOW_STEPS.map((s, i) => (
              <div key={s.step} style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                {/* Step indicator column */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontFamily: 'var(--font-mono, monospace)',
                    fontWeight: 700,
                    color: 'white',
                    flexShrink: 0,
                    boxShadow: '0 0 16px rgba(59,130,246,0.3)',
                  }}>
                    {s.step}
                  </div>
                  {i < WORKFLOW_STEPS.length - 1 && (
                    <div style={{ width: 1, height: 40, background: 'linear-gradient(to bottom, rgba(59,130,246,0.4), rgba(139,92,246,0.1))', marginTop: 0 }} />
                  )}
                </div>

                {/* Content */}
                <div style={{ paddingBottom: i < WORKFLOW_STEPS.length - 1 ? 8 : 0, paddingTop: 8 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'white', marginBottom: 4, fontFamily: 'var(--font-display)' }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5, marginBottom: i < WORKFLOW_STEPS.length - 1 ? 16 : 0 }}>
                    {s.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div style={{
            marginTop: 56,
            padding: '32px',
            background: 'rgba(59,130,246,0.06)',
            border: '1px solid rgba(59,130,246,0.15)',
            borderRadius: 16,
            textAlign: 'center',
          }}>
            <h3 style={{
              fontSize: 22,
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              letterSpacing: '-0.02em',
              margin: '0 0 8px',
            }}>
              Ready to enhance your images?
            </h3>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', margin: '0 0 24px' }}>
              Start with a free account. No credit card required.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
              <Link href="/register" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '11px 24px',
                borderRadius: 10,
                background: 'linear-gradient(135deg, #3b82f6 0%, #6d5ce7 100%)',
                color: 'white',
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none',
                boxShadow: '0 0 24px rgba(59,130,246,0.3)',
              }}>
                Create Free Account <IconArrowRight />
              </Link>
              <Link href="/login" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '11px 24px',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.75)',
                fontSize: 14,
                fontWeight: 500,
                textDecoration: 'none',
              }}>
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <IconPixelPilot />
          <span style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 14,
            color: 'rgba(255,255,255,0.6)',
            letterSpacing: '-0.01em',
          }}>
            PixelPilot
          </span>
        </div>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-mono, monospace)' }}>
            v1.0.0
          </span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
            © {new Date().getFullYear()} PixelPilot. All rights reserved.
          </span>
        </div>
      </footer>
    </div>
  );
}