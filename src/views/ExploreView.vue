<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { CakeSlice, ChevronDown, Leaf, Search, Sun, Utensils, Zap } from 'lucide-vue-next'
import FeaturedRecipe from '../components/FeaturedRecipe.vue'
import RecipeCard from '../components/RecipeCard.vue'
import { getRecipes } from '../services/recipes.api'
import type { Recipe } from '../types/recipe'
import tomatoCluster from '../assets/decor/tomato-cluster.png'
import basilCorner from '../assets/decor/basil-corner.png'

const PAGE_SIZE = 12

const recipes = ref<Recipe[]>([])
const total = ref(0)
const loading = ref(true)
const loadingMore = ref(false)
const error = ref(false)
const loadMoreError = ref(false)

const featured = computed(() => recipes.value[0])
const hasMore = computed(() => recipes.value.length < total.value)

async function loadInitial() {
  loading.value = true
  error.value = false

  try {
    const result = await getRecipes({ limit: PAGE_SIZE, skip: 0 })
    recipes.value = result.recipes
    total.value = result.total
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

async function loadMore() {
  if (loadingMore.value || !hasMore.value) return

  loadingMore.value = true
  loadMoreError.value = false

  try {
    const result = await getRecipes({ limit: PAGE_SIZE, skip: recipes.value.length })
    recipes.value = [...recipes.value, ...result.recipes]
    total.value = result.total
  } catch {
    loadMoreError.value = true
  } finally {
    loadingMore.value = false
  }
}

onMounted(loadInitial)
</script>

<template>
  <main class="explore-page">
    <img
      class="explore-page__tomatoes"
      :src="tomatoCluster"
      width="1374"
      height="1145"
      alt=""
      aria-hidden="true"
    />
    <img
      class="explore-page__basil"
      :src="basilCorner"
      width="1335"
      height="1178"
      alt=""
      aria-hidden="true"
      loading="lazy"
    />

    <div class="container explore-page__content">
      <section class="hero" aria-labelledby="hero-title">
        <h1 id="hero-title">What are you<br />hungry for?</h1>
        <p>Discover something worth cooking tonight.</p>

        <div class="hero__search">
          <Search :size="21" :stroke-width="1.7" aria-hidden="true" />
          <label class="visually-hidden" for="recipe-search">Search recipes (coming soon)</label>
          <input
            id="recipe-search"
            type="search"
            placeholder="Search recipes, cuisines, ingredients..."
            disabled
          />
        </div>
        <p class="hero__hint">Search and meal shortcuts are coming soon.</p>

        <ul class="hero__shortcuts" aria-label="Meal shortcuts coming soon">
          <li class="chip"><Sun :size="18" aria-hidden="true" />Breakfast</li>
          <li class="chip"><Leaf :size="18" aria-hidden="true" />Lunch</li>
          <li class="chip"><Utensils :size="18" aria-hidden="true" />Dinner</li>
          <li class="chip"><CakeSlice :size="18" aria-hidden="true" />Dessert</li>
          <li class="chip"><Zap :size="18" aria-hidden="true" />Quick</li>
        </ul>
      </section>

      <template v-if="loading">
        <p class="visually-hidden" role="status">Loading recipes…</p>
        <div class="featured-skeleton" aria-hidden="true">
          <div class="featured-skeleton__image"></div>
          <div class="featured-skeleton__copy">
            <span></span><span></span><span></span><span></span>
          </div>
        </div>
        <section class="discover" aria-labelledby="discover-title">
          <h2 id="discover-title">Discover</h2>
          <div class="recipe-grid" aria-hidden="true">
            <div v-for="index in 6" :key="index" class="recipe-skeleton">
              <div class="recipe-skeleton__image"></div>
              <span></span><span></span>
            </div>
          </div>
        </section>
      </template>

      <section v-else-if="error" class="state-panel" role="alert">
        <h2>We couldn't load the recipes.</h2>
        <p>Something went wrong while contacting the service. Please try again.</p>
        <button class="button button--primary" type="button" @click="loadInitial">Try again</button>
      </section>

      <section v-else-if="recipes.length === 0" class="state-panel">
        <h2>Nothing on the menu yet.</h2>
        <p>There are no recipes to explore right now. Please check back soon.</p>
        <button class="button button--secondary" type="button" @click="loadInitial">
          Try again
        </button>
      </section>

      <template v-else>
        <FeaturedRecipe v-if="featured" :recipe="featured" />

        <section id="discover" class="discover" aria-labelledby="discover-title">
          <div class="discover__heading">
            <h2 id="discover-title">Discover</h2>
            <p aria-live="polite">Showing {{ recipes.length }} of {{ total }} recipes</p>
          </div>

          <div class="recipe-grid">
            <RecipeCard v-for="recipe in recipes" :key="recipe.id" :recipe="recipe" />
          </div>

          <div class="discover__footer">
            <p v-if="loadMoreError" class="discover__error" role="alert">
              We couldn't load more recipes. Please try again.
            </p>
            <button
              v-if="hasMore"
              class="button button--secondary discover__more"
              type="button"
              :disabled="loadingMore"
              @click="loadMore"
            >
              {{ loadingMore ? 'Loading…' : 'Load more' }}
              <ChevronDown v-if="!loadingMore" :size="17" aria-hidden="true" />
            </button>
            <p v-else class="discover__end">You've seen every recipe.</p>
          </div>
        </section>
      </template>
    </div>
  </main>
</template>

<style scoped lang="scss" src="../styles/explore.scss"></style>
