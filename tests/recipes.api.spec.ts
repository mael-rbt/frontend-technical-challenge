import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getRecipeById,
  getRecipes,
  getRecipesByMealType,
  getRecipesByTag,
  searchRecipes,
} from '../src/services/recipes.api'
import type { Recipe, RecipesResponse } from '../src/types/recipe'

const recipe: Recipe = {
  id: 1,
  name: 'Classic Margherita Pizza',
  ingredients: ['Pizza dough', 'Tomato sauce'],
  instructions: ['Bake the pizza.'],
  prepTimeMinutes: 20,
  cookTimeMinutes: 15,
  servings: 4,
  difficulty: 'Easy',
  cuisine: 'Italian',
  caloriesPerServing: 300,
  tags: ['Pizza', 'Italian'],
  userId: 166,
  image: 'https://cdn.dummyjson.com/recipe-images/1.webp',
  rating: 4.6,
  reviewCount: 98,
  mealType: ['Dinner'],
}

const recipesResponse: RecipesResponse = {
  recipes: [recipe],
  total: 50,
  skip: 0,
  limit: 12,
}

function mockFetch(body: unknown, status = 200) {
  const fetchMock = vi
    .fn<typeof fetch>()
    .mockImplementation(async () => new Response(JSON.stringify(body), { status }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => vi.unstubAllGlobals())

describe('recipes API', () => {
  it('gets a paginated list with a modest default limit', async () => {
    const fetchMock = mockFetch(recipesResponse)

    await expect(getRecipes()).resolves.toEqual(recipesResponse)
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      'https://dummyjson.com/recipes?limit=12&skip=0',
    )
  })

  it('sends explicit pagination parameters', async () => {
    const fetchMock = mockFetch({ ...recipesResponse, skip: 24 })

    await getRecipes({ limit: 24, skip: 24 })

    const url = new URL(String(fetchMock.mock.calls[0]?.[0]))
    expect(url.searchParams.get('limit')).toBe('24')
    expect(url.searchParams.get('skip')).toBe('24')
  })

  it('gets a recipe by ID', async () => {
    const fetchMock = mockFetch(recipe)

    await expect(getRecipeById(1)).resolves.toEqual(recipe)
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe('https://dummyjson.com/recipes/1')
  })

  it('exposes HTTP status so a detail view can recognize a missing recipe', async () => {
    mockFetch({ message: "Recipe with id '999999' not found" }, 404)

    await expect(getRecipeById(999999)).rejects.toMatchObject({
      name: 'ApiError',
      status: 404,
      message: 'Recipes request failed (HTTP 404)',
    })
  })

  it('trims and encodes search text, and forwards pagination and cancellation', async () => {
    const fetchMock = mockFetch(recipesResponse)
    const controller = new AbortController()

    await searchRecipes('  pizza & pasta  ', { limit: 5, skip: 10 }, controller.signal)

    const url = new URL(String(fetchMock.mock.calls[0]?.[0]))
    expect(url.pathname).toBe('/recipes/search')
    expect(url.searchParams.get('q')).toBe('pizza & pasta')
    expect(url.searchParams.get('limit')).toBe('5')
    expect(url.searchParams.get('skip')).toBe('10')
    expect(fetchMock.mock.calls[0]?.[1]?.signal).toBe(controller.signal)
  })

  it('uses the regular list for a blank search', async () => {
    const fetchMock = mockFetch(recipesResponse)

    await expect(searchRecipes('  ')).resolves.toEqual(recipesResponse)
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      'https://dummyjson.com/recipes?limit=12&skip=0',
    )
  })

  it('uses real tag and meal endpoints with sorting and pagination', async () => {
    const fetchMock = mockFetch(recipesResponse)
    const options = { limit: 12, skip: 12, sortBy: 'name' as const, order: 'asc' as const }

    await getRecipesByTag('Quick', options)
    await getRecipesByMealType('Breakfast', options)

    const tagUrl = new URL(String(fetchMock.mock.calls[0]?.[0]))
    const mealUrl = new URL(String(fetchMock.mock.calls[1]?.[0]))
    expect(tagUrl.pathname).toBe('/recipes/tag/Quick')
    expect(mealUrl.pathname).toBe('/recipes/meal-type/Breakfast')
    for (const url of [tagUrl, mealUrl]) {
      expect(url.searchParams.get('limit')).toBe('12')
      expect(url.searchParams.get('skip')).toBe('12')
      expect(url.searchParams.get('sortBy')).toBe('name')
      expect(url.searchParams.get('order')).toBe('asc')
    }
  })
})
