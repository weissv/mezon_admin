/// <reference types="cypress" />

type UsersFixture = {
  valid: { username: string; password: string }
  director: { username: string; password: string }
}

describe('Authentication & Session Management', () => {
  let users: UsersFixture

  before(() => {
    cy.fixture<UsersFixture>('users').then((data) => {
      users = data
    })
  })

  beforeEach(() => {
    cy.clearCookies({ log: false })
    cy.clearLocalStorage({ log: false })
  })

  it('1.1 Fails to login with wrong password', () => {
    cy.visit('/auth/login')
    cy.contains('Вход в систему', { timeout: 15000 }).should('be.visible')
    cy.get('input#login', { timeout: 15000 }).type(users.valid.username)
    cy.get('input#password').type('wrong_password', { log: false })
    cy.intercept('POST', '**/api/auth/login').as('loginRequest')
    cy.contains('button', /^Войти$/).click()

    cy.url().should('include', '/auth/login')
    cy.wait('@loginRequest').its('response.statusCode').should('eq', 401)
    cy.window().then((win) => {
      expect(win.localStorage.getItem('auth_token')).to.be.null
    })
  })

  it('1.2 Fails to login with unknown user', () => {
    cy.visit('/auth/login')
    cy.contains('Вход в систему', { timeout: 15000 }).should('be.visible')
    cy.get('input#login', { timeout: 15000 }).type('nonexistent@user.com')
    cy.get('input#password').type(users.valid.password, { log: false })
    cy.intercept('POST', '**/api/auth/login').as('loginRequest')
    cy.contains('button', /^Войти$/).click()

    cy.url().should('include', '/auth/login')
    cy.wait('@loginRequest').its('response.statusCode').should('eq', 401)
    cy.window().then((win) => {
      expect(win.localStorage.getItem('auth_token')).to.be.null
    })
  })

  it('1.3 Logs in successfully', () => {
    cy.visit('/auth/login')
    cy.contains('Вход в систему', { timeout: 15000 }).should('be.visible')
    cy.get('input#login', { timeout: 15000 }).type(users.valid.username)
    cy.get('input#password').type(users.valid.password, { log: false })
    cy.contains('button', /^Войти$/).click()

    cy.url().should('match', /\/dashboard$/)
    cy.contains('Дашборд').should('be.visible')
    cy.window().then((win) => {
      const token = win.localStorage.getItem('auth_token')
      expect(token, 'persisted auth token').to.be.a('string').and.not.be.empty
    })
  })

  it('1.4 Blocks access to protected routes when unauthenticated', () => {
    cy.visit('/dashboard', { failOnStatusCode: false })
    cy.url().should('include', '/auth/login')
  })

  it('1.5 Persists session after reload', () => {
    cy.loginViaAPI(users.valid.username, users.valid.password)

  cy.visit('/dashboard')
  cy.contains('Дашборд', { timeout: 20000 }).should('be.visible')
    cy.reload()
    cy.url().should('match', /\/dashboard$/)
  cy.contains('Дашборд', { timeout: 20000 }).should('be.visible')
  })

  it('1.6 Logs out and invalidates session', () => {
    cy.loginViaAPI(users.valid.username, users.valid.password)

  cy.visit('/dashboard')
  cy.contains('Дашборд', { timeout: 20000 }).should('be.visible')
    cy.logoutViaUI()

    cy.visit('/dashboard', { failOnStatusCode: false })
    cy.url().should('include', '/auth/login')
    cy.window().then((win) => {
      expect(win.localStorage.getItem('auth_token')).to.be.null
    })
  })
})

export {}
