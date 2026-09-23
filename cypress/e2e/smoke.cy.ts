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

describe('Core recipe journeys', () => {
  it('loads Explore and its featured recipe on mobile', () => {
    cy.viewport(375, 667)
    interceptExplore()
    cy.visit('/')
    cy.wait(['@recipes', '@pizza'])

    cy.get('h1').should('contain.text', 'What are you')
    cy.contains('.recipe-card', pizza.name).should('be.visible')
    cy.get('.recipe-card').should('have.length', 2)
    cy.get('#featured-title').should('contain.text', pizza.name)
    cy.document().then((document) => {
      expect(document.documentElement.scrollWidth).to.be.at.most(
        document.documentElement.clientWidth,
      )
    })
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
    cy.visit('/')
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
    cy.visit('/')
    cy.wait(['@recipes', '@pizza'])

    cy.contains('.recipe-card', pizza.name).find('a').click()
    cy.wait('@pizza')
    cy.wait('@related')
    cy.url().should('include', '/recipes/1')
    cy.get('h1').should('contain.text', pizza.name)
    cy.contains('.detail-ingredients', 'Fresh mozzarella').should('be.visible')
    cy.contains('.detail-instructions', 'Bake the pizza.').should('be.visible')
    cy.get('.detail-ingredients input').first().check().should('be.checked')

    cy.contains('.detail-related .recipe-card', pasta.name).find('a').click()
    cy.wait('@pasta')
    cy.get('h1').should('contain.text', pasta.name)
  })

  it('keeps a favorite after reload and removes it from Saved', () => {
    interceptExplore()
    cy.visit('/', {
      onBeforeLoad(window) {
        window.localStorage.removeItem('mise:favorites')
      },
    })
    cy.wait(['@recipes', '@pizza'])
    cy.contains('.recipe-card', pizza.name)
      .find('button[aria-label="Add Classic Margherita Pizza to favorites"]')
      .click()
      .should('have.attr', 'aria-pressed', 'true')

    cy.contains('.site-nav a', 'Saved').click()
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
    cy.visit('/')
    cy.wait('@recipes')
    cy.contains("We couldn't load the recipes.").should('be.visible')
    cy.contains('button', 'Try again').click()
    cy.wait('@recipes')
    cy.contains('.recipe-card', pizza.name).should('be.visible')
    cy.then(() => expect(attempts).to.eq(2))
  })
})
