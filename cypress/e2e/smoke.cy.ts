describe('application shell', () => {
  it('opens the root route', () => {
    cy.visit('/', {
      onBeforeLoad(window) {
        cy.stub(window.console, 'error').as('consoleError')
      },
    })
    cy.contains('h1', 'What are you hungry for?').should('be.visible')
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
})
