<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
  CakeSlice,
  ChevronDown,
  Leaf,
  Search,
  SlidersHorizontal,
  Sun,
  Utensils,
  X,
  Zap,
} from 'lucide-vue-next'
import FeaturedRecipe from '../components/FeaturedRecipe.vue'
import RecipeCard from '../components/RecipeCard.vue'
import {
  getRecipeById,
  getRecipes,
  getRecipesByMealType,
  getRecipesByTag,
  searchRecipes,
} from '../services/recipes.api'
import type { Recipe, RecipeListOptions, RecipesResponse } from '../types/recipe'
import tomatoCluster from '../assets/decor/tomato-cluster.webp'
import basilCorner from '../assets/decor/basil-corner.webp'
import * as m from '../paraglide/messages.js'

const PAGE_SIZE = 12
const SEARCH_DELAY = 300
const quickTags = ['Quick', 'Vegetarian', 'Asian', 'Mediterranean', 'Italian', 'Indian'] as const
const moreTags = ['Japanese', 'Mexican', 'Thai'] as const
const mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Dessert'] as const
const filterLabels = {
  Breakfast: m.meal_breakfast,
  Lunch: m.meal_lunch,
  Dinner: m.meal_dinner,
  Dessert: m.meal_dessert,
  Quick: m.tag_quick,
  Vegetarian: m.tag_vegetarian,
  Asian: m.tag_asian,
  Mediterranean: m.tag_mediterranean,
  Italian: m.tag_italian,
  Indian: m.tag_indian,
  Japanese: m.tag_japanese,
  Mexican: m.tag_mexican,
  Thai: m.tag_thai,
}
const shortcuts = [
  { value: 'Breakfast', kind: 'meal', icon: Sun },
  { value: 'Lunch', kind: 'meal', icon: Leaf },
  { value: 'Dinner', kind: 'meal', icon: Utensils },
  { value: 'Dessert', kind: 'meal', icon: CakeSlice },
  { value: 'Quick', kind: 'tag', icon: Zap },
] as const

type DiscoveryFilter = { kind: 'tag' | 'meal'; value: keyof typeof filterLabels }
type Sort = 'default' | 'rating' | 'name'

const searchQuery = ref('')
const selectedFilter = ref<DiscoveryFilter | null>(null)
const sort = ref<Sort>('default')
const recipes = ref<Recipe[]>([])
const total = ref(0)
const featured = ref<Recipe | null>(null)
const featuredLoading = ref(true)
const loading = ref(true)
const loadingMore = ref(false)
const error = ref(false)
const loadMoreError = ref(false)
const filterPanel = ref<HTMLDetailsElement | null>(null)

const hasMore = computed(() => recipes.value.length < total.value)
const hasDiscoverySelection = computed(
  () => !!searchQuery.value.trim() || !!selectedFilter.value || sort.value !== 'default',
)

let requestId = 0
let activeController: AbortController | undefined
let featuredController: AbortController | undefined
let searchTimer: ReturnType<typeof setTimeout> | undefined

function cancelDiscoveryRequest() {
  requestId += 1
  activeController?.abort()
  clearTimeout(searchTimer)
}

function listOptions(skip: number): RecipeListOptions {
  const options: RecipeListOptions = { limit: PAGE_SIZE, skip }
  if (sort.value === 'rating') return { ...options, sortBy: 'rating', order: 'desc' }
  if (sort.value === 'name') return { ...options, sortBy: 'name', order: 'asc' }
  return options
}

function fetchPage(skip: number, signal: AbortSignal): Promise<RecipesResponse> {
  const options = listOptions(skip)
  const query = searchQuery.value.trim()
  if (query) return searchRecipes(query, options, signal)
  if (selectedFilter.value?.kind === 'tag') {
    return getRecipesByTag(selectedFilter.value.value, options, signal)
  }
  if (selectedFilter.value?.kind === 'meal') {
    return getRecipesByMealType(selectedFilter.value.value, options, signal)
  }
  return getRecipes(options, signal)
}

async function loadDiscovery() {
  cancelDiscoveryRequest()
  const currentRequest = requestId
  activeController = new AbortController()
  loading.value = true
  loadingMore.value = false
  error.value = false
  loadMoreError.value = false
  recipes.value = []
  total.value = 0

  try {
    const result = await fetchPage(0, activeController.signal)
    if (currentRequest !== requestId) return
    recipes.value = result.recipes
    total.value = result.total
  } catch {
    if (currentRequest === requestId) error.value = true
  } finally {
    if (currentRequest === requestId) loading.value = false
  }
}

async function loadMore() {
  if (loading.value || loadingMore.value || !hasMore.value) return
  cancelDiscoveryRequest()
  const currentRequest = requestId
  activeController = new AbortController()
  loadingMore.value = true
  loadMoreError.value = false

  try {
    const result = await fetchPage(recipes.value.length, activeController.signal)
    if (currentRequest !== requestId) return
    recipes.value = [...recipes.value, ...result.recipes]
    total.value = result.total
  } catch {
    if (currentRequest === requestId) loadMoreError.value = true
  } finally {
    if (currentRequest === requestId) loadingMore.value = false
  }
}

function onSearchInput(event: Event) {
  searchQuery.value = (event.target as HTMLInputElement).value
  selectedFilter.value = null
  cancelDiscoveryRequest()
  recipes.value = []
  total.value = 0
  loading.value = true
  loadingMore.value = false
  error.value = false
  loadMoreError.value = false
  searchTimer = setTimeout(loadDiscovery, SEARCH_DELAY)
}

function selectFilter(kind: DiscoveryFilter['kind'], value: DiscoveryFilter['value']) {
  const current = selectedFilter.value
  selectedFilter.value = current?.kind === kind && current.value === value ? null : { kind, value }
  searchQuery.value = ''
  if (filterPanel.value?.open) {
    if (filterPanel.value.contains(document.activeElement)) {
      filterPanel.value.querySelector('summary')?.focus()
    }
    filterPanel.value.open = false
  }
  void loadDiscovery()
}

function closeFiltersOnEscape(event: KeyboardEvent) {
  if (!filterPanel.value?.open) return
  filterPanel.value.open = false
  filterPanel.value.querySelector('summary')?.focus()
  event.preventDefault()
}

function showAll() {
  searchQuery.value = ''
  selectedFilter.value = null
  void loadDiscovery()
}

function changeSort(event: Event) {
  sort.value = (event.target as HTMLSelectElement).value as Sort
  void loadDiscovery()
}

function resetDiscovery() {
  searchQuery.value = ''
  selectedFilter.value = null
  sort.value = 'default'
  if (filterPanel.value) filterPanel.value.open = false
  void loadDiscovery()
}

onMounted(() => {
  featuredController = new AbortController()
  getRecipeById(1, featuredController.signal)
    .then((recipe) => {
      featured.value = recipe
    })
    .catch(() => {
      featured.value = null
    })
    .finally(() => {
      featuredLoading.value = false
    })
  void loadDiscovery()
})

onUnmounted(() => {
  cancelDiscoveryRequest()
  featuredController?.abort()
})
</script>

<template>
  <main class="explore-page">
    <img
      class="explore-page__tomatoes"
      :src="tomatoCluster"
      width="1000"
      height="833"
      alt=""
      aria-hidden="true"
    />
    <img
      class="explore-page__basil"
      :src="basilCorner"
      width="700"
      height="618"
      alt=""
      aria-hidden="true"
      loading="lazy"
    />

    <div class="container explore-page__content">
      <section class="hero" aria-labelledby="hero-title">
        <h1 id="hero-title">{{ m.hero_title_first() }}<br />{{ m.hero_title_second() }}</h1>
        <p>{{ m.hero_subtitle() }}</p>

        <div class="hero__search">
          <Search :size="21" :stroke-width="1.7" aria-hidden="true" />
          <label class="visually-hidden" for="recipe-search">{{ m.search_label() }}</label>
          <input
            id="recipe-search"
            v-model="searchQuery"
            type="search"
            :placeholder="m.search_placeholder()"
            @input="onSearchInput"
          />
          <button
            v-if="searchQuery"
            type="button"
            class="hero__clear"
            :aria-label="m.search_clear()"
            @click="resetDiscovery"
          >
            <X :size="18" aria-hidden="true" />
          </button>
        </div>

        <ul class="hero__shortcuts" :aria-label="m.meal_shortcuts_label()">
          <li v-for="shortcut in shortcuts" :key="shortcut.value">
            <button
              class="chip"
              :class="{
                'chip--active':
                  selectedFilter?.kind === shortcut.kind && selectedFilter.value === shortcut.value,
              }"
              type="button"
              :aria-pressed="
                selectedFilter?.kind === shortcut.kind && selectedFilter.value === shortcut.value
              "
              @click="selectFilter(shortcut.kind, shortcut.value)"
            >
              <component :is="shortcut.icon" :size="18" aria-hidden="true" />{{
                filterLabels[shortcut.value]()
              }}
            </button>
          </li>
        </ul>
      </section>

      <div v-if="featuredLoading" class="featured-skeleton" aria-hidden="true">
        <div class="featured-skeleton__image"></div>
        <div class="featured-skeleton__copy">
          <span></span><span></span><span></span><span></span>
        </div>
      </div>
      <FeaturedRecipe v-else-if="featured" :recipe="featured" />

      <section id="discover" class="discover" aria-labelledby="discover-title">
        <div class="discover__heading">
          <h2 id="discover-title">{{ m.discover_title() }}</h2>
          <p role="status">
            {{ loading ? m.discover_loading() : m.recipes_count({ count: total }) }}
          </p>
        </div>

        <div class="discover__toolbar">
          <div class="discover__chips" :aria-label="m.recipe_filters_label()">
            <button
              type="button"
              class="chip"
              :class="{ 'chip--active': !searchQuery.trim() && !selectedFilter }"
              :aria-pressed="!searchQuery.trim() && !selectedFilter"
              @click="showAll"
            >
              {{ m.filter_all() }}
            </button>
            <button
              v-for="tag in quickTags"
              :key="tag"
              type="button"
              class="chip"
              :class="{
                'chip--active': selectedFilter?.kind === 'tag' && selectedFilter.value === tag,
              }"
              :aria-pressed="selectedFilter?.kind === 'tag' && selectedFilter.value === tag"
              @click="selectFilter('tag', tag)"
            >
              {{ filterLabels[tag]() }}
            </button>
          </div>
          <div class="discover__actions">
            <details
              ref="filterPanel"
              class="discover__filter-panel"
              @keydown.esc="closeFiltersOnEscape"
            >
              <summary class="chip">
                <SlidersHorizontal :size="16" aria-hidden="true" />{{ m.filters_button()
                }}<ChevronDown :size="15" aria-hidden="true" />
              </summary>
              <div class="discover__filter-options">
                <p>{{ m.filter_meal_type() }}</p>
                <div>
                  <button
                    v-for="meal in mealTypes"
                    :key="meal"
                    type="button"
                    class="chip"
                    :class="{
                      'chip--active':
                        selectedFilter?.kind === 'meal' && selectedFilter.value === meal,
                    }"
                    :aria-pressed="selectedFilter?.kind === 'meal' && selectedFilter.value === meal"
                    @click="selectFilter('meal', meal)"
                  >
                    {{ filterLabels[meal]() }}
                  </button>
                </div>
                <p>{{ m.filter_cuisine_style() }}</p>
                <div>
                  <button
                    v-for="tag in moreTags"
                    :key="tag"
                    type="button"
                    class="chip"
                    :class="{
                      'chip--active':
                        selectedFilter?.kind === 'tag' && selectedFilter.value === tag,
                    }"
                    :aria-pressed="selectedFilter?.kind === 'tag' && selectedFilter.value === tag"
                    @click="selectFilter('tag', tag)"
                  >
                    {{ filterLabels[tag]() }}
                  </button>
                </div>
              </div>
            </details>
            <label class="visually-hidden" for="recipe-sort">{{ m.sort_label() }}</label>
            <select id="recipe-sort" class="chip discover__sort" :value="sort" @change="changeSort">
              <option value="default">{{ m.sort_default() }}</option>
              <option value="rating">{{ m.sort_rating() }}</option>
              <option value="name">{{ m.sort_name() }}</option>
            </select>
          </div>
        </div>

        <div v-if="hasDiscoverySelection" class="discover__selection">
          <span v-if="searchQuery.trim()">{{
            m.search_selection({ query: searchQuery.trim() })
          }}</span>
          <span v-else-if="selectedFilter">{{ filterLabels[selectedFilter.value]() }}</span>
          <span v-if="sort !== 'default'">{{
            sort === 'rating' ? m.sort_rating() : m.sort_name()
          }}</span>
          <button type="button" @click="resetDiscovery">{{ m.clear_filters() }}</button>
        </div>

        <template v-if="loading">
          <div class="recipe-grid" aria-hidden="true">
            <div v-for="index in 6" :key="index" class="recipe-skeleton">
              <div class="recipe-skeleton__image"></div>
              <span></span><span></span>
            </div>
          </div>
        </template>
        <div v-else-if="error" class="state-panel" role="alert">
          <h3>{{ m.explore_error_title() }}</h3>
          <p>{{ m.explore_error_body() }}</p>
          <button class="button button--primary" type="button" @click="loadDiscovery">
            {{ m.try_again() }}
          </button>
        </div>
        <div v-else-if="recipes.length === 0" class="state-panel">
          <h3>{{ m.explore_empty_title() }}</h3>
          <p>{{ m.explore_empty_body() }}</p>
          <button class="button button--secondary" type="button" @click="resetDiscovery">
            {{ m.clear_filters() }}
          </button>
        </div>
        <template v-else>
          <div class="recipe-grid">
            <RecipeCard v-for="recipe in recipes" :key="recipe.id" :recipe="recipe" />
          </div>
          <div class="discover__footer">
            <p v-if="loadMoreError" class="discover__error" role="alert">
              {{ m.load_more_error() }}
            </p>
            <button
              v-if="hasMore"
              class="button button--secondary discover__more"
              type="button"
              :disabled="loadingMore"
              @click="loadMore"
            >
              {{ loadingMore ? m.loading_short() : m.load_more()
              }}<ChevronDown v-if="!loadingMore" :size="17" aria-hidden="true" />
            </button>
            <p v-else class="discover__end">{{ m.discover_end() }}</p>
          </div>
        </template>
      </section>
    </div>
  </main>
</template>

<style scoped lang="scss" src="../styles/explore.scss"></style>
