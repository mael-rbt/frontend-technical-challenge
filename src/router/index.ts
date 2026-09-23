import { createRouter, createWebHistory } from 'vue-router'
import ExploreView from '../views/ExploreView.vue'
import RecipeDetailView from '../views/RecipeDetailView.vue'
import SavedView from '../views/SavedView.vue'
import { setPageMetadata } from '../metadata'
import * as m from '../paraglide/messages.js'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: ExploreView },
    { path: '/recipes/:id', component: RecipeDetailView },
    { path: '/saved', component: SavedView },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

router.afterEach((to) => {
  if (to.path === '/saved') {
    setPageMetadata(`${m.saved_title()} | Mise`, m.saved_subtitle())
    return
  }
  if (to.path.startsWith('/recipes/')) {
    setPageMetadata(`${m.meta_recipe_page_title()} | Mise`, m.meta_description())
    return
  }
  setPageMetadata(`${m.nav_explore()} | Mise`, m.meta_description())
})

export default router
