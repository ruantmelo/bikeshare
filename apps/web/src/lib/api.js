const API = 'http://localhost:3000'

function getToken() {
  return localStorage.getItem('token')
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  }
}

export async function login(email, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error)
  return data
}

export async function fetchBikes() {
  const res = await fetch(`${API}/bikes/admin`, { headers: authHeaders() })
  if (res.status === 401) { localStorage.clear(); window.location.href = '/'; return [] }
  return res.json()
}

export async function addBike(id) {
  const res = await fetch(`${API}/bikes`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ id }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error)
  return data
}

export async function deleteBike(id) {
  const res = await fetch(`${API}/bikes/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error)
  }
}

export function connectWebSocket(onMessage) {
  const ws = new WebSocket('ws://localhost:3000/ws')
  ws.onmessage = (e) => onMessage(JSON.parse(e.data))
  return ws
}
