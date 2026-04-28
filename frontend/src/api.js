const BASE = import.meta.env.VITE_API_URL || ''

async function get(url) {
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export const fetchBrMeses = () => get(`${BASE}/api/br/meses`)

export const fetchBrHistorico = () => get(`${BASE}/api/br/historico`)

export function fetchBr(mes, filters = {}) {
  const params = new URLSearchParams({ mes })
  Object.entries(filters).forEach(([k, v]) => v && params.set(k, v))
  return get(`${BASE}/api/br?${params}`)
}

export const fetchIntMeses = () => get(`${BASE}/api/int/meses`)

export const fetchIntHistorico = () => get(`${BASE}/api/int/historico`)

export function fetchInt(mes, filters = {}) {
  const params = new URLSearchParams({ mes })
  Object.entries(filters).forEach(([k, v]) => v && params.set(k, v))
  return get(`${BASE}/api/int?${params}`)
}
