<script setup lang="ts">
import { Clock3, Star } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import type { Recipe } from '../types/recipe'

defineProps<{ recipe: Recipe }>()
</script>

<template>
  <article class="recipe-card">
    <RouterLink class="recipe-card__link" :to="`/recipes/${recipe.id}`">
      <div class="recipe-card__image-wrap">
        <img
          :src="recipe.image"
          :alt="`${recipe.name} prepared dish`"
          width="400"
          height="300"
          loading="lazy"
        />
      </div>
      <div class="recipe-card__content">
        <p class="recipe-card__cuisine">{{ recipe.cuisine }}</p>
        <h3>{{ recipe.name }}</h3>
        <div class="recipe-card__meta">
          <span>
            <Clock3 :size="15" :stroke-width="1.7" aria-hidden="true" />
            {{ recipe.prepTimeMinutes + recipe.cookTimeMinutes }} min
          </span>
          <span>
            <Star :size="15" :stroke-width="1.7" aria-hidden="true" />
            {{ recipe.rating.toFixed(1) }} ({{ recipe.reviewCount }})
          </span>
        </div>
      </div>
    </RouterLink>
  </article>
</template>

<style scoped lang="scss">
.recipe-card {
  min-width: 0;
  overflow: hidden;
  border-radius: var(--radius-sm);
  background: var(--color-surface);
}

.recipe-card__link {
  display: block;
  height: 100%;
  color: inherit;
  text-decoration: none;
}

.recipe-card__link:hover h3 {
  color: var(--color-accent);
}

.recipe-card__image-wrap {
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: var(--color-accent-soft);
}

.recipe-card img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.recipe-card__content {
  padding: 0.75rem 0.85rem 0.9rem;
}

.recipe-card__cuisine {
  margin: 0 0 0.2rem;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  line-height: 1.2;
  text-transform: uppercase;
}

.recipe-card h3 {
  min-height: 2.5em;
  margin: 0;
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.22;
}

.recipe-card__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.35rem 0.5rem;
  margin-top: 0.75rem;
  color: var(--color-text-muted);
  font-size: 0.72rem;
}

.recipe-card__meta span {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  white-space: nowrap;
}

.recipe-card__meta span:last-child svg {
  color: var(--color-gold);
  fill: var(--color-gold);
}

@media (min-width: 640px) and (max-width: 1199px) {
  .recipe-card h3 {
    font-size: 1.15rem;
  }
}

@media (max-width: 639px) {
  .recipe-card h3 {
    min-height: 0;
    font-size: 1.25rem;
  }

  .recipe-card__meta {
    font-size: 0.82rem;
  }
}
</style>
