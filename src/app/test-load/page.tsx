export default function TestLoadPage() {
  return (
    <div style={{ padding: '20px', color: 'black', backgroundColor: 'white' }}>
      <h1>🟢 LOAD TEST SUCCESS</h1>
      <p>If you see this page, Next.js is working and pages can load.</p>
      <p>Time: {new Date().toLocaleString()}</p>
      <a href="/" style={{ color: 'blue', textDecoration: 'underline' }}>
        ← Back to Homepage
      </a>
    </div>
  )
}