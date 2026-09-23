import type { Recipe, RecipesResponse } from '../../src/types/recipe'

const pizza: Recipe = {
  id: 1,
  name: 'Classic Margherita Pizza',
  ingredients: ['Pizza dough', 'Tomato sauce', 'Fresh mozzarella'],
  instructions: ['Spread the sauce.', 'Bake the pizza.'],
  prepTimeMinutes: 20,
  cookTimeMinutes: 15,
  servings: 4,
  difficulty: 'Easy',
  cuisine: 'Italian',
  caloriesPerServing: 300,
  tags: ['Italian', 'Pizza'],
  userId: 166,
  image: 'https://cdn.dummyjson.com/recipe-images/1.webp',
  rating: 4.6,
  reviewCount: 98,
  mealType: ['Dinner'],
}

const pasta: Recipe = {
  ...pizza,
  id: 4,
  name: 'Chicken Alfredo Pasta',
  ingredients: ['Fettuccine pasta', 'Chicken breast', 'Alfredo sauce'],
  instructions: ['Cook the pasta and chicken, then coat with Alfredo sauce.'],
  image: 'https://cdn.dummyjson.com/recipe-images/4.webp',
}

const ramen: Recipe = {
  ...pizza,
  id: 16,
  name: 'Japanese Ramen Soup',
  cuisine: 'Japanese',
  tags: ['Japanese', 'Soup'],
  mealType: ['Lunch'],
  image: 'https://cdn.dummyjson.com/recipe-images/16.webp',
}

const explorePage: RecipesResponse = {
  recipes: [pizza, pasta],
  total: 2,
  skip: 0,
  limit: 12,
}

function interceptExplore() {
  cy.intercept('GET', 'https://dummyjson.com/recipes?*', explorePage).as('recipes')
  cy.intercept('GET', 'https://dummyjson.com/recipes/1', pizza).as('pizza')
}

function visitInEnglish() {
  cy.visit('/', {
    onBeforeLoad(window) {
      window.localStorage.setItem('PARAGLIDE_LOCALE', 'en')
    },
  })
}

describe('Core recipe journeys', () => {
  it('loads Explore and its featured recipe on mobile', () => {
    cy.viewport(375, 667)
    interceptExplore()
    visitInEnglish()
    cy.wait(['@recipes', '@pizza'])

    cy.get('h1').should('contain.text', 'What are you')
    cy.title().should('eq', 'Explore | Mise')
    cy.get('head link[rel="icon"]').should('have.attr', 'href', '/favicon.svg')
    cy.contains('.recipe-card', pizza.name).should('be.visible')
    cy.get('.recipe-card').should('have.length', 2)
    cy.get('#featured-title').should('contain.text', pizza.name)
    cy.document().then((document) => {
      expect(document.documentElement.scrollWidth).to.be.at.most(
        document.documentElement.clientWidth,
      )
    })
  })

  it('shows the initial skeleton and keeps search below the sticky header', () => {
    cy.viewport(1280, 550)
    cy.intercept('GET', 'https://dummyjson.com/recipes?*', {
      delay: 800,
      body: explorePage,
    }).as('delayedRecipes')
    cy.intercept('GET', 'https://dummyjson.com/recipes/1', pizza).as('pizza')
    visitInEnglish()
    cy.get('.recipe-skeleton').should('have.length', 6)
    cy.wait(['@delayedRecipes', '@pizza'])
    cy.get('.recipe-skeleton').should('not.exist')
    cy.contains('.recipe-card', pizza.name).should('be.visible')

    cy.scrollTo(0, 450)
    cy.get('.site-header').then(($header) => {
      const headerBottom = $header[0]!.getBoundingClientRect().bottom
      cy.get('.discovery-sticky').then(($search) => {
        expect($search[0]!.getBoundingClientRect().top).to.be.closeTo(headerBottom, 3)
      })
    })
  })

  it('removes entrance and skeleton motion when reduced motion is requested', () => {
    cy.then(() =>
      Cypress.automation('remote:debugger:protocol', {
        command: 'Emulation.setEmulatedMedia',
        params: { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] },
      }),
    )
    cy.intercept('GET', 'https://dummyjson.com/recipes?*', {
      delay: 600,
      body: explorePage,
    }).as('recipes')
    cy.intercept('GET', 'https://dummyjson.com/recipes/1', pizza).as('pizza')
    visitInEnglish()
    cy.window().should((window) => {
      expect(window.matchMedia('(prefers-reduced-motion: reduce)').matches).to.eq(true)
    })
    cy.get('.recipe-skeleton__image').should(($image) => {
      const image = $image[0]!
      expect(image.ownerDocument.defaultView!.getComputedStyle(image).animationName).to.eq('none')
    })
    cy.wait(['@recipes', '@pizza'])
    cy.get('.recipe-grid').should(($grid) => {
      const grid = $grid[0]!
      expect(grid.ownerDocument.defaultView!.getComputedStyle(grid).animationName).to.eq('none')
    })
    cy.then(() =>
      Cypress.automation('remote:debugger:protocol', {
        command: 'Emulation.setEmulatedMedia',
        params: { features: [{ name: 'prefers-reduced-motion', value: '' }] },
      }),
    )
  })

  it('searches, clears the search, and filters by meal type', () => {
    interceptExplore()
    cy.intercept('GET', 'https://dummyjson.com/recipes/search?*', (request) => {
      expect(new URL(request.url).searchParams.get('q')).to.eq('ramen')
      request.reply({ recipes: [ramen], total: 1, skip: 0, limit: 12 } satisfies RecipesResponse)
    }).as('search')
    cy.intercept('GET', 'https://dummyjson.com/recipes/meal-type/Breakfast?*', {
      recipes: [],
      total: 0,
      skip: 0,
      limit: 12,
    } satisfies RecipesResponse).as('breakfast')
    visitInEnglish()
    cy.wait(['@recipes', '@pizza'])

    cy.get('#recipe-search').type('  ramen  ')
    cy.wait('@search')
    cy.get('@search.all').should('have.length', 1)
    cy.contains('.recipe-card', ramen.name).should('be.visible')
    cy.contains('1 recipe').should('be.visible')

    cy.get('button[aria-label="Clear search"]').click()
    cy.wait('@recipes')
    cy.contains('.recipe-card', pizza.name).should('be.visible')

    cy.get('.hero__shortcuts').contains('button', 'Breakfast').click()
    cy.wait('@breakfast')
    cy.contains('Nothing on the menu.').should('be.visible')
    cy.contains('button', 'Clear filters').click()
    cy.wait('@recipes')
    cy.get('.recipe-card').should('have.length', 2)
  })

  it('opens a recipe, checks an ingredient, and follows a related recipe', () => {
    interceptExplore()
    cy.intercept('GET', 'https://dummyjson.com/recipes/4', pasta).as('pasta')
    cy.intercept('GET', 'https://dummyjson.com/recipes/tag/Italian?*', {
      recipes: [pizza, pasta],
      total: 2,
      skip: 0,
      limit: 4,
    } satisfies RecipesResponse).as('related')
    visitInEnglish()
    cy.wait(['@recipes', '@pizza'])

    cy.contains('.recipe-card', pizza.name).find('a').click()
    cy.wait('@pizza')
    cy.wait('@related')
    cy.url().should('include', '/recipes/1')
    cy.get('h1').should('contain.text', pizza.name)
    cy.title().should('eq', `${pizza.name} | Mise`)
    cy.get('head script#recipe-structured-data').should('have.length', 1)
    cy.contains('.detail-ingredients', 'Fresh mozzarella').should('be.visible')
    cy.contains('.detail-instructions', 'Bake the pizza.').should('be.visible')
    cy.get('.detail-ingredients input').first().check().should('be.checked')

    cy.contains('.detail-related .recipe-card', pasta.name).find('a').click()
    cy.wait('@pasta')
    cy.get('h1').should('contain.text', pasta.name)
    cy.title().should('eq', `${pasta.name} | Mise`)
    cy.get('head script#recipe-structured-data').should('have.length', 1)
  })

  it('keeps a favorite after reload and removes it from Saved', () => {
    interceptExplore()
    cy.visit('/', {
      onBeforeLoad(window) {
        window.localStorage.setItem('PARAGLIDE_LOCALE', 'en')
        window.localStorage.removeItem('mise:favorites')
      },
    })
    cy.wait(['@recipes', '@pizza'])
    cy.contains('.recipe-card', pizza.name)
      .find('button[aria-label="Add Classic Margherita Pizza to favorites"]')
      .click()
      .should('have.attr', 'aria-pressed', 'true')

    cy.contains('.site-nav a', 'Saved').click()
    cy.title().should('eq', 'Saved recipes | Mise')
    cy.get('head script#recipe-structured-data').should('not.exist')
    cy.wait('@pizza')
    cy.contains('.recipe-card', pizza.name).should('be.visible')
    cy.reload()
    cy.wait('@pizza')
    cy.contains('.recipe-card', pizza.name).should('be.visible')
    cy.contains('.recipe-card', pizza.name)
      .find('button[aria-label="Remove Classic Margherita Pizza from favorites"]')
      .click()
    cy.contains('Nothing saved yet.').should('be.visible')
  })

  it('shows an error and recovers when Explore is retried', () => {
    let attempts = 0
    cy.intercept('GET', 'https://dummyjson.com/recipes/1', pizza)
    cy.intercept('GET', 'https://dummyjson.com/recipes?*', (request) => {
      attempts += 1
      request.reply(
        attempts === 1 ? { statusCode: 503, body: {} } : { statusCode: 200, body: explorePage },
      )
    }).as('recipes')
    visitInEnglish()
    cy.wait('@recipes')
    cy.contains("We couldn't load the recipes.").should('be.visible')
    cy.contains('button', 'Try again').click()
    cy.wait('@recipes')
    cy.contains('.recipe-card', pizza.name).should('be.visible')
    cy.then(() => expect(attempts).to.eq(2))
  })

  it('keeps German across routes and reload, then switches to French', () => {
    interceptExplore()
    cy.intercept('GET', 'https://dummyjson.com/recipes/meal-type/Breakfast?*', {
      recipes: [],
      total: 0,
      skip: 0,
      limit: 12,
    } satisfies RecipesResponse).as('emptyBreakfast')
    cy.intercept('GET', 'https://dummyjson.com/recipes/tag/Italian?*', {
      recipes: [pizza],
      total: 1,
      skip: 0,
      limit: 4,
    } satisfies RecipesResponse)
    cy.visit('/', {
      onBeforeLoad(window) {
        window.localStorage.setItem('PARAGLIDE_LOCALE', 'en')
        window.localStorage.removeItem('mise:favorites')
      },
    })
    cy.wait(['@recipes', '@pizza'])
    cy.get('html').should('have.attr', 'lang', 'en')
    cy.get('h1').should('contain.text', 'What are you')

    cy.get('#language-select').select('de')
    cy.wait(['@recipes', '@pizza'])
    cy.get('html').should('have.attr', 'lang', 'de')
    cy.title().should('eq', 'Entdecken | Mise')
    cy.get('h1').should('contain.text', 'Worauf hast du')
    cy.get('.hero__shortcuts').contains('Frühstück').should('be.visible')
    cy.get('.hero__shortcuts').contains('button', 'Frühstück').click()
    cy.wait('@emptyBreakfast')
    cy.contains('Heute steht nichts auf der Karte.').should('be.visible')
    cy.contains('button', 'Filter zurücksetzen').click()
    cy.wait('@recipes')
    cy.contains('.recipe-card', pizza.name).find('a').click()
    cy.wait('@pizza')
    cy.get('h1').should('contain.text', pizza.name)
    cy.title().should('eq', `${pizza.name} | Mise`)
    cy.contains('.detail-ingredients h2', 'Zutaten').should('be.visible')
    cy.contains('.detail-ingredients', 'Pizza dough').should('be.visible')
    cy.contains('.detail-instructions', 'Bake the pizza.').should('be.visible')
    cy.contains('.site-nav a', 'Merkliste').click()
    cy.contains('Noch nichts gemerkt.').should('be.visible')
    cy.title().should('eq', 'Gemerkte Rezepte | Mise')
    cy.reload()
    cy.get('html').should('have.attr', 'lang', 'de')
    cy.contains('Noch nichts gemerkt.').should('be.visible')
    cy.window().its('localStorage').invoke('getItem', 'PARAGLIDE_LOCALE').should('eq', 'de')

    cy.get('#language-select').select('fr')
    cy.get('html').should('have.attr', 'lang', 'fr')
    cy.contains('Aucune recette enregistrée.').should('be.visible')
    cy.contains('.site-nav a', 'Explorer').click()
    cy.wait(['@recipes', '@pizza'])
    cy.get('h1').should('contain.text', 'Qu’est-ce qui vous')
    cy.title().should('eq', 'Explorer | Mise')

    cy.intercept(
      { method: 'GET', url: 'https://dummyjson.com/recipes?*', times: 1 },
      {
        statusCode: 503,
        body: {},
      },
    ).as('errorFr')
    cy.reload()
    cy.wait('@errorFr')
    cy.contains('Impossible de charger les recettes.').should('be.visible')
    cy.contains('button', 'Réessayer').click()
    cy.wait('@recipes')
    cy.contains('.recipe-card', pizza.name).should('be.visible')
  })
})
