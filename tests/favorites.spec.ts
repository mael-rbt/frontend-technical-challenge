import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

beforeEach(() => {
  localStorage.clear()
  vi.resetModules()
})

afterEach(() => vi.restoreAllMocks())

describe('useFavorites', () => {
  it('starts empty when storage has no favorites', async () => {
    const { useFavorites } = await import('../src/composables/useFavorites')
    const { favoriteIds, isFavorite } = useFavorites()
    expect(favoriteIds.value).toEqual([])
    expect(isFavorite(1)).toBe(false)
  })

  it('restores valid IDs in their saved order', async () => {
    localStorage.setItem('mise:favorites', JSON.stringify([5, 1, 5, -2, '3']))
    const { useFavorites } = await import('../src/composables/useFavorites')
    expect(useFavorites().favoriteIds.value).toEqual([5, 1])
  })

  it('adds and removes a favorite, persisting each change', async () => {
    const { useFavorites } = await import('../src/composables/useFavorites')
    const first = useFavorites()
    const second = useFavorites()

    first.toggleFavorite(3)
    expect(second.isFavorite(3)).toBe(true)
    expect(localStorage.getItem('mise:favorites')).toBe('[3]')

    second.toggleFavorite(3)
    expect(first.favoriteIds.value).toEqual([])
    expect(localStorage.getItem('mise:favorites')).toBe('[]')
  })

  it('ignores corrupted storage', async () => {
    localStorage.setItem('mise:favorites', '{broken')
    const { useFavorites } = await import('../src/composables/useFavorites')
    expect(useFavorites().favoriteIds.value).toEqual([])
  })

  it('keeps the session usable when browser storage is unavailable', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Storage unavailable')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage unavailable')
    })
    const { useFavorites } = await import('../src/composables/useFavorites')
    const favorites = useFavorites()
    favorites.toggleFavorite(3)
    expect(favorites.isFavorite(3)).toBe(true)
  })
})
