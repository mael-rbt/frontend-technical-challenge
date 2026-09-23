<script setup lang="ts">
import { Heart } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import * as m from '../paraglide/messages.js'
import { getLocale, setLocale, toLocale } from '../paraglide/runtime.js'

const currentLocale = getLocale()

function changeLocale(event: Event) {
  const locale = toLocale((event.target as HTMLSelectElement).value)
  if (locale && locale !== getLocale()) void setLocale(locale)
}
</script>

<template>
  <header class="site-header">
    <div class="container site-header__inner">
      <RouterLink class="brand" to="/">
        <span class="brand__name">Mise</span>
        <span class="brand__tagline"
          >{{ m.brand_tagline_top() }}<br />{{ m.brand_tagline_bottom() }}</span
        >
      </RouterLink>

      <div class="site-header__actions">
        <nav class="site-nav" :aria-label="m.nav_main_label()">
          <RouterLink class="site-nav__link" to="/">{{ m.nav_explore() }}</RouterLink>
          <RouterLink class="site-nav__link" to="/saved">
            {{ m.nav_saved() }}
            <Heart :size="21" :stroke-width="1.7" aria-hidden="true" />
          </RouterLink>
        </nav>
        <label class="visually-hidden" for="language-select">{{ m.language_label() }}</label>
        <select
          id="language-select"
          class="language-select"
          :value="currentLocale"
          @change="changeLocale"
        >
          <option value="en">EN</option>
          <option value="de">DE</option>
          <option value="fr">FR</option>
        </select>
      </div>
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
  min-height: 2.75rem;
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

.site-header__actions {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.language-select {
  min-width: 3.75rem;
  min-height: 2.75rem;
  padding: 0.35rem 0.4rem;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  font-size: 0.8rem;
  cursor: pointer;
}

.site-nav__link {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  min-height: 2.75rem;
  color: var(--color-text);
  white-space: nowrap;
  border-bottom: 2px solid transparent;
  text-decoration: none;

  &:hover,
  &.router-link-exact-active {
    border-bottom-color: var(--color-accent);
  }
}

.site-nav__link svg {
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
    gap: 0.65rem;
    font-size: 0.875rem;
  }

  .site-header__actions {
    gap: 0.65rem;
  }

  .site-nav__link {
    gap: 0.45rem;
  }
}

@media (max-width: 359px) {
  .site-header__inner {
    flex-direction: column;
    align-items: stretch;
    padding-block: 0.35rem;
  }

  .site-header__actions {
    justify-content: space-between;
  }
}
</style>
