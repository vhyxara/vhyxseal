import Link from 'next/link'

export default function NotFound() {
  return (
    <main style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: '40px',
    }}>
      <p style={{
        fontSize: '72px', fontWeight: 800, color: 'var(--vhyxseal-color-full)',
        lineHeight: 1, marginBottom: '16px', fontFamily: 'monospace',
      }}>404</p>
      <h1 style={{
        fontSize: '1.5rem', fontWeight: 700, color: 'var(--docs-text)', marginBottom: '12px',
      }}>Page not found</h1>
      <p style={{
        fontSize: '1rem', color: 'var(--docs-text-muted)', marginBottom: '32px',
        maxWidth: '400px', lineHeight: 1.6,
      }}>The page you are looking for does not exist. It may have moved or the link may be incorrect.</p>
      <Link href="/" style={{
        padding: '10px 20px', backgroundColor: 'var(--vhyxseal-color-full)',
        color: 'white', borderRadius: '6px', fontWeight: 600, fontSize: '14px', textDecoration: 'none',
      }}>Back to docs</Link>
    </main>
  )
}
