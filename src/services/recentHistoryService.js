const KEY = 'loan_recent_history'
const MAX = 5

export function getRecentHistory() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}

export function addRecentHistory(inputs, results) {
  const prev = getRecentHistory()
  const entry = { id: Date.now(), timestamp: Date.now(), inputs, results }
  const updated = [entry, ...prev].slice(0, MAX)
  localStorage.setItem(KEY, JSON.stringify(updated))
  return updated
}

export function clearRecentHistory() {
  localStorage.removeItem(KEY)
  return []
}
