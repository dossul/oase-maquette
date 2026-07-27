import { expect, type Page, type APIRequestContext } from '@playwright/test'

/**
 * Helpers pour les tests de RECETTE contre le backend RÉEL.
 * Prérequis : frontend http://localhost:5173 + backend http://localhost:3000 démarrés,
 * base locale seedée (comptes de docs/CREDENTIALS.md, mot de passe unique Oase@2026!).
 */

export const API = process.env.TEST_API_URL || 'http://localhost:3001/api/v1'
export const PASSWORD = 'Oase@2026!'
export const PIN = '123456'

export const USERS = {
  p1: { email: 'kossiwa.amele@texlome.tg', role: 'contribuable', dashboard: /\/portail\/dashboard/ },
  p1b: { email: 'amouzou.kossi@togo-farms.tg', role: 'contribuable', dashboard: /\/portail\/dashboard/ },
  p2_ci: { email: 'fatima.ouattara@otr.tg', role: 'agent_ci', dashboard: /\/backoffice/ },
  p2_cddi: { email: 'agent.cddi@oase.tg', role: 'agent_cddi', dashboard: /\/backoffice/ },
  p2_dgbf: { email: 'agent.dgbf@oase.tg', role: 'agent_dgbf', dashboard: /\/backoffice/ },
  p2_dgtcp: { email: 'agent.dgtcp@oase.tg', role: 'agent_dgtcp', dashboard: /\/backoffice/ },
  p3: { email: 'komlan.kodjo@api.tg', role: 'agent_agence', dashboard: /\/agence|\/agences/ },
  p4: { email: 'amevi.koffi@mef.tg', role: 'decideur', dashboard: /\/decideur|\/deciseur/ },
  p5: { email: 'paul.adjovi@igf.tg', role: 'auditeur', dashboard: /\/audit/ },
  p7: { email: 'kossi.sewavi@dgtcp.tg', role: 'admin_si', dashboard: /\/admin/ },
} as const

export type PersonaKey = keyof typeof USERS

/** Login réel via l'API (setup de précondition). Retourne le access_token. */
export async function apiLogin(request: APIRequestContext, email: string, password = PASSWORD): Promise<string> {
  const res = await request.post(`${API}/auth/login`, { data: { email, password } })
  expect(res.status(), `login API ${email}`).toBe(200)
  const body = await res.json()
  return body.access_token as string
}

/** Helper API authentifié : GET/POST/PATCH avec Bearer token. */
export function api(request: APIRequestContext, token: string) {
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  return {
    get: (path: string) => request.get(`${API}${path}`, { headers }),
    post: (path: string, data?: unknown) => request.post(`${API}${path}`, { headers, data }),
    patch: (path: string, data?: unknown) => request.patch(`${API}${path}`, { headers, data }),
  }
}

/** Login réel via le formulaire UI /login. Attend la redirection hors /login. */
export async function login(page: Page, email: string, password = PASSWORD) {
  await page.goto('/login')
  await page.evaluate(() => localStorage.clear())
  await page.goto('/login')

  const emailField = page.getByRole('textbox', { name: /Identifiant|E-mail|Email/i })
  const passwordField = page.getByRole('textbox', { name: /Mot de passe/i })
  await emailField.fill(email)
  await passwordField.fill(password)

  const loginResponse = page.waitForResponse(
    (r) => r.url().includes('/api/v1/auth/login') && r.request().method() === 'POST',
  )
  await page.getByRole('button', { name: /Se connecter/i }).click()
  const res = await loginResponse
  expect(res.status(), `login UI ${email}`).toBe(200)

  // Redirection vers le dashboard par défaut du rôle (hors /login).
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 })
}

/** Login UI par persona. */
export async function loginAs(page: Page, persona: PersonaKey) {
  await login(page, USERS[persona].email)
}

/** Injecte une session directement en localStorage (plus rapide pour les préconditions). */
export async function injectSession(page: Page, request: APIRequestContext, email: string) {
  const token = await apiLogin(request, email)
  const me = await api(request, token).get('/utilisateurs/me')
  const user = me.ok() ? await me.json() : null
  await page.goto('/login')
  await page.evaluate(
    ([t, u]) => {
      localStorage.setItem('oase_token', t as string)
      if (u) localStorage.setItem('oase_user', JSON.stringify(u))
    },
    [token, user],
  )
  return token
}

/** S'assure que le PIN de signature est positionné pour le compte (idempotent). */
export async function ensurePin(request: APIRequestContext, token: string) {
  const client = api(request, token)
  const check = await client.post('/auth/verify-pin', { pin: PIN })
  if (check.ok()) {
    const body = await check.json().catch(() => ({}))
    if (body?.valid === true || body === true) return
  }
  await client.post('/auth/pin/set', { pin: PIN, pin_confirmation: PIN, confirmation: PIN })
}

/** Collecte les erreurs console critiques d'une page. */
export function watchConsoleErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', (err) => errors.push(String(err)))
  return errors
}
