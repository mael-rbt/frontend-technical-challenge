import { createRouter, createWebHistory } from 'vue-router'
import ExploreView from '../views/ExploreView.vue'
import RecipeDetailView from '../views/RecipeDetailView.vue'

export default createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: ExploreView },
    { path: '/recipes/:id', component: RecipeDetailView },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})
