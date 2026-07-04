import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import { Card, CardContent } from '@/components/ui/card'
import 'leaflet/dist/leaflet.css'

const statusColors = {
  AVAILABLE: '#2dc653',
  RESERVED: '#f4a261',
  IN_USE: '#4895ef',
  ERROR: '#e63946',
  UNREGISTERED: '#8ba0b4',
}

function Stats({ bikes }) {
  const values = Object.values(bikes)
  const total = values.length
  const available = values.filter(b => b.status === 'AVAILABLE').length
  const inUse = values.filter(b => b.status === 'IN_USE').length
  const error = values.filter(b => b.status === 'ERROR').length

  return (
    <div className="grid grid-cols-4 gap-3 p-4">
      {[
        { label: 'Total', value: total, color: 'text-primary' },
        { label: 'Disponíveis', value: available, color: 'text-green-400' },
        { label: 'Em uso', value: inUse, color: 'text-blue-400' },
        { label: 'Com erro', value: error, color: 'text-red-400' },
      ].map(s => (
        <Card key={s.label}>
          <CardContent className="p-4">
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function MapPage({ bikes }) {
  const bikesWithLocation = Object.values(bikes).filter(
    b => b.latitude != null && b.longitude != null,
  )

  return (
    <div className="flex flex-col h-full">
      <Stats bikes={bikes} />
      <div className="flex-1 px-4 pb-4">
        <MapContainer
          center={[-9.6658, -35.7350]}
          zoom={14}
          className="w-full h-full rounded-xl"
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution="© OpenStreetMap © CARTO"
          />
          {bikesWithLocation.map(bike => (
            <CircleMarker
              key={bike.id}
              center={[bike.latitude, bike.longitude]}
              radius={10}
              pathOptions={{
                fillColor: statusColors[bike.status] || '#8ba0b4',
                fillOpacity: 1,
                color: '#fff',
                weight: 2,
              }}
            >
              <Popup>
                <b>{bike.id}</b><br />
                Status: {bike.status}<br />
                {bike.speedMetersPerSecond != null && (
                  <>Velocidade: {(Number(bike.speedMetersPerSecond) * 3.6).toFixed(1)} km/h</>
                )}
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </div>
  )
}
