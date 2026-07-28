import { test, expect, type Page, type TestInfo } from '@playwright/test'
import { injectSession, watchConsoleErrors } from './helpers'

/**
 * SMOKE — Rôles secondaires (recette contre backend réel).
 * Comble le manque identifié dans docs/qa/RAPPORT_COUVERTURE_TESTS_2026-07-28.md §3.2 :
 * ces comptes passaient le login API mais leurs écrans métier n'étaient jamais parcourus.
 *
 * Pour chaque rôle : session injectée → route par défaut → écrans principaux.
 * Critères : URL correcte, titre visible, 0 erreur console, 0 réponse API ≥ 400
 * (un 403 sur un écran autorisé par le routeur = vrai bug RBAC à corriger, pas à masquer).
 */

interface ApiError {
  status: number
  method: string
  url: string
}

function watchApiErrors(page: Page): ApiError[] {
  const errors: ApiError[] = []
  page.on('response', (res) => {
    if (res.url().includes('/api/') && res.status() >= 400) {
      errors.push({ status: res.status(), method: res.request().method(), url: res.url() })
    }
  })
  return errors
}

interface Ecran {
  path: string
  titre: RegExp | string
}

interface RoleSmoke {
  nom: string
  email: string
  routeParDefaut: RegExp
  ecrans: Ecran[]
}

const ROLES: RoleSmoke[] = [
  {
    nom: 'agent_cddi',
    email: 'agent.cddi@oase.tg',
    routeParDefaut: /\/backoffice\/dashboard/,
    ecrans: [
      { path: '/backoffice/dashboard', titre: 'Tableau de bord — Back-office' },
      { path: '/backoffice/dossiers', titre: 'Liste des dossiers' },
      { path: '/backoffice/workflow-cddi', titre: /Supervision CDDI/ },
    ],
  },
  {
    nom: 'agent_dgbf',
    email: 'agent.dgbf@oase.tg',
    routeParDefaut: /\/backoffice\/dashboard/,
    ecrans: [
      { path: '/backoffice/dashboard', titre: 'Tableau de bord — Back-office' },
      { path: '/backoffice/budget', titre: /Suivi budgétaire/ },
    ],
  },
  {
    nom: 'agent_dgtcp',
    email: 'agent.dgtcp@oase.tg',
    routeParDefaut: /\/tresor\/dashboard/,
    ecrans: [
      { path: '/tresor/dashboard', titre: /Tableau de bord Trésor/ },
      { path: '/tresor/rapprochements', titre: /Rapprochements/ },
      { path: '/tresor/archives', titre: /Archives et renouvellements/ },
    ],
  },
  {
    nom: 'agent_mae',
    email: 'agent.mae@oase.tg',
    routeParDefaut: /\/mae\/accords-siege/,
    ecrans: [{ path: '/mae/accords-siege', titre: /accords de si.ge/i }],
  },
  {
    nom: 'agent_dgmg',
    email: 'agent.dgmg@oase.tg',
    routeParDefaut: /\/extractif\/dashboard/,
    ecrans: [{ path: '/extractif/dashboard', titre: /Tableau de bord extractif/ }],
  },
  {
    nom: 'agent_ministere',
    email: 'agent.ministere@oase.tg',
    routeParDefaut: /\/ministeres\/dashboard/,
    ecrans: [{ path: '/ministeres/dashboard', titre: /Tableau de bord minist.re sectoriel/ }],
  },
  {
    nom: 'agent_conedef',
    email: 'agent.conedef@oase.tg',
    routeParDefaut: /\/conedef\/dashboard/,
    ecrans: [{ path: '/conedef/dashboard', titre: /Tableau de bord CONEDEF/ }],
  },
  {
    nom: 'agent_dsi_mef',
    email: 'agent.dsi.mef@oase.tg',
    routeParDefaut: /\/dsi\/dashboard/,
    ecrans: [{ path: '/dsi/dashboard', titre: /Tableau de bord DSI/ }],
  },
]

test.describe('SMOKE — Rôles secondaires (login → écrans métier → 0 erreur)', () => {
  for (const role of ROLES) {
    test(`${role.nom} — ${role.ecrans.length} écran(s) sans erreur`, async ({ page, request }, info) => {
      const consoleErrors = watchConsoleErrors(page)
      const apiErrors = watchApiErrors(page)

      await injectSession(page, request, role.email)

      // Route par défaut du rôle (preuve du mapping rôle → dashboard)
      await page.goto('/')
      await expect(page).toHaveURL(role.routeParDefaut, { timeout: 15000 })

      for (const ecran of role.ecrans) {
        await page.goto(ecran.path)
        await expect(page, `${role.nom} → ${ecran.path}`).toHaveURL(
          new RegExp(ecran.path.replace(/[/.]/g, '\\$&')),
          { timeout: 15000 },
        )
        await expect(
          page.getByText(ecran.titre).first(),
          `${role.nom} → titre « ${ecran.titre} » sur ${ecran.path}`,
        ).toBeVisible({ timeout: 15000 })
        // Attendre la fin des appels API déclenchés au mount : sans cela une erreur
        // API peut arriver APRÈS l'assertion finale (race observée en headless sur DGBF).
        await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {})
      }

      if (apiErrors.length) {
        await info.attach('appels-api-en-erreur', {
          body: apiErrors.map((e) => `${e.method} ${e.url} → ${e.status}`).join('\n'),
          contentType: 'text/plain',
        })
      }
      const erreursJs = consoleErrors.filter(
        (e) => !e.includes('favicon') && !e.includes('Failed to load resource'),
      )
      expect(erreursJs, `erreurs JS/pageerror pour ${role.nom}`).toEqual([])
      expect(
        apiErrors,
        `appels API en erreur pour ${role.nom} :\n${apiErrors.map((e) => `${e.method} ${e.url} → ${e.status}`).join('\n')}`,
      ).toEqual([])
    })
  }
})
