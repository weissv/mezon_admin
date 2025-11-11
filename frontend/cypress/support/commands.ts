/// <reference types="cypress" />

const BACKEND_URL = 'https://mezon-admin.onrender.com'
const TOKEN_STORAGE_KEY = 'auth_token'
const USER_STORAGE_KEY = 'auth_user'

Cypress.Commands.add('loginViaUI', (username: string, password: string) => {
  cy.session([username, password, 'ui'], () => {
    cy.visit('/auth/login')
    cy.get('input#login').clear().type(username)
    cy.get('input#password').clear().type(password, { log: false })
    cy.contains('button', /^Войти$/).click()
    cy.url().should('match', /\/dashboard$/)
    cy.contains('Дашборд', { timeout: 15000 }).should('be.visible')
    cy.window({ log: false }).then((win) => {
      const token = win.localStorage.getItem(TOKEN_STORAGE_KEY)
      if (token) {
        Cypress.env('authToken', token)
      }
      const storedUser = win.localStorage.getItem(USER_STORAGE_KEY)
      if (storedUser) {
        try {
          Cypress.env('authUser', JSON.parse(storedUser))
        } catch (error) {
          Cypress.env('authUser', null)
        }
      }
    })
  })
})

Cypress.Commands.add('loginViaAPI', (username: string, password: string) => {
  cy.session([username, password, 'api'], () => {
    cy.request({
      url: `${BACKEND_URL}/api/auth/login`,
      method: 'POST',
      body: { login: username, password },
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://erp.mezon.uz',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('user')
      const token = response.body?.token
      const user = response.body?.user
      if (token) {
        Cypress.env('authToken', token)
      }
      cy.visit('/', {
        onBeforeLoad(win) {
          if (token) {
            win.localStorage.setItem(TOKEN_STORAGE_KEY, token)
          }
          if (user) {
            win.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
          } else {
            win.localStorage.removeItem(USER_STORAGE_KEY)
          }
        },
      })
      cy.window({ log: false }).then((win) => {
        const stored = win.localStorage.getItem(TOKEN_STORAGE_KEY)
        if (token) {
          expect(stored, 'token saved to localStorage').to.eq(token)
        }
        if (user) {
          const storedUser = win.localStorage.getItem(USER_STORAGE_KEY)
          expect(storedUser, 'user saved to localStorage').to.be.a('string')
        }
        if (user) {
          const storedUser = win.localStorage.getItem(USER_STORAGE_KEY)
          expect(storedUser, 'user saved to localStorage').to.be.a('string')
        }
      })
    })
  })
})

Cypress.Commands.add('logoutViaUI', () => {
  cy.contains('button, a', /Выход|Logout/i).click({ force: true })
  cy.url().should('include', '/auth/login')
  cy.window({ log: false }).then((win) => {
    expect(win.localStorage.getItem(TOKEN_STORAGE_KEY)).to.be.null
    expect(win.localStorage.getItem(USER_STORAGE_KEY)).to.be.null
  })
  Cypress.env('authToken', null)
  Cypress.env('authUser', null)
})

declare global {
  namespace Cypress {
    interface Chainable {
      loginViaUI(username: string, password: string): Chainable<void>
      loginViaAPI(username: string, password: string): Chainable<void>
      logoutViaUI(): Chainable<void>
    }
  }
}

export {}
