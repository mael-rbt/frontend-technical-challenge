<script setup lang="ts">
import { Heart } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
</script>

<template>
  <header class="site-header">
    <div class="container site-header__inner">
      <RouterLink class="brand" to="/">
        <span class="brand__name">Mise</span>
        <span class="brand__tagline">Good food<br />brighter days</span>
      </RouterLink>

      <nav class="site-nav" aria-label="Main navigation">
        <RouterLink class="site-nav__link" to="/" aria-current="page"> Explore </RouterLink>
        <span class="site-nav__coming-soon" title="Coming in a later phase">
          Saved<span class="visually-hidden"> (coming soon)</span>
          <Heart :size="21" :stroke-width="1.7" aria-hidden="true" />
        </span>
      </nav>
    </div>
  </header>
</template>

<style scoped lang="scss">
.site-header {
  position: relative;
  z-index: 2;
  background: var(--color-surface);
}

.site-header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  min-height: 4.5rem;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 1rem;
  color: var(--color-text);
  text-decoration: none;
  white-space: nowrap;
}

.brand__name {
  font-family: var(--font-display);
  font-size: 2.25rem;
  line-height: 1;
}

.brand__tagline {
  padding-left: 1rem;
  border-left: 1px solid var(--color-border-strong);
  font-size: 0.56rem;
  font-weight: 600;
  letter-spacing: 0.22em;
  line-height: 1.6;
  text-transform: uppercase;
}

.site-nav {
  display: flex;
  align-items: center;
  gap: 3rem;
  font-size: 0.95rem;
}

.site-nav__link,
.site-nav__coming-soon {
  display: inline-flex;
  align-items: center;
  min-height: 2.75rem;
  color: var(--color-text);
  white-space: nowrap;
}

.site-nav__link {
  border-bottom: 2px solid var(--color-accent);
  text-decoration: none;
}

.site-nav__coming-soon {
  gap: 0.75rem;
  color: var(--color-text-muted);
}

.site-nav__coming-soon svg {
  color: var(--color-accent);
}

@media (max-width: 640px) {
  .site-header__inner {
    min-height: 4rem;
  }

  .brand__tagline {
    display: none;
  }

  .site-nav {
    gap: 1.25rem;
    font-size: 0.875rem;
  }

  .site-nav__coming-soon {
    gap: 0.45rem;
  }
}
</style>
