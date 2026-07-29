import { test, expect, type Page } from '@playwright/test'
import { USERS, api, apiLogin, injectSession, watchConsoleErrors } from './helpers'

/**
 * NOTIFICATIONS — canal in-app RÉEL (création en base sur transitions, compteur, lecture).
 * Limites assumées à ce stade du projet : l'e-mail de notification est un log [MOCK EMAIL]
 * (pas de SMTP branché sur ce canal — seul le MFA email est réel), SMS/WhatsApp non implémentés.
 * Ce spec prouve tout ce qui EXISTE réellement : liste, compteur cohérent, marquage lu, page UI.
 */

interface Notif {
  id: string
  estLue: boolean
  titre: string
}

function watchApiErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('response', (res) => {
    if (res.url().includes('/api/') && res.status() >= 400) errors.push(`${res.request().method()} ${res.url()} → ${res.status()}`)
  })
  return errors
}

test.describe('Notifications — canal in-app réel', () => {
  test('API — liste, compteur cohérent avec la base, marquage lu décrémente', async ({ request }) => {
    // P1B (TOGOFARMS) est le compte qui a réellement reçu des notifications en base
    // (ses demandes ont transité vers Approuvé — vérifié en base le 28/07/2026 :
    // 24 notifications dont 24 non lues ; P1/TEXLOME n'en a aucune à ce stade).
    const token = await apiLogin(request, USERS.p1b.email)
    const client = api(request, token)

    const liste = await client.get('/notifications')
    expect(liste.status(), 'GET /notifications').toBe(200)
    const notifs = (await liste.json()) as Notif[]
    expect(Array.isArray(notifs)).toBe(true)
    expect(notifs.length, 'P1B a reçu des notifications lors des transitions de la recette').toBeGreaterThan(0)

    // Le compteur doit refléter EXACTEMENT le nombre de non lues en base
    const nonLues = notifs.filter((n) => n.estLue === false).length
    const compteur = await client.get('/notifications/unread-count')
    expect(compteur.status()).toBe(200)
    const { count } = await compteur.json()
    expect(count, 'unread-count doit égaler le nombre réel de notifications non lues').toBe(nonLues)

    // Marquer une non lue → compteur décrémenté d'exactement 1
    if (nonLues > 0) {
      const cible = notifs.find((n) => n.estLue === false)!
      const lue = await client.patch(`/notifications/${cible.id}/lue`)
      expect([200, 204], 'PATCH /notifications/:id/lue').toContain(lue.status())
      const apres = await client.get('/notifications/unread-count')
      const { count: countApres } = await apres.json()
      expect(countApres, 'le compteur doit baisser de 1 après lecture').toBe(count - 1)
    }

    // Isolation : un autre utilisateur ne peut pas marquer les notifications de P1B
    if (notifs.length > 0) {
      const tokenAutre = await apiLogin(request, USERS.p1.email)
      const intrus = await api(request, tokenAutre).patch(`/notifications/${notifs[0].id}/lue`)
      expect([404, 403], 'pas de lecture croisée entre utilisateurs').toContain(intrus.status())
    }
  })

  test('UI — page Centre de notifications sans erreur', async ({ page, request }) => {
    const consoleErrors = watchConsoleErrors(page)
    const apiErrors = watchApiErrors(page)

    await injectSession(page, request, USERS.p1b.email)
    await page.goto('/notifications')
    await expect(page.getByText('Centre de notifications')).toBeVisible({ timeout: 15000 })
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {})

    // Les notifications réelles de P1B s'affichent (pas l'état vide « Aucune notification »)
    await expect(page.locator('.v-list-item').first(), 'au moins une notification affichée').toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Aucune notification', { exact: true })).not.toBeVisible()

    const erreursJs = consoleErrors.filter((e) => !e.includes('favicon') && !e.includes('Failed to load resource'))
    expect(erreursJs, 'erreurs JS sur /notifications').toEqual([])
    expect(apiErrors, `appels API en erreur :\n${apiErrors.join('\n')}`).toEqual([])
  })
})
