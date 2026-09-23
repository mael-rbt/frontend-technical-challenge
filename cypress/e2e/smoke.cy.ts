describe('Explore page', () => {
  it('opens the root route', () => {
    cy.visit('/', {
      onBeforeLoad(window) {
        cy.stub(window.console, 'error').as('consoleError')
      },
    })
    cy.get('h1')
      .should('be.visible')
      .and('contain.text', 'What are you')
      .and('contain.text', 'hungry for?')
    cy.get('@consoleError').should('not.have.been.called')
  })

  it('keeps the shell within responsive viewports', () => {
    cy.visit('/')
    cy.get('.recipe-card').should('have.length', 12)

    for (const width of [320, 375, 768, 1024, 1440]) {
      cy.viewport(width, 900)
      cy.window().its('innerWidth').should('eq', width)
      cy.document().then((document) => {
        expect(document.documentElement.scrollWidth).to.be.at.most(
          document.documentElement.clientWidth,
        )
      })
      if (width <= 375) {
        cy.get('.discover__filter-panel summary').click()
        cy.get('.discover__filter-options').then(($panel) => {
          const bounds = $panel[0]!.getBoundingClientRect()
          expect(bounds.left).to.be.at.least(0)
          expect(bounds.right).to.be.at.most($panel[0]!.ownerDocument.documentElement.clientWidth)
        })
        cy.get('.discover__filter-panel summary').click()
      }
    }
  })

  it('recovers from a recipe request failure', () => {
    let attempts = 0
    cy.intercept('GET', 'https://dummyjson.com/recipes?limit=12&skip=0', (request) => {
      attempts += 1
      if (attempts === 1) {
        request.reply({ statusCode: 503, body: {} })
      } else {
        request.reply({ statusCode: 200, body: { recipes: [], total: 0, skip: 0, limit: 12 } })
      }
    }).as('recipes')

    cy.visit('/')
    cy.wait('@recipes')
    cy.contains('h3', "We couldn't load the recipes.").should('be.visible')
    cy.contains('button', 'Try again').click()
    cy.wait('@recipes')
    cy.contains('h3', 'Nothing on the menu.').should('be.visible')
  })

  it('sends one search request after typing pauses', () => {
    cy.intercept('GET', 'https://dummyjson.com/recipes/search*', (request) => {
      expect(new URL(request.url).searchParams.get('q')).to.eq('ramen')
      request.reply({
        recipes: [
          {
            id: 26,
            name: 'Japanese Ramen Soup',
            image: 'https://cdn.dummyjson.com/recipe-images/26.webp',
            cuisine: 'Japanese',
            prepTimeMinutes: 20,
            cookTimeMinutes: 25,
            rating: 4.9,
            reviewCount: 38,
          },
        ],
        total: 1,
        skip: 0,
        limit: 12,
      })
    }).as('search')

    cy.visit('/')
    cy.get('#recipe-search').type('ramen', { delay: 30 })
    cy.wait('@search')
    cy.get('@search.all').should('have.length', 1)
    cy.contains('1 recipe').should('be.visible')
    cy.contains('.recipe-card', 'Japanese Ramen Soup').should('be.visible')
  })

  it('opens a recipe from Explore and navigates to a related recipe', () => {
    cy.visit('/')
    cy.contains('.recipe-card', 'Classic Margherita Pizza').find('a').click()
    cy.url().should('include', '/recipes/1')
    cy.get('h1').should('contain.text', 'Classic Margherita Pizza')
    cy.get('.detail-ingredients input').first().check().should('be.checked')
    cy.get('.detail-related .recipe-card').first().find('a').click()
    cy.url().should('match', /\/recipes\/\d+$/)
    cy.get('h1').should('not.contain.text', 'Classic Margherita Pizza')
    cy.get('.detail-page__back').click()
    cy.get('h1').should('contain.text', 'What are you')
    cy.get('.featured__action').click()
    cy.url().should('include', '/recipes/1')
  })

  it('offers retry when a detail request fails', () => {
    let attempts = 0
    cy.intercept('GET', 'https://dummyjson.com/recipes/1', (request) => {
      attempts += 1
      if (attempts === 1) request.reply({ statusCode: 503, body: { message: 'Unavailable' } })
      else request.continue()
    }).as('detail')
    cy.visit('/recipes/1')
    cy.wait('@detail')
    cy.contains("We couldn't load this recipe.").should('be.visible')
    cy.contains('button', 'Try again').click()
    cy.wait('@detail')
    cy.get('h1').should('contain.text', 'Classic Margherita Pizza')
    cy.then(() => expect(attempts).to.eq(2))
  })

  it('saves a recipe, restores it after refresh, and removes it from Saved', () => {
    cy.clearLocalStorage('mise:favorites')
    cy.visit('/')
    cy.contains('.recipe-card', 'Classic Margherita Pizza')
      .find('.recipe-card__save')
      .click()
      .should('have.attr', 'aria-pressed', 'true')
    cy.window().then((window) => {
      expect(window.localStorage.getItem('mise:favorites')).to.eq('[1]')
    })
    cy.get('.site-nav').contains('Saved').click()
    cy.url().should('include', '/saved')
    cy.contains('.recipe-card', 'Classic Margherita Pizza').should('be.visible')
    cy.reload()
    cy.contains('.recipe-card', 'Classic Margherita Pizza').should('be.visible')
    cy.get('.recipe-card__save').click()
    cy.contains('Nothing saved yet.').should('be.visible')
    cy.window().then((window) => {
      expect(window.localStorage.getItem('mise:favorites')).to.eq('[]')
    })
  })

  it('opens Saved safely with corrupted browser storage', () => {
    cy.visit('/saved', {
      onBeforeLoad(window) {
        window.localStorage.setItem('mise:favorites', '{broken')
      },
    })
    cy.contains('Nothing saved yet.').should('be.visible')
  })
})
