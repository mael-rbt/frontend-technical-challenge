import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import ExploreView from '../src/views/ExploreView.vue'
import RecipeCard from '../src/components/RecipeCard.vue'
import { getRecipes } from '../src/services/recipes.api'
import type { Recipe, RecipesResponse } from '../src/types/recipe'

vi.mock('../src/services/recipes.api', () => ({ getRecipes: vi.fn() }))

const getRecipesMock = vi.mocked(getRecipes)

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

const firstPage: RecipesResponse = { recipes: [recipe], total: 2, skip: 0, limit: 12 }
const secondPage: RecipesResponse = {
  recipes: [{ ...recipe, id: 2, name: 'Vegetarian Stir-Fry' }],
  total: 2,
  skip: 1,
  limit: 12,
}

beforeEach(() => {
  getRecipesMock.mockReset()
})
afterEach(() => {
  vi.clearAllMocks()
})

describe('RecipeCard', () => {
  it('shows the recipe name, total time, and rating', () => {
    const wrapper = mount(RecipeCard, { props: { recipe } })

    expect(wrapper.text()).toContain('Classic Margherita Pizza')
    expect(wrapper.text()).toContain('35 min')
    expect(wrapper.text()).toContain('4.6 (98)')
    expect(wrapper.get('img').attributes('alt')).toContain('Classic Margherita Pizza')
  })
})

describe('ExploreView', () => {
  it('shows loading, then a real recipe and a featured section', async () => {
    let finishRequest!: (response: RecipesResponse) => void
    getRecipesMock.mockImplementation(
      () => new Promise<RecipesResponse>((resolve) => (finishRequest = resolve)),
    )

    const wrapper = mount(ExploreView)
    expect(wrapper.text()).toContain('Loading recipes')

    finishRequest(firstPage)
    await flushPromises()

    expect(getRecipesMock).toHaveBeenCalledWith({ limit: 12, skip: 0 })
    expect(wrapper.findAllComponents(RecipeCard)).toHaveLength(1)
    expect(wrapper.get('#featured-title').text()).toBe('Classic Margherita Pizza')
    expect(wrapper.text()).toContain('Showing 1 of 2 recipes')
  })

  it('offers retry after an initial request fails', async () => {
    getRecipesMock
      .mockRejectedValueOnce(new Error('Network failure'))
      .mockResolvedValueOnce(firstPage)
    const wrapper = mount(ExploreView)
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain("We couldn't load the recipes")
    await wrapper.get('button').trigger('click')
    await flushPromises()

    expect(getRecipesMock).toHaveBeenCalledTimes(2)
    expect(wrapper.findAllComponents(RecipeCard)).toHaveLength(1)
  })

  it('shows an empty state when the API has no recipes', async () => {
    getRecipesMock.mockResolvedValue({ recipes: [], total: 0, skip: 0, limit: 12 })
    const wrapper = mount(ExploreView)
    await flushPromises()

    expect(wrapper.text()).toContain('Nothing on the menu yet.')
    expect(wrapper.findAllComponents(RecipeCard)).toHaveLength(0)
  })

  it('appends the next page and ends pagination at total', async () => {
    getRecipesMock.mockResolvedValueOnce(firstPage).mockResolvedValueOnce(secondPage)
    const wrapper = mount(ExploreView)
    await flushPromises()

    await wrapper.get('.discover__more').trigger('click')
    await flushPromises()

    expect(getRecipesMock).toHaveBeenNthCalledWith(2, { limit: 12, skip: 1 })
    expect(wrapper.findAllComponents(RecipeCard)).toHaveLength(2)
    expect(wrapper.text()).toContain('Showing 2 of 2 recipes')
    expect(wrapper.find('.discover__more').exists()).toBe(false)
    expect(wrapper.text()).toContain("You've seen every recipe.")
  })

  it('keeps the current recipes if loading more fails, then retries', async () => {
    getRecipesMock
      .mockResolvedValueOnce(firstPage)
      .mockRejectedValueOnce(new Error('Temporary failure'))
      .mockResolvedValueOnce(secondPage)
    const wrapper = mount(ExploreView)
    await flushPromises()

    await wrapper.get('.discover__more').trigger('click')
    await flushPromises()

    expect(wrapper.findAllComponents(RecipeCard)).toHaveLength(1)
    expect(wrapper.get('[role="alert"]').text()).toContain("We couldn't load more recipes")

    await wrapper.get('.discover__more').trigger('click')
    await flushPromises()

    expect(wrapper.findAllComponents(RecipeCard)).toHaveLength(2)
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })
})
