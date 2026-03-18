import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import MapView from '../components/MapView'

export default function HomePage() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const [geoData, setGeoData] = useState(null)
  const [ipInput, setIpInput] = useState('')
  const [error, setError] = useState('')
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('searchHistory')) || []
    } catch {
      return []
    }
  })
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(false)

  const isValidIp = (ip) =>
    /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/.test(ip)

  const fetchGeo = async (ip = '') => {
    setLoading(true)
    setError('')
    try {
      const url = ip
        ? `https://ipinfo.io/${ip}/geo`
        : `https://ipinfo.io/geo`
      const res = await axios.get(url)
      setGeoData(res.data)
      if (ip) {
        setHistory((prev) => {
          const exists = prev.find((h) => h.ip === res.data.ip)
          if (exists) return prev
          return [{ ip: res.data.ip, data: res.data }, ...prev]
        })
      }
    } catch {
      setError('Failed to fetch geo information.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGeo()
  }, [])

  useEffect(() => {
    localStorage.setItem('searchHistory', JSON.stringify(history))
  }, [history])

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
  }

  const toggleSelect = (ip) => {
    setSelected((prev) =>
      prev.includes(ip) ? prev.filter((i) => i !== ip) : [...prev, ip]
    )
  }

  const handleDeleteSelected = () => {
    setHistory((prev) => prev.filter((h) => !selected.includes(h.ip)))
    setSelected([])
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('searchHistory')
    navigate('/login')
  }

  const getCoords = () => {
    if (!geoData?.loc) return null
    const [lat, lng] = geoData.loc.split(',').map(Number)
    return { lat, lng }
  }

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
                placeholder="Enter IP address"
                value={ipInput}
                onChange={(e) => setIpInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button style={styles.btnPrimary} onClick={handleSearch}>Search</button>
              <button style={styles.btnSecondary} onClick={handleClear}>Clear</button>
            </div>
            {error && <p style={styles.error}>{error}</p>}
          </div>

          {/* Geo Info */}
          {geoData && (
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Geo Information</h3>
              {loading ? <p>Loading...</p> : (
                <table style={styles.table}>
                  <tbody>
                    {Object.entries(geoData)
                        .filter(([key]) => !['readme'].includes(key))
                        .map(([key, val]) => (
                            <tr key={key}>
                            <td style={styles.tdKey}>{key}</td>
                            <td style={styles.tdVal}>{val}</td>
                            </tr>
                        ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div style={styles.card}>
              <div style={styles.historyHeader}>
                <h3 style={styles.cardTitle}>Search History</h3>
                {selected.length > 0 && (
                  <button style={styles.btnDanger} onClick={handleDeleteSelected}>
                    Delete ({selected.length})
                  </button>
                )}
              </div>
              {history.map((item) => (
                <div key={item.ip} style={styles.historyItem}>
                  <input
                    type="checkbox"
                    checked={selected.includes(item.ip)}
                    onChange={() => toggleSelect(item.ip)}
                  />
                  <span
                    style={styles.historyIp}
                    onClick={() => handleHistoryClick(item)}
                  >
                    {item.ip} — {item.data.city}, {item.data.country}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Map */}
        <div style={styles.rightPanel}>
          {getCoords() && <MapView coords={getCoords()} label={geoData?.city} />}
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', backgroundColor: '#f0f2f5', display: 'flex', flexDirection: 'column' },
  header: { backgroundColor: '#4f46e5', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: '#fff', margin: 0 },
  headerRight: { display: 'flex', alignItems: 'center', gap: '1rem' },
  userEmail: { color: '#c7d2fe', fontSize: '0.9rem' },
  logoutBtn: { padding: '0.4rem 1rem', backgroundColor: '#fff', color: '#4f46e5', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  body: { display: 'flex', gap: '1.5rem', padding: '1.5rem', flex: 1 },
  leftPanel: { flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' },
  rightPanel: { flex: 1, minHeight: '400px', borderRadius: '8px', overflow: 'hidden' },
  card: { backgroundColor: '#fff', padding: '1.25rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  cardTitle: { margin: '0 0 1rem 0', color: '#333', fontSize: '1rem', fontWeight: 600 },
  searchRow: { display: 'flex', gap: '0.5rem' },
  input: { flex: 1, padding: '0.6rem', borderRadius: '4px', border: '1px solid #ccc', fontSize: '0.95rem' },
  btnPrimary: { padding: '0.6rem 1rem', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  btnSecondary: { padding: '0.6rem 1rem', backgroundColor: '#e5e7eb', color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  btnDanger: { padding: '0.4rem 0.75rem', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' },
  error: { color: 'red', fontSize: '0.875rem', marginTop: '0.5rem' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' },
  tdKey: { padding: '0.35rem 0.5rem', fontWeight: 600, color: '#555', width: '40%', textTransform: 'capitalize' },
  tdVal: { padding: '0.35rem 0.5rem', color: '#333' },
  historyHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' },
  historyItem: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0', borderBottom: '1px solid #f0f0f0' },
  historyIp: { cursor: 'pointer', color: '#4f46e5', fontSize: '0.9rem' },
}
