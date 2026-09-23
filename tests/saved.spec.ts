import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import SavedView from '../src/views/SavedView.vue'
import { useFavorites } from '../src/composables/useFavorites'
import { getRecipeById } from '../src/services/recipes.api'
import type { Recipe } from '../src/types/recipe'

vi.mock('../src/services/recipes.api', () => ({ getRecipeById: vi.fn() }))

const detailMock = vi.mocked(getRecipeById)
const routerLinkStub = { template: '<a href="#"><slot /></a>' }
const pizza: Recipe = {
  id: 1,
  name: 'Classic Margherita Pizza',
  ingredients: ['Pizza dough'],
  instructions: ['Bake.'],
  prepTimeMinutes: 20,
  cookTimeMinutes: 15,
  servings: 4,
  difficulty: 'Easy',
  cuisine: 'Italian',
  caloriesPerServing: 300,
  tags: ['Pizza'],
  userId: 1,
  image: 'https://cdn.dummyjson.com/recipe-images/1.webp',
  rating: 4.6,
  reviewCount: 98,
  mealType: ['Dinner'],
}
const salad: Recipe = { ...pizza, id: 5, name: 'Quinoa Salad with Avocado' }

beforeEach(() => {
  vi.resetAllMocks()
  const favorites = useFavorites()
  for (const id of [...favorites.favoriteIds.value]) favorites.toggleFavorite(id)
  localStorage.clear()
  detailMock.mockImplementation(async (id) => (id === 5 ? salad : pizza))
})

function mountSaved() {
  return mount(SavedView, { global: { stubs: { RouterLink: routerLinkStub } } })
}

describe('SavedView', () => {
  it('shows an empty state with a route back to Explore', () => {
    const wrapper = mountSaved()
    expect(wrapper.get('h1').text()).toBe('Saved recipes')
    expect(wrapper.text()).toContain('Nothing saved yet.')
    expect(wrapper.text()).toContain('Explore recipes')
    expect(detailMock).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('shows loading while saved recipes are pending', async () => {
    useFavorites().toggleFavorite(1)
    let resolveRecipe!: (recipe: Recipe) => void
    detailMock.mockImplementation(() => new Promise((resolve) => (resolveRecipe = resolve)))
    const wrapper = mountSaved()
    await nextTick()
    expect(wrapper.text()).toContain('Loading your saved recipes')
    expect(wrapper.find('.saved-skeleton').exists()).toBe(true)
    resolveRecipe(pizza)
    await flushPromises()
    expect(wrapper.text()).toContain(pizza.name)
    wrapper.unmount()
  })

  it('fetches saved IDs in parallel and keeps their addition order', async () => {
    const favorites = useFavorites()
    favorites.toggleFavorite(5)
    favorites.toggleFavorite(1)
    const wrapper = mountSaved()
    await flushPromises()
    expect(detailMock).toHaveBeenCalledTimes(2)
    expect(wrapper.findAll('.recipe-card h2').map((heading) => heading.text())).toEqual([
      salad.name,
      pizza.name,
    ])
    wrapper.unmount()
  })

  it('removes a card immediately and shows empty when the last is removed', async () => {
    useFavorites().toggleFavorite(1)
    const wrapper = mount(SavedView, {
      attachTo: document.body,
      global: { stubs: { RouterLink: routerLinkStub } },
    })
    await flushPromises()
    const button = wrapper.get('.recipe-card__save')
    const buttonElement = button.element as HTMLElement
    buttonElement.focus()
    buttonElement.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }))
    await nextTick()
    expect(wrapper.find('.recipe-card').exists()).toBe(false)
    expect(wrapper.text()).toContain('Nothing saved yet.')
    expect(document.activeElement).toBe(wrapper.get('#saved-empty').element)
    expect(localStorage.getItem('mise:favorites')).toBe('[]')
    wrapper.unmount()
  })

  it('moves keyboard focus to the next saved recipe after removal', async () => {
    const favorites = useFavorites()
    favorites.toggleFavorite(1)
    favorites.toggleFavorite(5)
    const wrapper = mount(SavedView, {
      attachTo: document.body,
      global: { stubs: { RouterLink: routerLinkStub } },
    })
    await flushPromises()
    const button = wrapper.get('.recipe-card__save')
    const buttonElement = button.element as HTMLElement
    buttonElement.focus()
    buttonElement.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }))
    await nextTick()

    expect(wrapper.findAll('.recipe-card')).toHaveLength(1)
    expect(document.activeElement).toBe(wrapper.get('.recipe-card__link').element)
    wrapper.unmount()
  })

  it('moves focus to retry when the remaining saved recipe could not load', async () => {
    const favorites = useFavorites()
    favorites.toggleFavorite(1)
    favorites.toggleFavorite(5)
    detailMock.mockImplementation(async (id) => {
      if (id === 5) throw new Error('Network failure')
      return pizza
    })
    const wrapper = mount(SavedView, {
      attachTo: document.body,
      global: { stubs: { RouterLink: routerLinkStub } },
    })
    await flushPromises()
    const button = wrapper.get('.recipe-card__save').element as HTMLElement
    button.focus()
    button.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }))
    await nextTick()

    expect(document.activeElement).toBe(wrapper.get('.saved-state button').element)
    wrapper.unmount()
  })

  it('shows a retry state when every saved recipe fails to load', async () => {
    useFavorites().toggleFavorite(1)
    detailMock.mockRejectedValueOnce(new Error('Network failure'))
    const wrapper = mountSaved()
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain("We couldn't load your saved recipes")
    expect(useFavorites().favoriteIds.value).toEqual([1])
    await wrapper.get('.saved-state button').trigger('click')
    await flushPromises()
    expect(wrapper.findAll('.recipe-card')).toHaveLength(1)
    wrapper.unmount()
  })

  it('retains favorite IDs after a partial API failure and allows retry', async () => {
    const favorites = useFavorites()
    favorites.toggleFavorite(1)
    favorites.toggleFavorite(5)
    detailMock.mockImplementation(async (id) => {
      if (id === 5) throw new Error('Network failure')
      return pizza
    })
    const wrapper = mountSaved()
    await flushPromises()
    expect(wrapper.findAll('.recipe-card')).toHaveLength(1)
    expect(wrapper.get('[role="alert"]').text()).toContain("Some saved recipes couldn't be loaded")
    expect(favorites.favoriteIds.value).toEqual([1, 5])

    detailMock.mockImplementation(async (id) => (id === 5 ? salad : pizza))
    await wrapper.get('.saved-page__notice button').trigger('click')
    await flushPromises()
    expect(wrapper.findAll('.recipe-card')).toHaveLength(2)
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    wrapper.unmount()
  })
})
