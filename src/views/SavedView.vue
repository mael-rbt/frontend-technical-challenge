<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Heart } from 'lucide-vue-next'
import RecipeCard from '../components/RecipeCard.vue'
import { useFavorites } from '../composables/useFavorites'
import { getRecipeById } from '../services/recipes.api'
import type { Recipe } from '../types/recipe'

const { favoriteIds } = useFavorites()
const fetchedRecipes = ref<Recipe[]>([])
const loading = ref(false)
const error = ref(false)
const savedRecipes = computed(() =>
  favoriteIds.value.flatMap((id) => {
    const recipe = fetchedRecipes.value.find((item) => item.id === id)
    return recipe ? [recipe] : []
  }),
)

let controller: AbortController | undefined

async function loadSaved() {
  controller?.abort()
  const ids = [...favoriteIds.value]
  if (!ids.length) {
    fetchedRecipes.value = []
    loading.value = false
    error.value = false
    return
  }

  controller = new AbortController()
  const signal = controller.signal
  loading.value = true
  error.value = false

  const results = await Promise.allSettled(ids.map((id) => getRecipeById(id, signal)))
  if (signal.aborted) return
  fetchedRecipes.value = results.flatMap((result) =>
    result.status === 'fulfilled' ? [result.value] : [],
  )
  error.value = results.some((result) => result.status === 'rejected')
  loading.value = false
}

onMounted(() => void loadSaved())
onUnmounted(() => controller?.abort())
</script>

<template>
  <main class="saved-page">
    <div class="container">
      <header class="saved-page__heading">
        <h1>Saved recipes</h1>
        <p>Your favorite recipes, kept for later.</p>
      </header>

      <section v-if="favoriteIds.length === 0" class="saved-state" aria-labelledby="saved-empty">
        <Heart :size="34" :stroke-width="1.4" aria-hidden="true" />
        <h2 id="saved-empty">Nothing saved yet.</h2>
        <p>Keep the recipes you love close at hand.</p>
        <RouterLink class="button button--primary" to="/">Explore recipes</RouterLink>
      </section>

      <template v-else-if="loading">
        <p class="visually-hidden" role="status">Loading your saved recipes…</p>
        <div class="saved-grid" aria-hidden="true">
          <div v-for="index in Math.min(favoriteIds.length, 3)" :key="index" class="saved-skeleton">
            <div class="saved-skeleton__image"></div>
            <span></span><span></span>
          </div>
        </div>
      </template>

      <section
        v-else-if="error && !savedRecipes.length"
        class="saved-state"
        aria-labelledby="saved-error"
        role="alert"
      >
        <h2 id="saved-error">We couldn't load your saved recipes.</h2>
        <p>Your favorites are still saved. Please try again.</p>
        <button class="button button--primary" type="button" @click="loadSaved">Try again</button>
      </section>

      <template v-else>
        <div v-if="error" class="saved-page__notice" role="alert">
          <p>Some saved recipes couldn't be loaded. Your favorites are still saved.</p>
          <button class="button button--secondary" type="button" @click="loadSaved">
            Try again
          </button>
        </div>
        <div class="saved-grid">
          <RecipeCard
            v-for="recipe in savedRecipes"
            :key="recipe.id"
            :recipe="recipe"
            :heading-level="2"
          />
        </div>
      </template>
    </div>
  </main>
</template>

<style scoped lang="scss" src="../styles/saved.scss"></style>
