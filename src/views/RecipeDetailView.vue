<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { ArrowLeft, ArrowRight, Heart, Star } from 'lucide-vue-next'
import RecipeCard from '../components/RecipeCard.vue'
import { useFavorites } from '../composables/useFavorites'
import {
  ApiError,
  getRecipeById,
  getRecipesByMealType,
  getRecipesByTag,
} from '../services/recipes.api'
import type { Recipe } from '../types/recipe'
import tomatoCluster from '../assets/decor/tomato-cluster.png'
import basilCorner from '../assets/decor/basil-corner.png'

const route = useRoute()
const { isFavorite, toggleFavorite } = useFavorites()
const recipe = ref<Recipe | null>(null)
const relatedRecipes = ref<Recipe[]>([])
const checkedIngredients = ref<number[]>([])
const loading = ref(true)
const error = ref<'not-found' | 'request' | null>(null)
const isSaved = computed(() => !!recipe.value && isFavorite(recipe.value.id))
const allChecked = computed(
  () =>
    !!recipe.value?.ingredients.length &&
    checkedIngredients.value.length === recipe.value.ingredients.length,
)

let controller: AbortController | undefined

async function loadRelated(current: Recipe, signal: AbortSignal): Promise<Recipe[]> {
  let matches: Recipe[] = []
  if (current.tags.includes(current.cuisine)) {
    const response = await getRecipesByTag(current.cuisine, { limit: 4 }, signal)
    matches = response.recipes.filter((item) => item.id !== current.id)
  }
  if (!matches.length && current.mealType[0]) {
    const response = await getRecipesByMealType(current.mealType[0], { limit: 4 }, signal)
    matches = response.recipes.filter((item) => item.id !== current.id)
  }
  return matches.slice(0, 3)
}

async function loadRecipe(rawId: unknown) {
  controller?.abort()
  controller = new AbortController()
  const signal = controller.signal
  recipe.value = null
  relatedRecipes.value = []
  checkedIngredients.value = []
  error.value = null

  const id = typeof rawId === 'string' && /^[1-9]\d*$/.test(rawId) ? Number(rawId) : NaN
  if (!Number.isSafeInteger(id)) {
    loading.value = false
    error.value = 'not-found'
    return
  }

  loading.value = true
  try {
    const result = await getRecipeById(id, signal)
    if (signal.aborted) return
    recipe.value = result
    loading.value = false

    try {
      const matches = await loadRelated(result, signal)
      if (!signal.aborted) relatedRecipes.value = matches
    } catch {
      // Related recipes are optional; the detail stays usable when this request fails.
    }
  } catch (cause) {
    if (signal.aborted) return
    error.value = cause instanceof ApiError && cause.status === 404 ? 'not-found' : 'request'
    loading.value = false
  }
}

function toggleAllIngredients() {
  if (!recipe.value) return
  checkedIngredients.value = allChecked.value
    ? []
    : recipe.value.ingredients.map((_, index) => index)
}

watch(() => route.params.id, loadRecipe, { immediate: true })
onUnmounted(() => controller?.abort())
</script>

<template>
  <main class="detail-page">
    <img
      class="detail-page__tomatoes"
      :src="tomatoCluster"
      width="1374"
      height="1145"
      alt=""
      aria-hidden="true"
      loading="lazy"
    />
    <img
      class="detail-page__basil"
      :src="basilCorner"
      width="1335"
      height="1178"
      alt=""
      aria-hidden="true"
      loading="lazy"
    />

    <div class="container detail-page__content">
      <RouterLink class="detail-page__back" to="/">
        <ArrowLeft :size="18" aria-hidden="true" />Back to recipes
      </RouterLink>

      <template v-if="loading">
        <p class="visually-hidden" role="status">Loading recipe…</p>
        <div class="detail-skeleton" aria-hidden="true">
          <div class="detail-skeleton__image"></div>
          <div class="detail-skeleton__copy">
            <span></span><span></span><span></span><span></span>
          </div>
        </div>
        <div class="detail-skeleton__body" aria-hidden="true">
          <div><span></span><span></span><span></span><span></span></div>
          <div><span></span><span></span><span></span><span></span></div>
        </div>
      </template>

      <section
        v-else-if="error"
        class="detail-state"
        :role="error === 'request' ? 'alert' : undefined"
      >
        <h1>
          {{
            error === 'not-found'
              ? "This recipe isn't on the menu."
              : "We couldn't load this recipe."
          }}
        </h1>
        <p>
          {{
            error === 'not-found'
              ? 'Try another recipe from Explore.'
              : 'The recipe service is unavailable. Please try again.'
          }}
        </p>
        <div class="detail-state__actions">
          <button
            v-if="error === 'request'"
            class="button button--primary"
            type="button"
            @click="loadRecipe(route.params.id)"
          >
            Try again
          </button>
          <RouterLink class="button button--secondary" to="/">Back to Explore</RouterLink>
        </div>
      </section>

      <template v-else-if="recipe">
        <article class="detail-hero">
          <div class="detail-hero__image">
            <img
              :src="recipe.image"
              :alt="`${recipe.name} prepared dish`"
              width="600"
              height="450"
            />
          </div>
          <div class="detail-hero__copy">
            <p class="detail-hero__cuisine">{{ recipe.cuisine }}</p>
            <h1>{{ recipe.name }}</h1>
            <p class="detail-hero__rating">
              <Star :size="20" aria-hidden="true" />
              <strong>{{ recipe.rating.toFixed(1) }}</strong> ({{ recipe.reviewCount }} reviews)
            </p>
            <dl class="detail-hero__facts">
              <div>
                <dt>Prep time</dt>
                <dd>{{ recipe.prepTimeMinutes }} min</dd>
              </div>
              <div>
                <dt>Cook time</dt>
                <dd>{{ recipe.cookTimeMinutes }} min</dd>
              </div>
              <div>
                <dt>Difficulty</dt>
                <dd>{{ recipe.difficulty }}</dd>
              </div>
              <div>
                <dt>Per serving</dt>
                <dd>{{ recipe.caloriesPerServing }} kcal</dd>
              </div>
              <div>
                <dt>Servings</dt>
                <dd>{{ recipe.servings }}</dd>
              </div>
              <div>
                <dt>Total time</dt>
                <dd>{{ recipe.prepTimeMinutes + recipe.cookTimeMinutes }} min</dd>
              </div>
            </dl>
            <button
              class="button detail-hero__save"
              :class="isSaved ? 'button--secondary' : 'button--primary'"
              type="button"
              :aria-label="`${isSaved ? 'Remove' : 'Add'} ${recipe.name} ${isSaved ? 'from' : 'to'} favorites`"
              :aria-pressed="isSaved"
              @click="toggleFavorite(recipe.id)"
            >
              <Heart :size="18" :fill="isSaved ? 'currentColor' : 'none'" aria-hidden="true" />
              {{ isSaved ? 'Saved' : 'Save recipe' }}
            </button>
          </div>
        </article>

        <div class="detail-body">
          <section class="detail-ingredients" aria-labelledby="ingredients-title">
            <div class="detail-section-heading">
              <h2 id="ingredients-title">Ingredients</h2>
              <p>{{ recipe.servings }} servings</p>
            </div>
            <ul>
              <li v-for="(ingredient, index) in recipe.ingredients" :key="index">
                <label
                  :class="{ 'detail-ingredients__checked': checkedIngredients.includes(index) }"
                >
                  <input v-model="checkedIngredients" type="checkbox" :value="index" />
                  <span>{{ ingredient }}</span>
                </label>
              </li>
            </ul>
            <button
              class="button button--secondary detail-ingredients__all"
              type="button"
              @click="toggleAllIngredients"
            >
              {{ allChecked ? 'Uncheck all' : 'Check all' }}
            </button>
          </section>

          <section class="detail-instructions" aria-labelledby="instructions-title">
            <h2 id="instructions-title">Instructions</h2>
            <ol>
              <li v-for="(instruction, index) in recipe.instructions" :key="index">
                <span class="detail-instructions__number" aria-hidden="true">{{
                  String(index + 1).padStart(2, '0')
                }}</span>
                <p>{{ instruction }}</p>
              </li>
            </ol>
          </section>
        </div>

        <section v-if="recipe.tags.length" class="detail-tags" aria-labelledby="tags-title">
          <h2 id="tags-title">Tags</h2>
          <ul>
            <li v-for="tag in recipe.tags" :key="tag" class="chip">{{ tag }}</li>
          </ul>
        </section>

        <section
          v-if="relatedRecipes.length"
          class="detail-related"
          aria-labelledby="related-title"
        >
          <div class="detail-related__heading">
            <h2 id="related-title">You may also like</h2>
            <RouterLink to="/"
              >Explore more recipes <ArrowRight :size="18" aria-hidden="true"
            /></RouterLink>
          </div>
          <div class="detail-related__grid">
            <RecipeCard v-for="item in relatedRecipes" :key="item.id" :recipe="item" />
          </div>
        </section>
      </template>
    </div>
  </main>
</template>

<style scoped lang="scss" src="../styles/recipe-detail.scss"></style>
