<script setup lang="ts">
import { ref } from 'vue'
import { Search } from 'lucide-vue-next'
import tomatoCluster from '../assets/decor/tomato-cluster.png'
import basilCorner from '../assets/decor/basil-corner.png'

const previewNotice = ref(false)
</script>

<template>
  <main class="preview-page">
    <img
      class="preview-page__tomatoes"
      :src="tomatoCluster"
      width="1374"
      height="1145"
      alt=""
      aria-hidden="true"
    />
    <img
      class="preview-page__basil"
      :src="basilCorner"
      width="1335"
      height="1178"
      alt=""
      aria-hidden="true"
      loading="lazy"
    />

    <div class="container preview-page__content">
      <section class="hero" aria-labelledby="hero-title">
        <h1 id="hero-title">
          What are you<br />
          hungry for?
        </h1>
        <p>Discover something worth cooking tonight.</p>
      </section>

      <section class="specimen" aria-labelledby="specimen-title">
        <div class="specimen__intro">
          <h2 id="specimen-title">Design system preview</h2>
          <p>Visual samples for the next phase. No recipes or search are active yet.</p>
        </div>

        <div class="specimen__controls">
          <div class="specimen__buttons">
            <button class="button button--primary" type="button" @click="previewNotice = true">
              Primary action
            </button>
            <button class="button button--secondary" type="button" @click="previewNotice = true">
              Secondary action
            </button>
          </div>
          <p v-if="previewNotice" class="specimen__notice" role="status">
            These buttons are visual samples for now.
          </p>

          <div class="specimen__field">
            <label for="preview-search">Search field</label>
            <div class="search-field">
              <Search :size="19" :stroke-width="1.7" aria-hidden="true" />
              <input
                id="preview-search"
                type="search"
                placeholder="Search recipes, cuisines, ingredients..."
                aria-describedby="search-note"
              />
            </div>
            <p id="search-note" class="specimen__hint">
              Search becomes available in a later phase.
            </p>
          </div>

          <div class="specimen__field">
            <p class="specimen__field-label">Chips</p>
            <div class="specimen__chips">
              <span class="chip chip--active">Selected</span>
              <span class="chip">Unselected</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  </main>
</template>

<style scoped lang="scss">
.preview-page {
  position: relative;
  min-height: calc(100vh - 4.5rem);
  overflow: clip;
}

.preview-page__content {
  position: relative;
  z-index: 1;
}

.preview-page__tomatoes,
.preview-page__basil {
  position: absolute;
  height: auto;
  pointer-events: none;
  user-select: none;
}

.preview-page__tomatoes {
  top: -12rem;
  right: -16rem;
  width: min(53vw, 47rem);
}

.preview-page__basil {
  bottom: -8rem;
  left: -7rem;
  width: 31rem;
  opacity: 0.42;
}

.hero {
  max-width: 43rem;
  padding-block: clamp(5rem, 8vw, 7rem) 7rem;
}

.hero h1,
.specimen h2 {
  font-family: var(--font-display);
  font-weight: 400;
}

.hero h1 {
  margin: 0;
  font-size: clamp(2.75rem, 5vw, 4.5rem);
  letter-spacing: -0.025em;
  line-height: 1.01;
}

.hero p {
  margin: 1.25rem 0 0;
  color: var(--color-text-muted);
  font-size: clamp(1rem, 1.6vw, 1.25rem);
}

.specimen {
  display: grid;
  grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr);
  gap: clamp(2rem, 5vw, 5rem);
  padding-block: var(--space-xl) var(--space-2xl);
  border-top: 1px solid var(--color-border);
}

.specimen h2 {
  margin: 0;
  font-size: clamp(2rem, 3vw, 2.5rem);
  line-height: 1.1;
}

.specimen__intro p {
  max-width: 30ch;
  margin: var(--space-sm) 0 0;
  color: var(--color-text-muted);
}

.specimen__controls {
  display: grid;
  gap: var(--space-lg);
}

.specimen__buttons,
.specimen__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.specimen__notice,
.specimen__hint {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.82rem;
}

.specimen__notice {
  margin-top: calc(-1 * var(--space-md));
}

.specimen__field label,
.specimen__field-label {
  display: block;
  margin: 0 0 0.65rem;
  font-size: 0.82rem;
  font-weight: 600;
}

.search-field {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-height: 3.25rem;
  padding-inline: var(--space-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  background: var(--color-surface);
  color: var(--color-text-muted);

  &:focus-within {
    border-color: var(--color-accent);
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
  }
}

.search-field input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--color-text);

  &::placeholder {
    color: var(--color-text-muted);
  }
}

.specimen__hint {
  margin-top: 0.45rem;
}

@media (max-width: 1023px) {
  .preview-page__tomatoes {
    top: -6rem;
    right: -15rem;
    width: 33rem;
    opacity: 0.75;
  }

  .preview-page__basil {
    display: none;
  }
}

@media (max-width: 767px) {
  .preview-page__tomatoes {
    display: none;
  }

  .hero {
    padding-block: 4.5rem 5rem;
  }

  .specimen {
    grid-template-columns: 1fr;
    gap: var(--space-lg);
  }
}
</style>
