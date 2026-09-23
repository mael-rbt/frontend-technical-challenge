<script setup lang="ts">
import { ArrowRight, Clock3, Star, UsersRound } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import type { Recipe } from '../types/recipe'

defineProps<{ recipe: Recipe }>()
</script>

<template>
  <section class="featured" aria-labelledby="featured-title">
    <div class="featured__image-wrap">
      <img :src="recipe.image" :alt="`${recipe.name} prepared dish`" width="600" height="400" />
    </div>

    <div class="featured__main">
      <p class="featured__eyebrow">Tonight's inspiration</p>
      <h2 id="featured-title">{{ recipe.name }}</h2>
      <p class="featured__ingredients">
        {{ recipe.ingredients.slice(0, 3).join(' · ') }}
      </p>
      <div class="featured__meta">
        <span>
          <Clock3 :size="17" :stroke-width="1.7" aria-hidden="true" />
          {{ recipe.prepTimeMinutes + recipe.cookTimeMinutes }} min
        </span>
        <span>{{ recipe.difficulty }}</span>
        <span>
          <Star :size="17" :stroke-width="1.7" aria-hidden="true" />
          {{ recipe.rating.toFixed(1) }} ({{ recipe.reviewCount }})
        </span>
      </div>
      <RouterLink class="button button--primary featured__action" :to="`/recipes/${recipe.id}`">
        View recipe <ArrowRight :size="17" :stroke-width="1.7" aria-hidden="true" />
      </RouterLink>
    </div>

    <div class="featured__aside">
      <h3>At a glance</h3>
      <div class="featured__fact">
        <Clock3 :size="25" :stroke-width="1.5" aria-hidden="true" />
        <p>
          <strong>{{ recipe.prepTimeMinutes + recipe.cookTimeMinutes }} minutes</strong
          ><span>Prep to plate</span>
        </p>
      </div>
      <div class="featured__fact">
        <UsersRound :size="25" :stroke-width="1.5" aria-hidden="true" />
        <p>
          <strong>{{ recipe.servings }} servings</strong><span>Made to share</span>
        </p>
      </div>
      <div class="featured__fact">
        <Star :size="25" :stroke-width="1.5" aria-hidden="true" />
        <p>
          <strong>{{ recipe.reviewCount }} reviews</strong
          ><span>Rated {{ recipe.rating.toFixed(1) }} out of 5</span>
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.featured {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 1.15fr) minmax(0, 0.8fr);
  align-items: stretch;
  gap: clamp(1.2rem, 2.6vw, 2.5rem);
  padding: 1rem;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  background: rgb(255 253 252 / 76%);
}

.featured__image-wrap {
  min-height: 15rem;
  overflow: hidden;
  border-radius: 0.6rem;
  background: var(--color-accent-soft);
}

.featured__image-wrap img {
  display: block;
  width: 100%;
  height: 100%;
  aspect-ratio: 3 / 2;
  object-fit: cover;
}

.featured__main {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  padding-block: 0.5rem;
}

.featured__eyebrow,
.featured__aside h3 {
  margin: 0;
  font-size: 0.67rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.featured h2 {
  margin: 0.4rem 0 0;
  font-family: var(--font-display);
  font-size: clamp(1.8rem, 2.5vw, 2.5rem);
  font-weight: 400;
  line-height: 1.08;
}

.featured__ingredients {
  display: -webkit-box;
  overflow: hidden;
  margin: 0.6rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.86rem;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.featured__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  margin-top: 1rem;
  font-size: 0.8rem;
}

.featured__meta span {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  white-space: nowrap;
}

.featured__meta span:last-child svg {
  color: var(--color-gold);
  fill: var(--color-gold);
}

.featured__action {
  align-self: flex-start;
  gap: 0.75rem;
  margin-top: 1.1rem;
  text-decoration: none;
}

.featured__aside {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1rem;
  padding: 0.6rem 0 0.6rem clamp(1.2rem, 2.5vw, 2rem);
  border-left: 1px solid var(--color-border);
}

.featured__fact {
  display: flex;
  align-items: center;
  gap: 0.9rem;
}

.featured__fact svg {
  flex: 0 0 auto;
  color: var(--color-olive);
}

.featured__fact p {
  margin: 0;
}

.featured__fact strong,
.featured__fact span {
  display: block;
}

.featured__fact strong {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 400;
}

.featured__fact span {
  color: var(--color-text-muted);
  font-size: 0.72rem;
}

@media (max-width: 1000px) {
  .featured {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
  }

  .featured__aside {
    grid-column: 1 / -1;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-between;
    padding: 1rem 0 0;
    border-top: 1px solid var(--color-border);
    border-left: 0;
  }

  .featured__aside h3 {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .featured {
    grid-template-columns: 1fr;
    gap: 1.2rem;
  }

  .featured__image-wrap {
    min-height: 0;
  }

  .featured__main {
    padding-inline: 0.2rem;
  }

  .featured__aside {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.8rem;
    padding-inline: 0.2rem;
  }

  .featured__fact {
    width: 100%;
  }
}
</style>
