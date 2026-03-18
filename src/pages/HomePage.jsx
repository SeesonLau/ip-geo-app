import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Sun, Moon, Globe } from 'lucide-react'
import MapView from '../components/MapView'

const API = import.meta.env.VITE_API_URL

// ─── Component ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const token = localStorage.getItem('token')
  const authHeaders = { Authorization: `Bearer ${token}` }

  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark')
  const [time, setTime] = useState('')
  const [geoData, setGeoData] = useState(null)
  const [ipInput, setIpInput] = useState('')
  const [error, setError] = useState('')
  const [historyError, setHistoryError] = useState('')
  const [history, setHistory] = useState([])
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(false)

  // Clock
  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const toggleTheme = () => {
    const next = !darkMode
    setDarkMode(next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', next)
  }

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
    setSelected(selected.length === history.length ? [] : history.map((h) => h.id))
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
      ' · ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  }

  const allSelected = history.length > 0 && selected.length === history.length
  const coords = getCoords()

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-900 transition-colors">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="bg-slate-900 dark:bg-slate-950 border-b border-slate-800 px-6 py-3 flex items-center justify-between shrink-0">

        {/* Left: theme toggle + clock */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 text-slate-200 text-xs font-medium transition-colors"
        >
          {darkMode ? <Sun size={15} /> : <Moon size={15} />}
          <span>{time}</span>
        </button>

        {/* Center: title */}
        <span className="text-slate-100 font-bold text-base tracking-tight">IP Geo JLabs Basic Assessment Exam</span>

        {/* Right: email + logout */}
        <div className="flex items-center gap-3">
          <span className="text-slate-400 text-sm hidden sm:block">{user.email}</span>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 text-slate-200 text-xs font-medium transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="flex gap-4 p-4 flex-1 items-stretch min-h-0">

        {/* ── Left Panel ───────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 flex-1 min-w-0">

          {/* Search Card */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
              Search IP Address
            </p>
            <div className="flex gap-2">
              <input
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
                type="text"
                placeholder="e.g. 8.8.8.8"
                value={ipInput}
                onChange={(e) => setIpInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button
                onClick={handleSearch}
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60"
              >
                {loading ? '…' : 'Search'}
              </button>
              <button
                onClick={handleClear}
                disabled={loading}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-sm rounded-lg transition-colors disabled:opacity-60"
              >
                Clear
              </button>
            </div>
            {error && (
              <p className="mt-2.5 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
          </div>

          {/* Geo Info Card */}
          {geoData && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
                Geo Information
              </p>
              {loading ? (
                <p className="text-sm text-slate-400 dark:text-slate-500">Loading…</p>
              ) : (
                <table className="w-full text-sm">
                  <tbody>
                    {Object.entries(geoData)
                      .filter(([key]) => key !== 'readme')
                      .map(([key, val], i) => (
                        <tr key={key} className={i % 2 === 1 ? 'bg-slate-50 dark:bg-slate-900/50' : ''}>
                          <td className="py-1.5 px-2 text-xs font-semibold text-slate-400 dark:text-slate-500 capitalize w-2/5">{key}</td>
                          <td className="py-1.5 px-2 text-slate-800 dark:text-slate-200 break-all">{String(val)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* History Card */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
            {/* History Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Search History
                </p>
                {history.length > 0 && (
                  <span className="bg-indigo-600 dark:bg-indigo-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {history.length}
                  </span>
                )}
              </div>
              {history.length > 0 && (
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      className="cursor-pointer accent-indigo-600"
                    />
                    All
                  </label>
                  {selected.length > 0 && (
                    <button
                      onClick={handleDeleteSelected}
                      className="px-2.5 py-1 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      Delete ({selected.length})
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* History error */}
            {historyError && (
              <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2 mb-3">
                {historyError}
              </p>
            )}

            {/* History list */}
            {!historyError && history.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-5">
                No searches yet. Enter an IP above to get started.
              </p>
            ) : !historyError && (
              <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto scrollbar-thin pr-1">
                {history.map((item) => {
                  const isActive = geoData?.ip === item.ip
                  const isChecked = selected.includes(item.id)
                  return (
                    <div
                      key={item.id}
                      className={[
                        'flex items-center gap-2.5 px-3 py-2.5 rounded-lg border transition-colors',
                        isActive
                          ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700'
                          : isChecked
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                          : 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600',
                      ].join(' ')}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelect(item.id)}
                        className="cursor-pointer accent-indigo-600 shrink-0"
                      />
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => handleHistoryClick(item)}
                      >
                        <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{item.ip}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {[item.data.city, item.data.region, item.data.country].filter(Boolean).join(', ')}
                          {item.data.org && <span className="text-slate-400 dark:text-slate-500"> · {item.data.org}</span>}
                        </div>
                        {item.createdAt && (
                          <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                            {formatDate(item.createdAt)}
                          </div>
                        )}
                      </div>
                      {isActive && (
                        <span className="text-xs bg-indigo-600 dark:bg-indigo-500 text-white px-2 py-0.5 rounded-full font-semibold shrink-0">
                          Viewing
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Right Panel (Map) ─────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 min-h-96">
            {coords ? (
              <MapView coords={coords} label={geoData?.city} />
            ) : (
              <div className="h-full min-h-96 bg-slate-200 dark:bg-slate-800 flex flex-col items-center justify-center gap-2">
                <Globe size={32} strokeWidth={1.5} />
                <p className="text-sm text-slate-400 dark:text-slate-500">Map will appear here after a search</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
