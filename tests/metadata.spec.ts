import { beforeEach, describe, expect, it } from 'vitest'
import { setPageMetadata, setRecipeStructuredData } from '../src/metadata'
import type { Recipe } from '../src/types/recipe'

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
  userId: 45,
  image: 'https://cdn.dummyjson.com/recipe-images/1.webp',
  rating: 4.6,
  reviewCount: 3,
  mealType: ['Dinner'],
}

beforeEach(() => {
  document.head.innerHTML = `
    <meta name="description">
    <meta name="robots" content="index,follow">
    <meta property="og:title">
    <meta property="og:description">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title">
    <meta name="twitter:description">
    <link rel="canonical">
  `
})

describe('page metadata', () => {
  it('updates the title, description, canonical, and social metadata', () => {
    setPageMetadata('Explore | Mise', 'Discover recipes worth cooking.')

    expect(document.title).toBe('Explore | Mise')
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(
      'Discover recipes worth cooking.',
    )
    expect(document.querySelector('meta[property="og:title"]')?.getAttribute('content')).toBe(
      'Explore | Mise',
    )
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      window.location.origin + window.location.pathname,
    )
  })

  it('keeps one Recipe script and removes image metadata outside the detail page', () => {
    setPageMetadata('Classic Margherita Pizza | Mise', 'Ingredients and instructions.', recipe.image)
    setRecipeStructuredData(recipe)

    const data = JSON.parse(
      document.querySelector<HTMLScriptElement>('#recipe-structured-data')?.textContent ?? '{}',
    ) as Record<string, unknown>
    expect(data['@type']).toBe('Recipe')
    expect(data.name).toBe(recipe.name)
    expect(data.recipeIngredient).toEqual(recipe.ingredients)
    expect(data.recipeInstructions).toEqual(recipe.instructions)
    expect(data).not.toHaveProperty('author')
    expect(data).not.toHaveProperty('review')
    expect(document.querySelector('meta[property="og:image"]')?.getAttribute('content')).toBe(
      recipe.image,
    )

    setRecipeStructuredData({ ...recipe, id: 2, name: 'Another recipe' })
    expect(document.querySelectorAll('#recipe-structured-data')).toHaveLength(1)
    setRecipeStructuredData({ ...recipe, reviewCount: 0 })
    const unrated = JSON.parse(
      document.querySelector<HTMLScriptElement>('#recipe-structured-data')?.textContent ?? '{}',
    ) as Record<string, unknown>
    expect(unrated).not.toHaveProperty('aggregateRating')
    setRecipeStructuredData(null)
    setPageMetadata('Saved recipes | Mise', 'Saved recipes.')
    expect(document.querySelector('#recipe-structured-data')).toBeNull()
    expect(document.querySelector('meta[property="og:image"]')).toBeNull()
  })
})
