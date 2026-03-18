import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import MapView from '../components/MapView'

const API = 'http://localhost:8000'

export default function HomePage() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const token = localStorage.getItem('token')
  const authHeaders = { Authorization: `Bearer ${token}` }

  const [geoData, setGeoData] = useState(null)
  const [ipInput, setIpInput] = useState('')
  const [error, setError] = useState('')
  const [historyError, setHistoryError] = useState('')
  const [history, setHistory] = useState([])
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(false)

  const isValidIp = (ip) =>
    /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/.test(ip)

  const loadHistory = async () => {
    try {
      const res = await axios.get(`${API}/api/history`, { headers: authHeaders })
      setHistory(res.data)
      setHistoryError('')
    } catch (err) {
      const status = err?.response?.status
      if (status === 401) {
        setHistoryError('Session expired. Please log out and log back in.')
      } else {
        setHistoryError('Could not load history from server.')
      }
    }
  }

  const fetchGeo = async (ip = '') => {
    setLoading(true)
    setError('')
    try {
      const url = ip ? `https://ipinfo.io/${ip}/geo` : `https://ipinfo.io/geo`
      const res = await axios.get(url)
      setGeoData(res.data)

      if (ip) {
        try {
          await axios.post(
            `${API}/api/history`,
            { ip: res.data.ip, data: res.data },
            { headers: authHeaders },
          )
          await loadHistory()
        } catch (err) {
          const status = err?.response?.status
          if (status === 401) {
            setHistoryError('Session expired. Please log out and log back in.')
          } else {
            setHistoryError('History could not be saved to server.')
          }
        }
      }
    } catch {
      setError('Failed to fetch geo information.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGeo()
    loadHistory()
  }, [])

  const handleSearch = () => {
    if (!isValidIp(ipInput)) {
      setError('Please enter a valid IP address.')
      return
    }
    fetchGeo(ipInput)
  }

  const handleClear = () => {
    setIpInput('')
    setError('')
    fetchGeo()
  }

  const handleHistoryClick = (item) => {
    setGeoData(item.data)
    setIpInput(item.ip)
    setError('')
  }

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selected.length === history.length) {
      setSelected([])
    } else {
      setSelected(history.map((h) => h.id))
    }
  }

  const handleDeleteSelected = async () => {
    try {
      await axios.delete(`${API}/api/history`, {
        headers: authHeaders,
        data: { ids: selected },
      })
      setHistory((prev) => prev.filter((h) => !selected.includes(h.id)))
      setSelected([])
    } catch {
      setError('Failed to delete history.')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const getCoords = () => {
    if (!geoData?.loc) return null
    const [lat, lng] = geoData.loc.split(',').map(Number)
    return { lat, lng }
  }

  const formatDate = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
      ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  }

  const allSelected = history.length > 0 && selected.length === history.length

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.headerTitle}>IP Geo Lookup</h2>
        <div style={styles.headerRight}>
          <span style={styles.userEmail}>{user.email}</span>
          <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div style={styles.body}>
        {/* Left Panel */}
        <div style={styles.leftPanel}>

          {/* Search */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Search IP</h3>
            <div style={styles.searchRow}>
              <input
                style={styles.input}
                type="text"
                placeholder="e.g. 8.8.8.8"
                value={ipInput}
                onChange={(e) => setIpInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button style={styles.btnPrimary} onClick={handleSearch} disabled={loading}>
                {loading ? '...' : 'Search'}
              </button>
              <button style={styles.btnSecondary} onClick={handleClear} disabled={loading}>
                Clear
              </button>
            </div>
            {error && <p style={styles.error}>{error}</p>}
          </div>

          {/* Geo Info */}
          {geoData && !loading && (
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Geo Information</h3>
              <table style={styles.table}>
                <tbody>
                  {Object.entries(geoData)
                    .filter(([key]) => key !== 'readme')
                    .map(([key, val]) => (
                      <tr key={key} style={styles.tableRow}>
                        <td style={styles.tdKey}>{key}</td>
                        <td style={styles.tdVal}>{String(val)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {/* History */}
          <div style={styles.card}>
            <div style={styles.historyHeader}>
              <div style={styles.historyTitleRow}>
                <h3 style={styles.cardTitle}>Search History</h3>
                {history.length > 0 && (
                  <span style={styles.badge}>{history.length}</span>
                )}
              </div>
              {history.length > 0 && (
                <div style={styles.historyActions}>
                  <label style={styles.selectAllLabel}>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      style={styles.checkbox}
                    />
                    Select all
                  </label>
                  {selected.length > 0 && (
                    <button style={styles.btnDanger} onClick={handleDeleteSelected}>
                      Delete ({selected.length})
                    </button>
                  )}
                </div>
              )}
            </div>

            {historyError && (
              <p style={styles.historyErrorMsg}>{historyError}</p>
            )}

            {!historyError && history.length === 0 ? (
              <p style={styles.emptyHistory}>No searches yet. Enter an IP above to get started.</p>
            ) : !historyError && (
              <div style={styles.historyList}>
                {history.map((item) => {
                  const isActive = geoData?.ip === item.ip
                  const isChecked = selected.includes(item.id)
                  return (
                    <div
                      key={item.id}
                      style={{
                        ...styles.historyItem,
                        ...(isActive ? styles.historyItemActive : {}),
                        ...(isChecked ? styles.historyItemChecked : {}),
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelect(item.id)}
                        style={styles.checkbox}
                      />
                      <div
                        style={styles.historyContent}
                        onClick={() => handleHistoryClick(item)}
                      >
                        <div style={styles.historyIp}>{item.ip}</div>
                        <div style={styles.historyMeta}>
                          {item.data.city && item.data.country
                            ? `${item.data.city}, ${item.data.country}`
                            : item.data.country || 'Unknown location'}
                          {item.data.org && (
                            <span style={styles.historyOrg}> · {item.data.org}</span>
                          )}
                        </div>
                        {item.createdAt && (
                          <div style={styles.historyTime}>{formatDate(item.createdAt)}</div>
                        )}
                      </div>
                      {isActive && <span style={styles.activePill}>Viewing</span>}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Map */}
        <div style={styles.rightPanel}>
          {getCoords()
            ? <MapView coords={getCoords()} label={geoData?.city} />
            : (
              <div style={styles.mapPlaceholder}>
                <span style={styles.mapPlaceholderText}>Map will appear here after a search</span>
              </div>
            )
          }
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f0f2f5',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    backgroundColor: '#4f46e5',
    padding: '1rem 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  },
  headerTitle: { color: '#fff', margin: 0, fontSize: '1.2rem' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '1rem' },
  userEmail: { color: '#c7d2fe', fontSize: '0.9rem' },
  logoutBtn: {
    padding: '0.4rem 1rem',
    backgroundColor: '#fff',
    color: '#4f46e5',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 600,
  },
  body: { display: 'flex', gap: '1.5rem', padding: '1.5rem', flex: 1, alignItems: 'flex-start' },
  leftPanel: { flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 0 },
  rightPanel: { flex: 1, minHeight: '500px', borderRadius: '8px', overflow: 'hidden' },
  card: {
    backgroundColor: '#fff',
    padding: '1.25rem',
    borderRadius: '8px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  },
  cardTitle: { margin: '0 0 1rem 0', color: '#111', fontSize: '0.95rem', fontWeight: 700 },
  searchRow: { display: 'flex', gap: '0.5rem' },
  input: {
    flex: 1,
    padding: '0.6rem 0.75rem',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '0.95rem',
    outline: 'none',
  },
  btnPrimary: {
    padding: '0.6rem 1.1rem',
    backgroundColor: '#4f46e5',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.9rem',
  },
  btnSecondary: {
    padding: '0.6rem 1rem',
    backgroundColor: '#e5e7eb',
    color: '#374151',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  btnDanger: {
    padding: '0.35rem 0.85rem',
    backgroundColor: '#ef4444',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.82rem',
    fontWeight: 600,
  },
  error: { color: '#dc2626', fontSize: '0.85rem', marginTop: '0.6rem' },

  // Geo table
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' },
  tableRow: { borderBottom: '1px solid #f3f4f6' },
  tdKey: {
    padding: '0.4rem 0.5rem',
    fontWeight: 600,
    color: '#6b7280',
    width: '38%',
    textTransform: 'capitalize',
    verticalAlign: 'top',
  },
  tdVal: { padding: '0.4rem 0.5rem', color: '#111', wordBreak: 'break-all' },

  // History
  historyHeader: { marginBottom: '0.75rem' },
  historyTitleRow: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' },
  badge: {
    backgroundColor: '#4f46e5',
    color: '#fff',
    borderRadius: '999px',
    fontSize: '0.72rem',
    fontWeight: 700,
    padding: '0.1rem 0.55rem',
  },
  historyActions: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  selectAllLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.83rem',
    color: '#6b7280',
    cursor: 'pointer',
  },
  checkbox: { cursor: 'pointer', accentColor: '#4f46e5', width: '15px', height: '15px' },
  emptyHistory: { color: '#9ca3af', fontSize: '0.875rem', textAlign: 'center', padding: '1rem 0' },
  historyErrorMsg: { color: '#dc2626', fontSize: '0.82rem', padding: '0.5rem 0' },
  historyList: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  historyItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.65rem 0.75rem',
    borderRadius: '6px',
    border: '1px solid #f3f4f6',
    backgroundColor: '#fafafa',
    transition: 'background 0.15s',
    cursor: 'default',
  },
  historyItemActive: {
    border: '1px solid #c7d2fe',
    backgroundColor: '#eef2ff',
  },
  historyItemChecked: {
    border: '1px solid #fca5a5',
    backgroundColor: '#fff5f5',
  },
  historyContent: { flex: 1, cursor: 'pointer', minWidth: 0 },
  historyIp: { fontWeight: 700, fontSize: '0.9rem', color: '#4f46e5' },
  historyMeta: { fontSize: '0.8rem', color: '#374151', marginTop: '0.15rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  historyOrg: { color: '#9ca3af' },
  historyTime: { fontSize: '0.72rem', color: '#9ca3af', marginTop: '0.2rem' },
  activePill: {
    fontSize: '0.72rem',
    backgroundColor: '#4f46e5',
    color: '#fff',
    borderRadius: '999px',
    padding: '0.15rem 0.55rem',
    fontWeight: 600,
    flexShrink: 0,
  },

  // Map placeholder
  mapPlaceholder: {
    height: '100%',
    minHeight: '600px',
    backgroundColor: '#e5e7eb',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPlaceholderText: { color: '#9ca3af', fontSize: '0.9rem' },
}
