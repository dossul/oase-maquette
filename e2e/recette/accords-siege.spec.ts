import { test, expect } from '@playwright/test'
import { USERS, api, apiLogin, injectSession, watchConsoleErrors } from './helpers'

/**
 * TC-MAE-01 — Sous-registre des accords de siège (Processus 6, MAE → OTR).
 *
 * Couvre le nouveau module backend /accords-siege (CRUD + RBAC) et la vue
 * /mae/accords-siege branchée dessus : liste réelle, fiche détaillée,
 * création via dialog, retrait du registre actif.
 *
 * Données réelles présentes en base : PNUD Togo, UNICEF Togo,
 * Ambassade de France, Ambassade d'Allemagne, Délégation UE.
 */

const MAE = 'agent.mae@oase.tg'
const ACCORD_TEST = 'Organisation Test E2E Accords'

test.describe.configure({ mode: 'serial', timeout: 120000 })

test.describe('TC-MAE-01 — Accords de siège', () => {
  test('API — liste, filtre, RBAC lecture', async ({ request }) => {
    const mae = await apiLogin(request, MAE)

    const liste = await api(request, mae).get('/accords-siege')
    expect(liste.status()).toBe(200)
    const accords = await liste.json()
    expect(accords.length).toBeGreaterThanOrEqual(5)
    const institutions = accords.map((a: { institution: string }) => a.institution)
    expect(institutions).toContain('PNUD Togo')
    expect(institutions).toContain('Ambassade de France')

    // Filtre par type
    const filtree = await api(request, mae).get('/accords-siege?typeInstitutionCode=ambassade')
    expect(filtree.status()).toBe(200)
    const ambassades = await filtree.json()
    expect(ambassades.length).toBeGreaterThanOrEqual(2)
    for (const a of ambassades) expect(a.typeInstitutionCode).toBe('ambassade')

    // Détail avec rattachements
    const detail = await api(request, mae).get(`/accords-siege/${accords[0].id}`)
    expect(detail.status()).toBe(200)
    const corps = await detail.json()
    expect(corps.refTypesAccordSiege.libelle).toBeTruthy()

    // RBAC lecture : agent_ci autorisé, contribuable REFUSÉ (données diplomatiques sensibles)
    const ci = await apiLogin(request, USERS.p2_ci.email)
    expect((await api(request, ci).get('/accords-siege')).status()).toBe(200)
    const contribuable = await apiLogin(request, USERS.p1.email)
    expect((await api(request, contribuable).get('/accords-siege')).status()).toBe(403)
  })

  test('API — création, doublon 409, type inconnu 400, retrait, RBAC écriture', async ({ request }) => {
    const mae = await apiLogin(request, MAE)

    // Écriture interdite à agent_ci
    const ci = await apiLogin(request, USERS.p2_ci.email)
    const interdit = await api(request, ci).post('/accords-siege', {
      institution: ACCORD_TEST, typeInstitutionCode: 'autre',
    })
    expect(interdit.status()).toBe(403)

    // Type d'institution inconnu → 400
    const typeInconnu = await api(request, mae).post('/accords-siege', {
      institution: ACCORD_TEST, typeInstitutionCode: 'type_inexistant',
    })
    expect(typeInconnu.status()).toBe(400)

    // Création valide → 201 (ou 409 si un run précédent a laissé l'accord)
    let id: string
    const cree = await api(request, mae).post('/accords-siege', {
      institution: ACCORD_TEST,
      typeInstitutionCode: 'ong_internationale',
      texteFondateur: 'Accord de siège de test E2E',
      dateSignature: '2026-07-30',
    })
    if (cree.status() === 409) {
      const liste = await (await api(request, mae).get('/accords-siege')).json()
      id = liste.find((a: { institution: string }) => a.institution === ACCORD_TEST).id
      // Nettoyage préalable avant recréation
      await api(request, mae).patch(`/accords-siege/${id}`, { estActif: false })
      const recree = await api(request, mae).post('/accords-siege', {
        institution: ACCORD_TEST, typeInstitutionCode: 'ong_internationale',
      })
      expect(recree.status()).toBe(201)
      id = (await recree.json()).id
    } else {
      expect(cree.status()).toBe(201)
      id = (await cree.json()).id
    }

    // Doublon actif → 409
    const doublon = await api(request, mae).post('/accords-siege', {
      institution: ACCORD_TEST, typeInstitutionCode: 'autre',
    })
    expect(doublon.status()).toBe(409)
    expect((await doublon.json()).code).toBe('ACCORD_SIEGE_DOUBLON')

    // Retrait du registre actif
    const retire = await api(request, mae).patch(`/accords-siege/${id}`, { estActif: false })
    expect(retire.status()).toBe(200)
    expect((await retire.json()).estActif).toBe(false)

    // Le retrait permet de recréer un accord du même nom (pas de doublon actif)
    const recreeFinal = await api(request, mae).post('/accords-siege', {
      institution: ACCORD_TEST, typeInstitutionCode: 'ong_internationale',
    })
    expect(recreeFinal.status()).toBe(201)
    // Nettoyage final : on retire l'accord de test du registre actif
    await api(request, mae).patch(`/accords-siege/${(await recreeFinal.json()).id}`, { estActif: false })
  })

  test('UI — liste réelle, fiche, création via dialog, retrait', async ({ page, request }) => {
    const consoleErrors = watchConsoleErrors(page)
    await injectSession(page, request, MAE)

    await page.goto('/mae/accords-siege')
    await expect(page.getByRole('heading', { name: /Sous-registre des accords de siège/i })).toBeVisible()

    // Données réelles du sous-registre
    await expect(page.getByRole('cell', { name: 'PNUD Togo' })).toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('cell', { name: 'Ambassade de France' })).toBeVisible()

    // Fiche détaillée
    await page.getByRole('cell', { name: 'PNUD Togo' }).click()
    await expect(page.getByText(/Signature de l'accord avec le MAE/i)).toBeVisible()
    await expect(page.getByText(/Contribuables rattachés/i)).toBeVisible()

    // Création via le dialog
    const nomUi = `ONG Test UI ${Date.now() % 100000}`
    await page.getByRole('button', { name: /Nouvel accord/i }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('textbox', { name: /Organisation/i }).fill(nomUi)
    await dialog.locator('.v-select').click()
    await page.getByRole('option', { name: /ONG internationale/i }).click()
    await dialog.getByRole('textbox', { name: /Date de signature/i }).fill('2026-07-30')
    await dialog.getByRole('button', { name: /Enregistrer/i }).click()
    await expect(dialog).not.toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('cell', { name: nomUi })).toBeVisible()

    // Retrait du registre depuis la fiche
    await page.getByRole('cell', { name: nomUi }).click()
    await page.getByRole('button', { name: /Retirer du registre/i }).click()
    await expect(page.getByRole('cell', { name: 'Retiré' }).first()).toBeVisible({ timeout: 15000 })

    const erreursJs = consoleErrors.filter((e) => !e.includes('favicon') && !e.includes('Failed to load resource'))
    expect(erreursJs, 'erreurs JS sur la vue accords de siège').toEqual([])
  })
})
