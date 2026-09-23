import type { Recipe, RecipeListOptions, RecipesResponse } from '../types/recipe'

const BASE_URL = 'https://dummyjson.com'

export class ApiError extends Error {
  constructor(status: number) {
    super(`Recipes request failed (HTTP ${status})`)
    this.name = 'ApiError'
    this.status = status
  }

  readonly status: number
}

async function getJson<T>(url: URL, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal })

  if (!response.ok) {
    throw new ApiError(response.status)
  }

  return (await response.json()) as T
}

function listUrl(path: string, { limit = 12, skip = 0, sortBy, order }: RecipeListOptions): URL {
  const url = new URL(path, BASE_URL)
  url.searchParams.set('limit', String(limit))
  url.searchParams.set('skip', String(skip))
  if (sortBy) url.searchParams.set('sortBy', sortBy)
  if (order) url.searchParams.set('order', order)
  return url
}

export function getRecipes(
  options: RecipeListOptions = {},
  signal?: AbortSignal,
): Promise<RecipesResponse> {
  return getJson<RecipesResponse>(listUrl('/recipes', options), signal)
}

export function getRecipeById(id: number, signal?: AbortSignal): Promise<Recipe> {
  return getJson<Recipe>(new URL(`/recipes/${id}`, BASE_URL), signal)
}

export function searchRecipes(
  query: string,
  options: RecipeListOptions = {},
  signal?: AbortSignal,
): Promise<RecipesResponse> {
  const trimmedQuery = query.trim()

  if (!trimmedQuery) {
    return getRecipes(options, signal)
  }

  const url = listUrl('/recipes/search', options)
  url.searchParams.set('q', trimmedQuery)
  return getJson<RecipesResponse>(url, signal)
}

export function getRecipesByTag(
  tag: string,
  options: RecipeListOptions = {},
  signal?: AbortSignal,
): Promise<RecipesResponse> {
  return getJson<RecipesResponse>(
    listUrl(`/recipes/tag/${encodeURIComponent(tag)}`, options),
    signal,
  )
}

export function getRecipesByMealType(
  mealType: string,
  options: RecipeListOptions = {},
  signal?: AbortSignal,
): Promise<RecipesResponse> {
  return getJson<RecipesResponse>(
    listUrl(`/recipes/meal-type/${encodeURIComponent(mealType)}`, options),
    signal,
  )
}
