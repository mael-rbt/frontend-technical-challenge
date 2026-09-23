import type { Recipe } from './types/recipe'

function setMeta(selector: string, content: string) {
  document.querySelector<HTMLMetaElement>(selector)?.setAttribute('content', content)
}

function setImageMeta(attribute: 'name' | 'property', key: string, image?: string) {
  const existing = document.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`)
  if (!image) {
    existing?.remove()
    return
  }
  const meta = existing ?? document.createElement('meta')
  if (!existing) {
    meta.setAttribute(attribute, key)
    document.head.append(meta)
  }
  meta.content = image
}

export function setPageMetadata(title: string, description: string, image?: string) {
  document.title = title
  setMeta('meta[name="description"]', description)
  setMeta('meta[property="og:title"]', title)
  setMeta('meta[property="og:description"]', description)
  setMeta('meta[name="twitter:title"]', title)
  setMeta('meta[name="twitter:description"]', description)
  document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute(
    'href',
    window.location.origin + window.location.pathname,
  )

  setImageMeta('property', 'og:image', image)
  setImageMeta('name', 'twitter:image', image)
  setMeta('meta[name="twitter:card"]', image ? 'summary_large_image' : 'summary')
}

export function setRecipeStructuredData(recipe: Recipe | null) {
  document.getElementById('recipe-structured-data')?.remove()
  if (!recipe) return

  const script = document.createElement('script')
  script.id = 'recipe-structured-data'
  script.type = 'application/ld+json'
  script.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.name,
    image: recipe.image,
    recipeIngredient: recipe.ingredients,
    recipeInstructions: recipe.instructions,
    prepTime: `PT${recipe.prepTimeMinutes}M`,
    cookTime: `PT${recipe.cookTimeMinutes}M`,
    recipeYield: String(recipe.servings),
    recipeCuisine: recipe.cuisine,
    keywords: recipe.tags.join(', '),
    ...(recipe.reviewCount > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: recipe.rating,
            reviewCount: recipe.reviewCount,
            bestRating: 5,
          },
        }
      : {}),
  })
  document.head.append(script)
}
