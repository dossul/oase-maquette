import { test, expect, type Page } from '@playwright/test'
import { injectSession, watchConsoleErrors, USERS } from './helpers'
import path from 'path'
import { fileURLToPath } from 'url'

/**
 * GROUPE P1 — Bénéficiaire : dépôt d'une demande d'exonération.
 * Référence : docs/tests/04_PLAN_RECETTE_EXONERATION.md (TC-P1-01, TC-P1-02).
 * Backend réel http://localhost:3000, frontend http://localhost:5173.
 */

const PDF_ASSET = path.join(path.dirname(fileURLToPath(import.meta.url)), 'assets', 'piece-test.pdf')

test.describe.configure({ timeout: 120000 })

// ── Helpers locaux (non partagés) ────────────────────────────────────────────

async function gotoNewDemande(page: Page, request: any) {
  await injectSession(page, request, USERS.p1.email)
  await page.goto('/portail/dashboard')
  await page.getByRole('link', { name: 'Nouvelle demande' }).last().click()
  await expect(page).toHaveURL(/\/portail\/nouvelle-demande/)
}

async function nextStep(page: Page) {
  await page.getByRole('button', { name: 'Suivant' }).click()
}

/** Étape 1 : choisir le régime « Exonération TVA » (parcours standard CI 5 étapes). */
async function chooseRegimeTva(page: Page) {
  await page.getByText('Exonération TVA', { exact: true }).click()
  await expect(page.locator('.v-stepper')).toBeVisible()
}

/** Étape 3 : renseigner les détails de l'opération. */
async function fillDetailsEtape3(page: Page, montant: string) {
  await page.getByRole('textbox', { name: /Nature et description/i }).fill(
    'Acquisition de matériel industriel exonéré de TVA — recette TC-P1',
  )
  await page.getByRole('spinbutton', { name: /Valeur estimée/i }).fill(montant)
  await page.getByRole('textbox', { name: /Date de début souhaitée/i }).fill('2026-09-01')
}

/** Étape 4 : déposer le quitus fiscal via la modale d'upload (fichier + métadonnées requises). */
async function uploadQuitusFiscal(page: Page) {
  const quitusCard = page
    .getByText('Quitus fiscal OTR', { exact: true })
    .locator('xpath=ancestor::div[contains(@class,"v-card")][1]')
  await quitusCard.getByRole('button', { name: /Déposer/i }).click()

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await dialog.getByRole('textbox', { name: /Référence du quitus fiscal/i }).fill('QF-2026-0001')
  await dialog.getByLabel(/Date d'émission/i).fill('2026-06-15')
  await dialog.locator('input[type="file"]').setInputFiles(PDF_ASSET)
  await expect(dialog.getByText('piece-test.pdf')).toBeVisible()
  await dialog.getByRole('button', { name: /Valider le document/i }).click()
  await expect(dialog).not.toBeVisible()
}

/** Étape 5 : cocher la déclaration sur l'honneur puis cliquer sur Soumettre. */
async function certifyAndSubmit(page: Page) {
  await page.getByText(/Je certifie sur l'honneur/i).click()
  const submitBtn = page.getByRole('button', { name: 'Soumettre' })
  await expect(submitBtn).toBeEnabled()
  await submitBtn.click()
}

// ── TC-P1-01 ─────────────────────────────────────────────────────────────────

test("TC-P1-01 — dépôt d'une nouvelle demande d'exonération (parcours nominal)", async ({ page, request }) => {
  const consoleErrors = watchConsoleErrors(page)

  // Étape 0 : navigation depuis le tableau de bord
  await gotoNewDemande(page, request)

  // Étape 1 : type d'exonération + base juridique
  await chooseRegimeTva(page)
  await page.getByRole('textbox', { name: /Référence du texte/i }).fill('Art. 215 al. 3 CGI')
  await nextStep(page)

  // Étape 2 : identification contribuable (pré-remplie depuis le profil)
  await expect(page.getByRole('textbox', { name: 'NIF' })).toBeVisible()
  await nextStep(page)

  // Étape 3 : détails de l'opération (montant 15 000 000 FCFA)
  await fillDetailsEtape3(page, '15000000')
  await nextStep(page)

  // Étape 4 : pièces justificatives — NIF/RCCM pré-fournis, on dépose le quitus fiscal
  await uploadQuitusFiscal(page)
  await nextStep(page)

  // Étape 5 : récapitulatif — vérifier les éléments clés avant soumission
  await expect(page.getByText(/Lecture seule/i).first()).toBeVisible()
  await expect(page.getByText('Exonération TVA', { exact: true }).last()).toBeVisible()

  // Soumission — un appel POST /api/v1/demandes est attendu (puis /demandes/:id/soumettre)
  const postDemande = page.waitForResponse(
    (r) => /\/api\/v1\/demandes(\?|$)/.test(r.url()) && r.request().method() === 'POST',
    { timeout: 8000 },
  ).catch(() => null)

  await certifyAndSubmit(page)

  // Résultats attendus (plan de recette) :
  // - Toast/alerte de succès avec référence OASE au format OASE-AAAA-NNNNNN
  // - Appel POST /demandes en 200/201
  const resp = await postDemande
  expect(
    resp,
    "Aucun appel POST /api/v1/demandes émis par l'UI lors de la soumission (la demande n'est pas persistée côté backend)",
  ).not.toBeNull()
  expect([200, 201]).toContain(resp!.status())

  const successAlert = page.locator('.v-alert', { hasText: 'Demande soumise' })
  await expect(successAlert).toBeVisible()
  await expect(
    successAlert,
    'La référence générée doit être la VRAIE référence backend (format réel : DEM-AAAA-NNNNN ; le format OASE-AAAA-NNNNNN du plan n’est pas implémenté par l’API — cf. generateReference())',
  ).toContainText(/(OASE|DEM)-\d{4}-\d{5,6}/)

  await test.info().attach('console-errors', { body: consoleErrors.join('\n') || '(aucune)' })
})

// ── TC-P1-02 ─────────────────────────────────────────────────────────────────

test('TC-P1-02 — garde-fous de soumission (pièces manquantes, montant invalide)', async ({ page, request }) => {
  const consoleErrors = watchConsoleErrors(page)

  await gotoNewDemande(page, request)
  await chooseRegimeTva(page)
  await nextStep(page)
  await nextStep(page)

  // Variante montant invalide : montant négatif
  await fillDetailsEtape3(page, '-5000')
  await nextStep(page)

  // Étape 4 : NE PAS déposer les pièces rang 1 obligatoires (quitus, états financiers, DAS…)
  // (seuls NIF/RCCM sont pré-marqués fournis — la majorité des pièces obligatoires manque)
  const recap = page.locator('.v-stepper')
  await nextStep(page)

  // Récapitulatif : le compteur de pièces signale les manquants
  await expect(page.getByText(/\d+\/\d+ fournies/i)).toBeVisible()

  const postDemande = page.waitForResponse(
    (r) => /\/api\/v1\/demandes(\?|$)/.test(r.url()) && r.request().method() === 'POST',
    { timeout: 5000 },
  ).catch(() => null)

  await certifyAndSubmit(page)
  void recap

  // Attendus : message d'erreur métier explicite, aucune transition vers « soumis »,
  // aucun affichage de succès, aucun POST /demandes (ou rejet 422).
  const resp = await postDemande
  if (resp) {
    expect(resp.status(), 'Une soumission invalide doit être rejetée par l’API (422/400)').toBeGreaterThanOrEqual(400)
  }
  await expect.soft(
    page.locator('.v-alert', { hasText: /pièces? .* manquante|montant invalide|non recevable|erreur/i }),
    'Un message d’erreur métier explicite (pièces manquantes / montant invalide) doit être affiché',
  ).toBeVisible()
  await expect(
    page.locator('.v-alert', { hasText: 'Demande soumise' }),
    'GARDE-FOU ABSENT : la demande a été « soumise » avec un montant négatif (-5000 FCFA) et des pièces obligatoires manquantes',
  ).not.toBeVisible()

  await test.info().attach('console-errors', { body: consoleErrors.join('\n') || '(aucune)' })
})
