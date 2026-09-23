<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Heart } from 'lucide-vue-next'
import RecipeCard from '../components/RecipeCard.vue'
import { useFavorites } from '../composables/useFavorites'
import { getRecipeById } from '../services/recipes.api'
import type { Recipe } from '../types/recipe'
import * as m from '../paraglide/messages.js'

const { favoriteIds } = useFavorites()
const fetchedRecipes = ref<Recipe[]>([])
const loading = ref(false)
const error = ref(false)
const savedGrid = ref<HTMLElement | null>(null)
const emptyHeading = ref<HTMLElement | null>(null)
const retryButton = ref<HTMLElement | null>(null)
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

async function restoreFocusAfterRemoval(index: number, event: MouseEvent) {
  // Keyboard-generated clicks have detail 0; pointer users keep their scroll position.
  if (event.detail !== 0) return
  await nextTick()
  const links = savedGrid.value?.querySelectorAll<HTMLAnchorElement>('.recipe-card__link')
  const target =
    links?.[Math.min(index, links.length - 1)] ?? emptyHeading.value ?? retryButton.value
  target?.focus()
}

onMounted(() => void loadSaved())
onUnmounted(() => controller?.abort())
</script>

<template>
  <main class="saved-page">
    <div class="container">
      <header class="saved-page__heading">
        <h1>{{ m.saved_title() }}</h1>
        <p>{{ m.saved_subtitle() }}</p>
      </header>

      <section v-if="favoriteIds.length === 0" class="saved-state" aria-labelledby="saved-empty">
        <Heart :size="34" :stroke-width="1.4" aria-hidden="true" />
        <h2 id="saved-empty" ref="emptyHeading" tabindex="-1">{{ m.saved_empty_title() }}</h2>
        <p>{{ m.saved_empty_body() }}</p>
        <RouterLink class="button button--primary" to="/">{{ m.saved_explore() }}</RouterLink>
      </section>

      <template v-else-if="loading">
        <p class="visually-hidden" role="status">{{ m.saved_loading() }}</p>
        <div class="saved-grid" aria-hidden="true">
          <div v-for="index in Math.min(favoriteIds.length, 3)" :key="index" class="saved-skeleton">
            <div class="saved-skeleton__image"></div>
            <span></span><span></span><span></span>
          </div>
        </div>
      </template>

      <section
        v-else-if="error && !savedRecipes.length"
        class="saved-state"
        aria-labelledby="saved-error"
        role="alert"
      >
        <h2 id="saved-error">{{ m.saved_error_title() }}</h2>
        <p>{{ m.saved_error_body() }}</p>
        <button ref="retryButton" class="button button--primary" type="button" @click="loadSaved">
          {{ m.try_again() }}
        </button>
      </section>

      <template v-else>
        <div v-if="error" class="saved-page__notice" role="alert">
          <p>{{ m.saved_partial_error() }}</p>
          <button class="button button--secondary" type="button" @click="loadSaved">
            {{ m.try_again() }}
          </button>
        </div>
        <div ref="savedGrid" class="saved-grid">
          <RecipeCard
            v-for="(recipe, index) in savedRecipes"
            :key="recipe.id"
            :recipe="recipe"
            :heading-level="2"
            @favorite-toggled="restoreFocusAfterRemoval(index, $event)"
          />
        </div>
      </template>
    </div>
  </main>
</template>

<style scoped lang="scss" src="../styles/saved.scss"></style>
