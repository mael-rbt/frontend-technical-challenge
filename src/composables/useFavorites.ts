import { readonly, ref } from 'vue'

const STORAGE_KEY = 'mise:favorites'
const favoriteIds = ref<number[]>([])
let initialized = false

function readFavoriteIds(): number[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed: unknown = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []
    return [
      ...new Set(
        parsed.filter(
          (id: unknown): id is number =>
            typeof id === 'number' && Number.isSafeInteger(id) && id > 0,
        ),
      ),
    ]
  } catch {
    return []
  }
}

function isFavorite(id: number): boolean {
  return favoriteIds.value.includes(id)
}

function toggleFavorite(id: number): void {
  if (!Number.isSafeInteger(id) || id < 1) return
  favoriteIds.value = isFavorite(id)
    ? favoriteIds.value.filter((favoriteId) => favoriteId !== id)
    : [...favoriteIds.value, id]

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favoriteIds.value))
  } catch {
    // Keep favorites usable for this session when browser storage is unavailable.
  }
}

export function useFavorites() {
  if (!initialized) {
    favoriteIds.value = readFavoriteIds()
    initialized = true
  }

  return { favoriteIds: readonly(favoriteIds), isFavorite, toggleFavorite }
}
