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
})
