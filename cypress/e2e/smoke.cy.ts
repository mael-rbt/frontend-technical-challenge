describe('bootstrap', () => {
  it('opens the root route', () => {
    cy.visit('/', {
      onBeforeLoad(window) {
        cy.stub(window.console, 'error').as('consoleError')
      },
    })
    cy.contains('h1', 'Frontend challenge').should('be.visible')
    cy.get('@consoleError').should('not.have.been.called')
  })
})
