import { useState, useEffect, useRef } from 'react'
import { checkHealth, predictCSV, predictExplain, getFeatures } from './api'

// ── Styles object ─────────────────────────────────────────────────────────────
const s = {
  app: {
    minHeight: '100vh',
    background: '#0a0e14',
    fontFamily: "'IBM Plex Sans', sans-serif",
    color: '#c8d8e8',
  },
  header: {
    borderBottom: '1px solid #1e2d42',
    padding: '0 2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '56px',
    background: '#0d1520',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: '14px',
    fontWeight: '500',
    color: '#00d4ff',
    letterSpacing: '0.05em',
  },
  logoDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#00d4ff',
    animation: 'pulse 2s infinite',
  },
  statusBadge: (online) => ({
    fontSize: '11px',
    fontFamily: "'IBM Plex Mono', monospace",
    padding: '3px 10px',
    borderRadius: '20px',
    border: `1px solid ${online ? '#009966' : '#cc2244'}`,
    color: online ? '#00cc88' : '#ff4466',
    background: online ? 'rgba(0,204,136,0.08)' : 'rgba(255,68,102,0.08)',
  }),
  main: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '2rem',
  },
  hero: {
    marginBottom: '2rem',
    animation: 'fadeIn 0.5s ease',
  },
  heroTitle: {
    fontSize: '28px',
    fontWeight: '300',
    color: '#e8f4ff',
    marginBottom: '6px',
    letterSpacing: '-0.02em',
  },
  heroAccent: {
    color: '#00d4ff',
    fontWeight: '500',
  },
  heroSub: {
    fontSize: '13px',
    color: '#4a6a88',
    fontFamily: "'IBM Plex Mono', monospace",
  },
  tabs: {
    display: 'flex',
    gap: '4px',
    marginBottom: '1.5rem',
    background: '#111820',
    border: '1px solid #1e2d42',
    borderRadius: '10px',
    padding: '4px',
    width: 'fit-content',
  },
  tab: (active) => ({
    padding: '7px 18px',
    borderRadius: '7px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    fontFamily: "'IBM Plex Sans', sans-serif",
    fontWeight: active ? '500' : '400',
    background: active ? '#1a2d44' : 'transparent',
    color: active ? '#00d4ff' : '#4a6a88',
    transition: 'all 0.15s',
  }),
  card: {
    background: '#111820',
    border: '1px solid #1e2d42',
    borderRadius: '12px',
    padding: '1.5rem',
    marginBottom: '1rem',
    animation: 'fadeIn 0.3s ease',
  },
  cardLabel: {
    fontSize: '11px',
    fontFamily: "'IBM Plex Mono', monospace",
    color: '#4a6a88',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: '12px',
  },
  dropZone: (drag) => ({
    border: `2px dashed ${drag ? '#00d4ff' : '#1e2d42'}`,
    borderRadius: '10px',
    padding: '3rem 2rem',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
    background: drag ? 'rgba(0,212,255,0.04)' : 'transparent',
  }),
  dropIcon: {
    fontSize: '32px',
    marginBottom: '12px',
    color: '#2a3f5a',
  },
  dropText: {
    color: '#7a9ab8',
    fontSize: '14px',
    marginBottom: '4px',
  },
  dropSub: {
    color: '#4a6a88',
    fontSize: '12px',
    fontFamily: "'IBM Plex Mono', monospace",
  },
  fileInput: {
    display: 'none',
  },
  btn: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: '1px solid #00d4ff',
    background: 'rgba(0,212,255,0.08)',
    color: '#00d4ff',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    fontFamily: "'IBM Plex Sans', sans-serif",
    transition: 'all 0.15s',
    width: '100%',
    marginTop: '1rem',
  },
  inputGroup: {
    marginBottom: '12px',
  },
  label: {
    display: 'block',
    fontSize: '12px',
    fontFamily: "'IBM Plex Mono', monospace",
    color: '#7a9ab8',
    marginBottom: '5px',
  },
  input: {
    width: '100%',
    background: '#0d1520',
    border: '1px solid #1e2d42',
    borderRadius: '7px',
    padding: '9px 12px',
    color: '#c8d8e8',
    fontSize: '13px',
    fontFamily: "'IBM Plex Mono', monospace",
    outline: 'none',
    transition: 'border-color 0.15s',
  },
  select: {
    width: '100%',
    background: '#0d1520',
    border: '1px solid #1e2d42',
    borderRadius: '7px',
    padding: '9px 12px',
    color: '#c8d8e8',
    fontSize: '13px',
    fontFamily: "'IBM Plex Mono', monospace",
    outline: 'none',
    cursor: 'pointer',
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  grid3: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
    marginBottom: '1.5rem',
  },
  metricCard: (color) => ({
    background: '#0d1520',
    border: `1px solid ${color}22`,
    borderRadius: '10px',
    padding: '1rem',
    textAlign: 'center',
  }),
  metricVal: (color) => ({
    fontSize: '26px',
    fontWeight: '500',
    color: color,
    fontFamily: "'IBM Plex Mono', monospace",
  }),
  metricLabel: {
    fontSize: '11px',
    color: '#4a6a88',
    marginTop: '3px',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  resultBanner: (isAttack) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem 1.25rem',
    borderRadius: '10px',
    background: isAttack ? 'rgba(255,68,102,0.08)' : 'rgba(0,204,136,0.08)',
    border: `1px solid ${isAttack ? '#cc2244' : '#009966'}`,
    marginBottom: '1.5rem',
  }),
  resultLabel: (isAttack) => ({
    fontSize: '20px',
    fontWeight: '500',
    fontFamily: "'IBM Plex Mono', monospace",
    color: isAttack ? '#ff4466' : '#00cc88',
  }),
  resultProb: {
    fontSize: '13px',
    color: '#7a9ab8',
    fontFamily: "'IBM Plex Mono', monospace",
  },
  shapTitle: {
    fontSize: '12px',
    fontFamily: "'IBM Plex Mono', monospace",
    color: '#4a6a88',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: '12px',
  },
  shapRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '8px',
  },
  shapName: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: '12px',
    color: '#7a9ab8',
    minWidth: '200px',
    flexShrink: 0,
  },
  shapBarWrap: {
    flex: 1,
    background: '#0d1520',
    borderRadius: '3px',
    height: '6px',
    overflow: 'hidden',
  },
  shapVal: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: '11px',
    color: '#4a6a88',
    minWidth: '60px',
    textAlign: 'right',
  },
  tableWrap: {
    overflowX: 'auto',
    marginTop: '1rem',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '12px',
    fontFamily: "'IBM Plex Mono', monospace",
  },
  th: {
    padding: '8px 12px',
    textAlign: 'left',
    color: '#4a6a88',
    borderBottom: '1px solid #1e2d42',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontSize: '11px',
    fontWeight: '500',
  },
  td: {
    padding: '8px 12px',
    borderBottom: '1px solid #111820',
    color: '#c8d8e8',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: '#4a6a88',
    fontSize: '13px',
    fontFamily: "'IBM Plex Mono', monospace",
    padding: '1rem 0',
  },
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid #1e2d42',
    borderTop: '2px solid #00d4ff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  errorBox: {
    background: 'rgba(255,68,102,0.08)',
    border: '1px solid #cc2244',
    borderRadius: '8px',
    padding: '12px 16px',
    color: '#ff4466',
    fontSize: '13px',
    fontFamily: "'IBM Plex Mono', monospace",
    marginTop: '1rem',
  },
  hint: {
    fontSize: '12px',
    color: '#2a3f5a',
    fontFamily: "'IBM Plex Mono', monospace",
    marginTop: '8px',
    lineHeight: '1.5',
  },
}

// ── Spinner CSS injection ─────────────────────────────────────────────────────
const styleEl = document.createElement('style')
styleEl.textContent = `
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
  input:focus, select:focus { border-color: #00d4ff !important; }
  button:hover { opacity: 0.85; }
`
document.head.appendChild(styleEl)

// ── SHAP Bar component ────────────────────────────────────────────────────────
function ShapBar({ feature, shap_value, direction }) {
  const pct = Math.min(Math.abs(shap_value) * 600, 100)
  const color = direction === 'attack' ? '#ff4466' : '#00d4ff'
  return (
    <div style={s.shapRow}>
      <span style={s.shapName}>{feature}</span>
      <div style={s.shapBarWrap}>
        <div style={{ width: `${pct}%`, height: '6px', borderRadius: '3px', background: color, transition: 'width 0.4s ease' }} />
      </div>
      <span style={{ ...s.shapVal, color }}>{shap_value > 0 ? '+' : ''}{shap_value.toFixed(4)}</span>
    </div>
  )
}

// ── Upload Tab ────────────────────────────────────────────────────────────────
function UploadTab() {
  const [drag, setDrag] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const fileRef = useRef()

  const handleFile = async (file) => {
    if (!file) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const data = await predictCSV(file)
      setResult(data)
    } catch (e) {
      setError(e.response?.data?.detail || e.message || 'Something went wrong')
    }
    setLoading(false)
  }

  return (
    <div>
      <div style={s.card}>
        <div style={s.cardLabel}>Batch CSV prediction</div>
        <div
          style={s.dropZone(drag)}
          onClick={() => fileRef.current.click()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]) }}
        >
          <div style={s.dropIcon}>⬆</div>
          <div style={s.dropText}>Drop your CSV file here, or click to browse</div>
          <div style={s.dropSub}>Must have 41 NSL-KDD network traffic features</div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            style={s.fileInput}
            onChange={(e) => handleFile(e.target.files[0])}
          />
        </div>
        <p style={s.hint}>
          Tip: Export any rows from your Colab notebook with df.to_csv('test.csv', index=False) and upload here.
        </p>
      </div>

      {loading && (
        <div style={s.loading}>
          <div style={s.spinner} />
          Analysing traffic patterns...
        </div>
      )}

      {error && <div style={s.errorBox}>Error: {error}</div>}

      {result && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          <div style={s.grid3}>
            <div style={s.metricCard('#7a9ab8')}>
              <div style={s.metricVal('#c8d8e8')}>{result.total_rows}</div>
              <div style={s.metricLabel}>Total rows</div>
            </div>
            <div style={s.metricCard('#ff4466')}>
              <div style={s.metricVal('#ff4466')}>{result.attacks_detected}</div>
              <div style={s.metricLabel}>Attacks</div>
            </div>
            <div style={s.metricCard('#00cc88')}>
              <div style={s.metricVal('#00cc88')}>{result.normal_traffic}</div>
              <div style={s.metricLabel}>Normal</div>
            </div>
          </div>

          <div style={s.card}>
            <div style={s.cardLabel}>Row-by-row results (first 50)</div>
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Row</th>
                    <th style={s.th}>Prediction</th>
                    <th style={s.th}>Attack probability</th>
                  </tr>
                </thead>
                <tbody>
                  {result.predictions.slice(0, 50).map((row) => (
                    <tr key={row.row}>
                      <td style={s.td}>{row.row}</td>
                      <td style={{ ...s.td, color: row.label === 'ATTACK' ? '#ff4466' : '#00cc88' }}>
                        {row.label}
                      </td>
                      <td style={s.td}>{(row.attack_probability * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Explain Tab ───────────────────────────────────────────────────────────────
function ExplainTab() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [features, setFeatures] = useState({
    src_bytes: '',
    dst_bytes: '',
    duration: '',
    protocol_type: '',
    flag: '',
    logged_in: '',
    count: '',
    srv_count: '',
    serror_rate: '',
    dst_host_count: '',
  })

  const handleChange = (key, val) => {
    setFeatures(prev => ({ ...prev, [key]: val }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const numFeatures = {}
      for (const [k, v] of Object.entries(features)) {
        numFeatures[k] = v === '' ? 0 : Number(v)
      }
      const data = await predictExplain(numFeatures)
      setResult(data)
    } catch (e) {
      setError(e.response?.data?.detail || e.message || 'Something went wrong')
    }
    setLoading(false)
  }

  const fieldGroups = [
    {
      title: 'Traffic volume',
      fields: [
        { key: 'src_bytes', label: 'src_bytes', placeholder: 'e.g. 491 (normal) or 50000 (attack)' },
        { key: 'dst_bytes', label: 'dst_bytes', placeholder: 'e.g. 5134' },
        { key: 'duration', label: 'duration (seconds)', placeholder: 'e.g. 0' },
      ]
    },
    {
      title: 'Connection info',
      fields: [
        { key: 'protocol_type', label: 'protocol_type (0=icmp, 1=tcp, 2=udp)', placeholder: 'e.g. 1' },
        { key: 'flag', label: 'flag (0=SF normal, others=error)', placeholder: 'e.g. 0' },
        { key: 'logged_in', label: 'logged_in (1=yes, 0=no)', placeholder: 'e.g. 1' },
      ]
    },
    {
      title: 'Traffic rates',
      fields: [
        { key: 'count', label: 'count (connections to same host)', placeholder: 'e.g. 2' },
        { key: 'srv_count', label: 'srv_count (to same service)', placeholder: 'e.g. 2' },
        { key: 'serror_rate', label: 'serror_rate (0.0 – 1.0)', placeholder: 'e.g. 0.0' },
        { key: 'dst_host_count', label: 'dst_host_count (0–255)', placeholder: 'e.g. 150' },
      ]
    },
  ]

  return (
    <div>
      <div style={s.card}>
        <div style={s.cardLabel}>Enter network features</div>
        <p style={{ fontSize: '13px', color: '#4a6a88', marginBottom: '1.2rem' }}>
          Fill in known feature values. All others default to 0. Try src_bytes = 50000 for a likely attack.
        </p>

        {fieldGroups.map(group => (
          <div key={group.title} style={{ marginBottom: '1.2rem' }}>
            <div style={{ fontSize: '11px', color: '#2a3f5a', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', fontFamily: "'IBM Plex Mono', monospace" }}>
              {group.title}
            </div>
            <div style={s.grid2}>
              {group.fields.map(f => (
                <div key={f.key} style={s.inputGroup}>
                  <label style={s.label}>{f.label}</label>
                  <input
                    style={s.input}
                    type="number"
                    placeholder={f.placeholder}
                    value={features[f.key]}
                    onChange={e => handleChange(f.key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        <button style={s.btn} onClick={handleSubmit}>
          Predict & explain →
        </button>
      </div>

      {loading && (
        <div style={s.loading}>
          <div style={s.spinner} />
          Running model + SHAP analysis...
        </div>
      )}

      {error && <div style={s.errorBox}>Error: {error}</div>}

      {result && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          <div style={s.resultBanner(result.label === 'ATTACK')}>
            <div>
              <div style={s.resultLabel(result.label === 'ATTACK')}>{result.label}</div>
              <div style={{ fontSize: '12px', color: '#4a6a88', marginTop: '2px' }}>
                Classification result
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '22px', fontWeight: '500', fontFamily: "'IBM Plex Mono', monospace", color: result.label === 'ATTACK' ? '#ff4466' : '#00cc88' }}>
                {(result.attack_probability * 100).toFixed(1)}%
              </div>
              <div style={{ fontSize: '11px', color: '#4a6a88' }}>attack probability</div>
            </div>
          </div>

          <div style={s.card}>
            <div style={s.shapTitle}>SHAP feature importance — why this prediction was made</div>
            <div style={{ fontSize: '12px', color: '#2a3f5a', marginBottom: '14px', fontFamily: "'IBM Plex Mono', monospace" }}>
              Red bars → pushed toward ATTACK &nbsp;|&nbsp; Blue bars → pushed toward NORMAL
            </div>
            {result.top_features.map((f) => (
              <ShapBar key={f.feature} {...f} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState('explain')
  const [online, setOnline] = useState(null)

  useEffect(() => {
    checkHealth()
      .then(() => setOnline(true))
      .catch(() => setOnline(false))
  }, [])

  return (
    <div style={s.app}>
      {/* Header */}
      <header style={s.header}>
        <div style={s.logo}>
          <div style={s.logoDot} />
          SMART-GRID IDS
        </div>
        <div style={s.statusBadge(online)}>
          {online === null ? 'connecting...' : online ? 'API online' : 'API offline — start backend first'}
        </div>
      </header>

      <main style={s.main}>
        {/* Hero */}
        <div style={s.hero}>
          <h1 style={s.heroTitle}>
            Intrusion <span style={s.heroAccent}>Detection</span> System
          </h1>
          <div style={s.heroSub}>
            Random Forest · NSL-KDD · SHAP explainability · F1 = 0.9990
          </div>
        </div>

        {/* Tabs */}
        <div style={s.tabs}>
          {[
            { id: 'explain', label: 'Single prediction' },
            { id: 'upload', label: 'Batch CSV upload' },
          ].map(t => (
            <button key={t.id} style={s.tab(tab === t.id)} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Offline warning */}
        {online === false && (
          <div style={s.errorBox}>
            Backend is offline. Run: cd backend && uvicorn main:app --reload
          </div>
        )}

        {/* Tab content */}
        {tab === 'explain' && <ExplainTab />}
        {tab === 'upload' && <UploadTab />}
      </main>
    </div>
  )
}
