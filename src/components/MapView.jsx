import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect } from 'react'

// Fix leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function RecenterMap({ coords }) {
  const map = useMap()
  useEffect(() => {
    map.setView([coords.lat, coords.lng], 10)
  }, [coords, map])
  return null
}

export default function MapView({ coords, label }) {
  if (!coords) return null

  return (
    <MapContainer
      center={[coords.lat, coords.lng]}
      zoom={10}
      style={{ height: '100%', minHeight: '400px', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      <Marker position={[coords.lat, coords.lng]}>
        <Popup>{label || 'Location'}</Popup>
      </Marker>
      <RecenterMap coords={coords} />
    </MapContainer>
  )
}