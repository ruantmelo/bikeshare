import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { fetchBikes, connectWebSocket } from '@/lib/api'
import { Layout } from '@/components/Layout'
import { Login } from '@/pages/Login'
import { MapPage } from '@/pages/MapPage'
import { BikesPage } from '@/pages/BikesPage'

function ProtectedApp() {
  const [bikes, setBikes] = useState({})
  const [wsConnected, setWsConnected] = useState(false)

  useEffect(() => {
    fetchBikes().then(list => {
      const map = {}
      for (const b of list) map[b.id] = b
      setBikes(map)
    })
  }, [])

  useEffect(() => {
    let ws

    function connect() {
      ws = connectWebSocket((msg) => {
        if (msg.type === 'telemetry') {
          setBikes(prev => ({
            ...prev,
            [msg.bikeId]: {
              ...prev[msg.bikeId],
              id: msg.bikeId,
              lat: msg.lat,
              lng: msg.lng,
              speed: msg.speed,
              updatedAt: new Date().toISOString(),
            },
          }))
        }
        if (msg.type === 'event') {
          setBikes(prev => ({
            ...prev,
            [msg.bikeId]: {
              ...prev[msg.bikeId],
              id: msg.bikeId,
              status: msg.status,
              updatedAt: new Date().toISOString(),
            },
          }))
        }
      })

      ws.onopen = () => setWsConnected(true)
      ws.onclose = () => { setWsConnected(false); setTimeout(connect, 3000) }
    }

    connect()
    return () => ws?.close()
  }, [])

  function handleBikeAdded(bike) {
    setBikes(prev => ({ ...prev, [bike.id]: bike }))
  }

  function handleBikeDeleted(id) {
    setBikes(prev => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  return (
    <Layout wsConnected={wsConnected}>
      <Routes>
        <Route path="/map" element={<MapPage bikes={bikes} />} />
        <Route path="/bikes" element={<BikesPage bikes={bikes} onBikeAdded={handleBikeAdded} onBikeDeleted={handleBikeDeleted} />} />
        <Route path="*" element={<Navigate to="/map" />} />
      </Routes>
    </Layout>
  )
}

function isLoggedIn() {
  return !!localStorage.getItem('token')
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={isLoggedIn() ? <Navigate to="/map" /> : <Login />} />
        <Route path="/*" element={isLoggedIn() ? <ProtectedApp /> : <Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}
