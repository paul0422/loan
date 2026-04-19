const STORAGE_KEY = 'loan-calculator-favorites'

export function getFavorites() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (e) {
    console.error('Failed to load favorites:', e)
    return []
  }
}

export function saveFavorites(favorites) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites))
  } catch (e) {
    console.error('Failed to save favorites:', e)
  }
}

export function addFavorite(name, inputs, results) {
  const favorites = getFavorites()
  const newFavorite = {
    id: Date.now().toString(),
    name,
    createdAt: Date.now(),
    inputs,
    results,
  }
  favorites.unshift(newFavorite)
  saveFavorites(favorites)
  return newFavorite
}

export function removeFavorite(id) {
  const favorites = getFavorites()
  const filtered = favorites.filter(f => f.id !== id)
  saveFavorites(filtered)
}

export function updateFavorite(id, name) {
  const favorites = getFavorites()
  const updated = favorites.map(f =>
    f.id === id ? { ...f, name } : f
  )
  saveFavorites(updated)
}
