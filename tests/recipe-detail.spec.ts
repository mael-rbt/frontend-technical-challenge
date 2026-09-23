import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import RecipeDetailView from '../src/views/RecipeDetailView.vue'
import RecipeCard from '../src/components/RecipeCard.vue'
import { useFavorites } from '../src/composables/useFavorites'
import {
  ApiError,
  getRecipeById,
  getRecipesByMealType,
  getRecipesByTag,
} from '../src/services/recipes.api'
import type { Recipe, RecipesResponse } from '../src/types/recipe'

vi.mock('../src/services/recipes.api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/services/recipes.api')>()),
  getRecipeById: vi.fn(),
  getRecipesByMealType: vi.fn(),
  getRecipesByTag: vi.fn(),
}))

const detailMock = vi.mocked(getRecipeById)
const tagMock = vi.mocked(getRecipesByTag)
const mealMock = vi.mocked(getRecipesByMealType)

const pizza: Recipe = {
  id: 1,
  name: 'Classic Margherita Pizza',
  ingredients: ['Pizza dough', 'Tomato sauce', 'Fresh mozzarella cheese'],
  instructions: ['Prepare the dough.', 'Bake the pizza.'],
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
const second: Recipe = {
  ...pizza,
  id: 2,
  name: 'Vegetarian Stir-Fry',
  cuisine: 'Asian',
  tags: ['Vegetarian', 'Asian'],
}
const third: Recipe = { ...pizza, id: 3, name: 'Italian Tiramisu' }
const fourth: Recipe = { ...pizza, id: 4, name: 'Tomato Basil Bruschetta' }
const fifth: Recipe = { ...pizza, id: 5, name: 'Caprese Salad' }
const relatedPage: RecipesResponse = {
  recipes: [pizza, second, third, fourth, fifth],
  total: 5,
  skip: 0,
  limit: 4,
}

beforeEach(() => {
  vi.resetAllMocks()
  detailMock.mockImplementation(async (id) => (id === 1 ? pizza : second))
  tagMock.mockResolvedValue(relatedPage)
  mealMock.mockResolvedValue(relatedPage)
})

async function mountDetail(id = '1') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/recipes/:id', component: RecipeDetailView },
    ],
  })
  await router.push(`/recipes/${id}`)
  await router.isReady()
  const wrapper = mount(RecipeDetailView, { global: { plugins: [router] } })
  return { wrapper, router }
}

describe('RecipeDetailView', () => {
  it('uses the shared favorite state for the Save recipe button', async () => {
    const favorites = useFavorites()
    if (favorites.isFavorite(pizza.id)) favorites.toggleFavorite(pizza.id)
    const { wrapper } = await mountDetail()
    await flushPromises()
    const button = wrapper.get('.detail-hero__save')
    expect(button.text()).toBe('Save recipe')
    await button.trigger('click')
    expect(button.text()).toBe('Saved')
    expect(button.attributes('aria-pressed')).toBe('true')
    expect(favorites.isFavorite(pizza.id)).toBe(true)
    favorites.toggleFavorite(pizza.id)
    wrapper.unmount()
  })

  it('loads a route ID and shows real fields and up to three other recipes', async () => {
    const { wrapper } = await mountDetail()
    await flushPromises()

    expect(detailMock).toHaveBeenCalledWith(1, expect.any(AbortSignal))
    expect(wrapper.get('h1').text()).toBe(pizza.name)
    expect(wrapper.text()).toContain('20 min')
    expect(wrapper.text()).toContain('15 min')
    expect(wrapper.text()).toContain('300 kcal')
    expect(wrapper.get('.detail-hero__image img').attributes('alt')).toContain(pizza.name)
    expect(wrapper.findAll('.detail-ingredients input')).toHaveLength(3)
    expect(wrapper.findAll('.detail-instructions li')).toHaveLength(2)
    expect(wrapper.text()).toContain('Italian')
    expect(tagMock).toHaveBeenCalledWith('Italian', { limit: 4 }, expect.any(AbortSignal))
    expect(wrapper.findAllComponents(RecipeCard)).toHaveLength(3)
    expect(wrapper.find('.detail-related').text()).not.toContain(pizza.name)
    wrapper.unmount()
  })

  it('keeps a layout skeleton while the recipe request is pending', async () => {
    let resolveRecipe!: (recipe: Recipe) => void
    detailMock.mockImplementation(() => new Promise((resolve) => (resolveRecipe = resolve)))
    const { wrapper } = await mountDetail()
    expect(wrapper.text()).toContain('Loading recipe')
    expect(wrapper.find('.detail-skeleton__image').exists()).toBe(true)
    resolveRecipe(pizza)
    await flushPromises()
    expect(wrapper.get('h1').text()).toBe(pizza.name)
    wrapper.unmount()
  })

  it('shows not found for a 404 and rejects invalid IDs without HTTP', async () => {
    detailMock.mockRejectedValue(new ApiError(404))
    const missing = await mountDetail('999999')
    await flushPromises()
    expect(missing.wrapper.get('h1').text()).toContain("isn't on the menu")
    expect(missing.wrapper.text()).not.toContain('HTTP 404')
    missing.wrapper.unmount()

    detailMock.mockClear()
    const invalid = await mountDetail('test')
    expect(invalid.wrapper.get('h1').text()).toContain("isn't on the menu")
    expect(detailMock).not.toHaveBeenCalled()
    invalid.wrapper.unmount()
  })

  it('offers retry after a network failure', async () => {
    detailMock.mockRejectedValueOnce(new Error('Network failure')).mockResolvedValueOnce(pizza)
    const { wrapper } = await mountDetail()
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain("We couldn't load this recipe")
    await wrapper.get('.detail-state button').trigger('click')
    await flushPromises()
    expect(detailMock).toHaveBeenCalledTimes(2)
    expect(wrapper.get('h1').text()).toBe(pizza.name)
    wrapper.unmount()
  })

  it('checks ingredients locally, supports check all, and resets on recipe change', async () => {
    const { wrapper, router } = await mountDetail()
    await flushPromises()
    const first = wrapper.findAll('.detail-ingredients input')[0]!
    await first.setValue(true)
    expect((first.element as HTMLInputElement).checked).toBe(true)
    await wrapper.get('.detail-ingredients__all').trigger('click')
    expect(
      wrapper
        .findAll('.detail-ingredients input')
        .every((input) => (input.element as HTMLInputElement).checked),
    ).toBe(true)
    await router.push('/recipes/2')
    await flushPromises()
    expect(wrapper.get('h1').text()).toBe(second.name)
    expect(
      wrapper
        .findAll('.detail-ingredients input')
        .every((input) => !(input.element as HTMLInputElement).checked),
    ).toBe(true)
    wrapper.unmount()
  })

  it('aborts a previous detail request when the route ID changes', async () => {
    let resolveFirst!: (recipe: Recipe) => void
    detailMock.mockImplementation((id) =>
      id === 1 ? new Promise((resolve) => (resolveFirst = resolve)) : Promise.resolve(second),
    )
    const { wrapper, router } = await mountDetail()
    const firstSignal = detailMock.mock.calls[0]?.[1]
    await router.push('/recipes/2')
    await flushPromises()
    resolveFirst(pizza)
    await flushPromises()
    expect(firstSignal?.aborted).toBe(true)
    expect(wrapper.get('h1').text()).toBe(second.name)
    wrapper.unmount()
  })

  it('falls back to meal type when the cuisine tag has no other recipe', async () => {
    tagMock.mockResolvedValue({ recipes: [pizza], total: 1, skip: 0, limit: 4 })
    mealMock.mockResolvedValue({ recipes: [pizza, second], total: 2, skip: 0, limit: 4 })
    const { wrapper } = await mountDetail()
    await flushPromises()
    expect(mealMock).toHaveBeenCalledWith('Dinner', { limit: 4 }, expect.any(AbortSignal))
    expect(wrapper.findAllComponents(RecipeCard)).toHaveLength(1)
    wrapper.unmount()
  })
})
