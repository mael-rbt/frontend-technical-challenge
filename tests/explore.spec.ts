import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import ExploreView from '../src/views/ExploreView.vue'
import RecipeCard from '../src/components/RecipeCard.vue'
import {
  getRecipeById,
  getRecipes,
  getRecipesByMealType,
  getRecipesByTag,
  searchRecipes,
} from '../src/services/recipes.api'
import type { Recipe, RecipesResponse } from '../src/types/recipe'

vi.mock('../src/services/recipes.api', () => ({
  getRecipeById: vi.fn(),
  getRecipes: vi.fn(),
  getRecipesByMealType: vi.fn(),
  getRecipesByTag: vi.fn(),
  searchRecipes: vi.fn(),
}))

const getRecipeByIdMock = vi.mocked(getRecipeById)
const getRecipesMock = vi.mocked(getRecipes)
const getRecipesByMealTypeMock = vi.mocked(getRecipesByMealType)
const getRecipesByTagMock = vi.mocked(getRecipesByTag)
const searchRecipesMock = vi.mocked(searchRecipes)
const routerLinkStub = { template: '<a><slot /></a>' }

const recipe: Recipe = {
  id: 1,
  name: 'Classic Margherita Pizza',
  ingredients: ['Pizza dough', 'Tomato sauce', 'Fresh mozzarella'],
  instructions: ['Bake the pizza.'],
  prepTimeMinutes: 20,
  cookTimeMinutes: 15,
  servings: 4,
  difficulty: 'Easy',
  cuisine: 'Italian',
  caloriesPerServing: 300,
  tags: ['Pizza'],
  userId: 166,
  image: 'https://cdn.dummyjson.com/recipe-images/1.webp',
  rating: 4.6,
  reviewCount: 98,
  mealType: ['Dinner'],
}

const anotherRecipe: Recipe = { ...recipe, id: 2, name: 'Chicken Biryani' }
const firstPage: RecipesResponse = { recipes: [recipe], total: 2, skip: 0, limit: 12 }
const secondPage: RecipesResponse = { recipes: [anotherRecipe], total: 2, skip: 1, limit: 12 }
const emptyPage: RecipesResponse = { recipes: [], total: 0, skip: 0, limit: 0 }

beforeEach(() => {
  vi.resetAllMocks()
  getRecipeByIdMock.mockResolvedValue(recipe)
  getRecipesMock.mockResolvedValue(firstPage)
  getRecipesByMealTypeMock.mockResolvedValue(firstPage)
  getRecipesByTagMock.mockResolvedValue(firstPage)
  searchRecipesMock.mockResolvedValue(firstPage)
})
afterEach(() => vi.useRealTimers())

async function mountedView() {
  const wrapper = mount(ExploreView, { global: { stubs: { RouterLink: routerLinkStub } } })
  await flushPromises()
  return wrapper
}

describe('RecipeCard', () => {
  it('shows the recipe name, total time, and rating', () => {
    const wrapper = mount(RecipeCard, {
      props: { recipe },
      global: { stubs: { RouterLink: routerLinkStub } },
    })
    expect(wrapper.text()).toContain('Classic Margherita Pizza')
    expect(wrapper.text()).toContain('35 min')
    expect(wrapper.text()).toContain('4.6 (98)')
    expect(wrapper.get('img').attributes('alt')).toContain('Classic Margherita Pizza')
  })
})

describe('ExploreView', () => {
  it('shows loading, then a recipe and a stable featured section', async () => {
    let finishRequest!: (response: RecipesResponse) => void
    getRecipesMock.mockImplementation(
      () => new Promise<RecipesResponse>((resolve) => (finishRequest = resolve)),
    )
    const wrapper = mount(ExploreView, { global: { stubs: { RouterLink: routerLinkStub } } })
    expect(wrapper.text()).toContain('Loading recipes')

    finishRequest(firstPage)
    await flushPromises()
    expect(getRecipesMock).toHaveBeenCalledWith({ limit: 12, skip: 0 }, expect.any(AbortSignal))
    expect(getRecipeByIdMock).toHaveBeenCalledWith(1, expect.any(AbortSignal))
    expect(wrapper.findAllComponents(RecipeCard)).toHaveLength(1)
    expect(wrapper.get('#featured-title').text()).toBe(recipe.name)
    expect(wrapper.text()).toContain('2 recipes')
    wrapper.unmount()
  })

  it('offers retry after a request fails', async () => {
    getRecipesMock.mockRejectedValueOnce(new Error('Network failure'))
    const wrapper = await mountedView()
    expect(wrapper.get('[role="alert"]').text()).toContain("We couldn't load the recipes")
    await wrapper.get('.state-panel button').trigger('click')
    await flushPromises()
    expect(getRecipesMock).toHaveBeenCalledTimes(2)
    expect(wrapper.findAllComponents(RecipeCard)).toHaveLength(1)
    wrapper.unmount()
  })

  it('shows an empty state and resets discovery', async () => {
    searchRecipesMock.mockResolvedValue(emptyPage)
    const wrapper = await mountedView()
    vi.useFakeTimers()
    await wrapper.get('#recipe-search').setValue('zzzz')
    await vi.advanceTimersByTimeAsync(300)
    expect(wrapper.text()).toContain('Nothing on the menu.')
    await wrapper.get('.state-panel button').trigger('click')
    await flushPromises()
    expect(getRecipesMock).toHaveBeenCalledTimes(2)
    expect((wrapper.get('#recipe-search').element as HTMLInputElement).value).toBe('')
    wrapper.unmount()
  })

  it('debounces a trimmed search, then continues its pagination', async () => {
    searchRecipesMock.mockResolvedValueOnce(firstPage).mockResolvedValueOnce(secondPage)
    const wrapper = await mountedView()
    vi.useFakeTimers()
    await wrapper.get('#recipe-search').setValue(' ra')
    await wrapper.get('#recipe-search').setValue(' ramen  ')
    await vi.advanceTimersByTimeAsync(299)
    expect(searchRecipesMock).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(searchRecipesMock).toHaveBeenCalledTimes(1)
    expect(searchRecipesMock).toHaveBeenCalledWith(
      'ramen',
      { limit: 12, skip: 0 },
      expect.any(AbortSignal),
    )
    expect(wrapper.get('#featured-title').text()).toBe(recipe.name)
    await wrapper.get('.discover__more').trigger('click')
    await flushPromises()
    expect(searchRecipesMock).toHaveBeenNthCalledWith(
      2,
      'ramen',
      { limit: 12, skip: 1 },
      expect.any(AbortSignal),
    )
    expect(wrapper.findAllComponents(RecipeCard)).toHaveLength(2)
    expect(wrapper.find('.discover__more').exists()).toBe(false)
    await wrapper.get('#recipe-search').setValue('')
    await vi.advanceTimersByTimeAsync(300)
    expect(getRecipesMock).toHaveBeenCalledTimes(2)
    expect(getRecipesMock).toHaveBeenLastCalledWith({ limit: 12, skip: 0 }, expect.any(AbortSignal))
    wrapper.unmount()
  })

  it('uses the meal endpoint for Breakfast and the tag endpoint for Quick', async () => {
    const wrapper = await mountedView()
    await wrapper.findAll('.hero__shortcuts button')[0]!.trigger('click')
    await flushPromises()
    expect(getRecipesByMealTypeMock).toHaveBeenCalledWith(
      'Breakfast',
      { limit: 12, skip: 0 },
      expect.any(AbortSignal),
    )
    await wrapper.findAll('.hero__shortcuts button')[4]!.trigger('click')
    await flushPromises()
    expect(getRecipesByTagMock).toHaveBeenCalledWith(
      'Quick',
      { limit: 12, skip: 0 },
      expect.any(AbortSignal),
    )
    expect(wrapper.findAll('.hero__shortcuts button')[4]!.attributes('aria-pressed')).toBe('true')
    wrapper.unmount()
  })

  it('sorts the active filter on the server and preserves it for Load more', async () => {
    getRecipesByTagMock
      .mockResolvedValueOnce(firstPage)
      .mockResolvedValueOnce(firstPage)
      .mockResolvedValueOnce(secondPage)
    const wrapper = await mountedView()
    await wrapper.findAll('.discover__chips button')[1]!.trigger('click')
    await flushPromises()
    await wrapper.get('#recipe-sort').setValue('rating')
    await flushPromises()
    expect(getRecipesByTagMock).toHaveBeenLastCalledWith(
      'Quick',
      { limit: 12, skip: 0, sortBy: 'rating', order: 'desc' },
      expect.any(AbortSignal),
    )
    await wrapper.get('.discover__more').trigger('click')
    await flushPromises()
    expect(getRecipesByTagMock).toHaveBeenLastCalledWith(
      'Quick',
      { limit: 12, skip: 1, sortBy: 'rating', order: 'desc' },
      expect.any(AbortSignal),
    )
    wrapper.unmount()
  })

  it('aborts an obsolete request without showing an error', async () => {
    let rejectSearch!: (error: Error) => void
    searchRecipesMock.mockImplementation(
      () => new Promise<RecipesResponse>((_, reject) => (rejectSearch = reject)),
    )
    const wrapper = await mountedView()
    vi.useFakeTimers()
    await wrapper.get('#recipe-search').setValue('ramen')
    await vi.advanceTimersByTimeAsync(300)
    const oldSignal = searchRecipesMock.mock.calls[0]?.[2]
    await wrapper.findAll('.hero__shortcuts button')[0]!.trigger('click')
    await flushPromises()
    rejectSearch(new DOMException('Aborted', 'AbortError'))
    await flushPromises()
    expect(oldSignal?.aborted).toBe(true)
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.findAllComponents(RecipeCard)).toHaveLength(1)
    wrapper.unmount()
  })

  it('keeps the current recipes if Load more fails, then retries', async () => {
    getRecipesMock
      .mockResolvedValueOnce(firstPage)
      .mockRejectedValueOnce(new Error('Temporary failure'))
      .mockResolvedValueOnce(secondPage)
    const wrapper = await mountedView()
    await wrapper.get('.discover__more').trigger('click')
    await flushPromises()
    expect(wrapper.findAllComponents(RecipeCard)).toHaveLength(1)
    expect(wrapper.get('[role="alert"]').text()).toContain("We couldn't load more recipes")
    await wrapper.get('.discover__more').trigger('click')
    await flushPromises()
    expect(wrapper.findAllComponents(RecipeCard)).toHaveLength(2)
    wrapper.unmount()
  })
})
