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

    for (const width of [320, 375, 768, 1024, 1440]) {
      cy.viewport(width, 900)
      cy.window().its('innerWidth').should('eq', width)
      cy.document().then((document) => {
        expect(document.documentElement.scrollWidth).to.be.at.most(width)
      })
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
    cy.contains('h2', "We couldn't load the recipes.").should('be.visible')
    cy.contains('button', 'Try again').click()
    cy.wait('@recipes')
    cy.contains('h2', 'Nothing on the menu yet.').should('be.visible')
  })
})
