/**
 * Données de mock et handlers API pour les tests E2E OASE.
 * Le backend attendu est localhost:3000 ; le frontend Vite proxy /api vers ce backend.
 * En test nous interceptons les appels ** /api/v1/ ** pour garantir des scénarios
 * déterministes indépendamment de l'état du backend.
 *
 * [Recette E2E — alignement API réelle]
 * Les shapes ci-dessous reproduisent les contrats RÉELS du backend NestJS
 * (cf. src/services/*.ts) :
 *   - GET /demandes            → { data: DemandeApi[] }  (statuts canoniques :
 *                                brouillon, soumis, en_instruction, action_requise,
 *                                approuve, rejete, expire, archive)
 *   - GET /conventions         → tableau brut ConventionApi[]
 *   - GET /anomalies           → tableau brut AnomalieAudit[]
 *   - GET /dashboards/p4       → { totalDemandes, repartitionParStatut: [{statutCode, _count:{id}}],
 *                                evolutionJournaliere: [{dateDepot, _count:{id}}] } (objet brut)
 *   - GET /dashboards/p5       → { montantTotalAccorde: string, montantParImpot: [{impot, montant}],
 *                                nombreContribuables } (objet brut)
 *   - GET /quotas              → tableau brut Quota[] (montants sérialisés en string)
 *   - GET /utilisateurs        → { data: Utilisateur[] } avec relation `institution` embarquée
 *   - POST /utilisateurs       → utilisateur créé DIRECTEMENT (sans enveloppe {data})
 * Les rôles sont les rôles CANONIQUES du backend (agent_ci, agent_agence, admin_si…).
 */

import type { Page, Route } from '@playwright/test'

export type OaseRole =
  | 'contribuable'
  | 'agent_ci'
  | 'agent_cddi'
  | 'agent_dgbf'
  | 'agent_dgtcp'
  | 'agent_agence'
  | 'decideur'
  | 'auditeur'
  | 'admin_si'
  | 'agent_ministere'
  | 'agent_mae'
  | 'agent_dgmg'
  | 'agent_conedef'
  | 'agent_dsi_mef'

export interface MockUser {
  id: string
  email: string
  nom: string
  prenom: string
  role: OaseRole
  institutionId?: string
}

export const mockUsers: Record<OaseRole, MockUser> = {
  contribuable: { id: 'u-ben', email: 'e.nyavor@steeltogo.tg', nom: 'NYAVOR', prenom: 'Edem', role: 'contribuable', institutionId: 'TOGO STEEL SARL' },
  agent_ci: { id: 'u-ci', email: 'k.abalo@otr.tg', nom: 'ABALO', prenom: 'Kofi', role: 'agent_ci', institutionId: 'OTR-CI' },
  agent_cddi: { id: 'u-cddi', email: 'a.mensah@otr.tg', nom: 'MENSAH', prenom: 'Akossiwa', role: 'agent_cddi', institutionId: 'OTR-CDDI' },
  agent_dgbf: { id: 'u-dgbf', email: 'm.koffi@dgbf.tg', nom: 'KOFFI', prenom: 'Mawuli', role: 'agent_dgbf', institutionId: 'DGBF' },
  agent_dgtcp: { id: 'u-dgtcp', email: 't.gudef@tresor.tg', nom: 'GUDEF', prenom: 'Tovi', role: 'agent_dgtcp', institutionId: 'DGTCP' },
  agent_agence: { id: 'u-zf', email: 'y.dossou@api-zf.tg', nom: 'DOSSOU', prenom: 'Yawa', role: 'agent_agence', institutionId: 'API' },
  decideur: { id: 'u-dec', email: 'p.tchalla@upf.mef.tg', nom: 'TCHALLA', prenom: 'Pépé', role: 'decideur', institutionId: 'UPF' },
  auditeur: { id: 'u-aud', email: 's.agbeko@igf.tg', nom: 'AGBEKO', prenom: 'Sénamé', role: 'auditeur', institutionId: 'IGF' },
  admin_si: { id: 'u-adm', email: 'l.togbui@mef.tg', nom: 'TOGBUI', prenom: 'Luc', role: 'admin_si', institutionId: 'DSI' },
  agent_ministere: { id: 'u-min', email: 'm.secteur@gouv.tg', nom: 'SECTEUR', prenom: 'Ministère', role: 'agent_ministere', institutionId: 'Agriculture' },
  agent_mae: { id: 'u-mae', email: 'd.mae@diplomatie.tg', nom: 'MAE', prenom: 'Diplo', role: 'agent_mae', institutionId: 'MAE' },
  agent_dgmg: { id: 'u-dgmg', email: 'm.mines@mines.tg', nom: 'MINES', prenom: 'DGMG', role: 'agent_dgmg', institutionId: 'DGMG' },
  agent_conedef: { id: 'u-conedef', email: 'c.conedef@finances.tg', nom: 'CONEDEF', prenom: 'Coord', role: 'agent_conedef', institutionId: 'CONEDEF' },
  agent_dsi_mef: { id: 'u-dsi', email: 's.dsi@mef.tg', nom: 'DSI', prenom: 'SI', role: 'agent_dsi_mef', institutionId: 'DSI' },
}

export const defaultPassword = 'Oase@2026!'

/**
 * Demandes au format RÉEL de l'API (DemandesService.toResponse) :
 * montantFcfa sérialisé en string, relation contribuable/instructeur embarquée,
 * statutCode CANONIQUE. `type` / `etapeActuelle` sont des extras tolérés par
 * les vues (fallbacks d'affichage).
 */
export const mockDemandes = [
  { id: '1', reference: 'OASE-2026-0042', statutCode: 'en_instruction', baseJuridiqueVersionId: 'bj-1', contribuableId: 'c-1', contribuable: { id: 'c-1', raisonSociale: 'TOGO STEEL SARL', nif: 'TG-001-2019-B' }, instructeurId: 'u-ci', instructeur: { id: 'u-ci', nom: 'ABALO', prenom: 'Kofi' }, montantFcfa: '45000000', secteur: 'Industrie', dateDepot: '2026-03-15T00:00:00.000Z', dateEcheance: '2026-09-15T00:00:00.000Z', motifRejet: null, estUrgente: false, createdAt: '2026-03-15T00:00:00.000Z', updatedAt: '2026-03-15T00:00:00.000Z', type: 'douaniere', etapeActuelle: 'Instruction OTR Douanes' },
  { id: '2', reference: 'OASE-2026-0039', statutCode: 'approuve', baseJuridiqueVersionId: 'bj-2', contribuableId: 'c-2', contribuable: { id: 'c-2', raisonSociale: 'AGRO-TOGO INVEST SA', nif: 'TG-002-2020-A' }, instructeurId: 'u-cddi', instructeur: { id: 'u-cddi', nom: 'MENSAH', prenom: 'Akossiwa' }, montantFcfa: '120000000', secteur: 'Agriculture', dateDepot: '2026-02-10T00:00:00.000Z', dateEcheance: '2027-02-10T00:00:00.000Z', motifRejet: null, estUrgente: false, createdAt: '2026-02-10T00:00:00.000Z', updatedAt: '2026-02-10T00:00:00.000Z', type: 'fiscale_tva', etapeActuelle: 'Approuvé — Actif' },
  { id: '3', reference: 'OASE-2026-0035', statutCode: 'action_requise', baseJuridiqueVersionId: 'bj-3', contribuableId: 'c-3', contribuable: { id: 'c-3', raisonSociale: 'LOMÉ TEXTILE ZF SAS', nif: 'TG-003-2021-C' }, instructeurId: 'u-cddi', instructeur: { id: 'u-cddi', nom: 'MENSAH', prenom: 'Akossiwa' }, montantFcfa: '89000000', secteur: 'Industrie textile', dateDepot: '2026-01-20T00:00:00.000Z', dateEcheance: '2026-07-20T00:00:00.000Z', motifRejet: null, estUrgente: false, createdAt: '2026-01-20T00:00:00.000Z', updatedAt: '2026-01-20T00:00:00.000Z', type: 'zone_franche', etapeActuelle: 'Complément requis — Pièces manquantes' },
  { id: '4', reference: 'OASE-2025-0118', statutCode: 'archive', baseJuridiqueVersionId: 'bj-4', contribuableId: 'c-4', contribuable: { id: 'c-4', raisonSociale: 'MINES DU NORD TOGO', nif: 'TG-004-2018-D' }, instructeurId: 'u-dec', instructeur: { id: 'u-dec', nom: 'TCHALLA', prenom: 'Pépé' }, montantFcfa: '230000000', secteur: 'Mines', dateDepot: '2025-11-05T00:00:00.000Z', dateEcheance: '2026-05-05T00:00:00.000Z', motifRejet: 'Base juridique invalide', estUrgente: false, createdAt: '2025-11-05T00:00:00.000Z', updatedAt: '2025-11-05T00:00:00.000Z', type: 'fiscale_is', etapeActuelle: 'Rejeté — Base juridique invalide' },
  { id: '5', reference: 'OASE-2025-0098', statutCode: 'approuve', baseJuridiqueVersionId: 'bj-5', contribuableId: 'c-5', contribuable: { id: 'c-5', raisonSociale: 'ENERGIE SOLAIRE TOGO', nif: 'TG-005-2022-E' }, instructeurId: 'u-dgbf', instructeur: { id: 'u-dgbf', nom: 'KOFFI', prenom: 'Mawuli' }, montantFcfa: '175000000', secteur: 'Énergie', dateDepot: '2025-09-12T00:00:00.000Z', dateEcheance: '2026-09-12T00:00:00.000Z', motifRejet: null, estUrgente: false, createdAt: '2025-09-12T00:00:00.000Z', updatedAt: '2025-09-12T00:00:00.000Z', type: 'code_investissement', etapeActuelle: 'Approuvé — Actif' },
  { id: '6', reference: 'OASE-2026-0044', statutCode: 'en_instruction', baseJuridiqueVersionId: 'bj-6', contribuableId: 'c-6', contribuable: { id: 'c-6', raisonSociale: 'NUMERIQUE AFRIQUE SA', nif: 'TG-006-2023-F' }, instructeurId: 'u-cddi', instructeur: { id: 'u-cddi', nom: 'MENSAH', prenom: 'Akossiwa' }, montantFcfa: '55000000', secteur: 'Numérique', dateDepot: '2026-04-01T00:00:00.000Z', dateEcheance: '2026-10-01T00:00:00.000Z', motifRejet: null, estUrgente: false, createdAt: '2026-04-01T00:00:00.000Z', updatedAt: '2026-04-01T00:00:00.000Z', type: 'sectorielle', etapeActuelle: 'Instruction OTR Impôts' },
]

/** Notifications au format RÉEL (Notification Prisma — tableau brut, tri createdAt desc). */
export const mockNotificationsApi = [
  { id: 'n-1', utilisateurId: 'u-ben', demandeId: '3', typeNotificationCode: 'INSTRUCTION', canalCode: 'inapp', titre: 'Complément requis', corps: "Votre dossier OASE-2026-0035 nécessite des pièces complémentaires.", estLue: false, dateLecture: null, createdAt: '2026-04-27T09:23:00.000Z' },
  { id: 'n-2', utilisateurId: 'u-ben', demandeId: '2', typeNotificationCode: 'INSTRUCTION', canalCode: 'inapp', titre: 'Dossier approuvé', corps: "Votre demande OASE-2026-0039 a été approuvée. Téléchargez votre attestation.", estLue: false, dateLecture: null, createdAt: '2026-04-27T10:45:00.000Z' },
]

/** Conventions au format RÉEL (ConventionsService.lister — tableau brut Prisma). */
export const mockConventions = [
  { id: 'C001', reference: 'ZFI-2024-012', regimeCode: 'zone_franche', statutCode: 'active', dateDebut: '2024-01-15T00:00:00.000Z', dateFin: '2034-01-15T00:00:00.000Z', montantEstime: '890000000', emploisEngages: 450, emploisCrees: 312, contribuables: { id: 'c-3', raisonSociale: 'LOMÉ TEXTILE ZF SAS', nif: 'TG-003-2021-C' } },
  { id: 'C002', reference: 'ZES-2023-008', regimeCode: 'zone_economique_speciale', statutCode: 'active', dateDebut: '2023-06-01T00:00:00.000Z', dateFin: '2033-06-01T00:00:00.000Z', montantEstime: '1200000000', emploisEngages: 800, emploisCrees: 620, contribuables: { id: 'c-7', raisonSociale: 'AGRO-PROCESSING ZES', nif: 'TG-007-2023-G' } },
  { id: 'C003', reference: 'CI-2025-003', regimeCode: 'code_investissement', statutCode: 'active', dateDebut: '2025-03-10T00:00:00.000Z', dateFin: '2030-03-10T00:00:00.000Z', montantEstime: '560000000', emploisEngages: 180, emploisCrees: 95, contribuables: { id: 'c-5', raisonSociale: 'ENERGIE SOLAIRE TOGO', nif: 'TG-005-2022-E' } },
]

/** Anomalies au format RÉEL (moteur de règles — tableau brut, champs *Code). */
export const mockAnomalies = [
  { id: 'A001', categorieCode: 'juridique', graviteCode: 'critique', description: 'Exonération accordée sans base juridique valide', demandeId: 'd-75', dateDetection: '2026-04-15T00:00:00.000Z', statutCode: 'nouvelle', detecteeParCode: 'moteur_regles', commentaire: null, dateResolution: null, demandes: { id: 'd-75', reference: 'OASE-2025-0075' } },
  { id: 'A002', categorieCode: 'financiere', graviteCode: 'elevee', description: 'Dépassement quota de 340%', demandeId: 'd-82', dateDetection: '2026-04-18T00:00:00.000Z', statutCode: 'nouvelle', detecteeParCode: 'moteur_regles', commentaire: null, dateResolution: null, demandes: { id: 'd-82', reference: 'OASE-2025-0082' } },
  { id: 'A003', categorieCode: 'temporelle', graviteCode: 'moyenne', description: 'Exonération active depuis 847 jours', demandeId: 'd-156', dateDetection: '2026-04-20T00:00:00.000Z', statutCode: 'examinee', detecteeParCode: 'moteur_regles', commentaire: null, dateResolution: null, demandes: { id: 'd-156', reference: 'OASE-2024-0156' } },
]

/** Institutions embarquées dans les utilisateurs (miroir du seed OASE). */
export const mockInstitutions = [
  { id: '10000000-0000-0000-0000-000000000001', code: 'OTR-CI', nom: 'Office Togolais des Recettes — Centre des Impôts' },
  { id: '10000000-0000-0000-0000-000000000002', code: 'OTR-CDDI', nom: 'OTR — Centre des Douanes et du Droit Indirect' },
  { id: '10000000-0000-0000-0000-000000000003', code: 'DGBF', nom: 'Direction Générale du Budget et des Finances' },
  { id: '10000000-0000-0000-0000-000000000006', code: 'UPF', nom: 'Unité de Politique Fiscale' },
  { id: '10000000-0000-0000-0000-000000000007', code: 'IGF', nom: 'Inspection Générale des Finances' },
]

/** Utilisateurs au format RÉEL : rôles canoniques + relation `institution` embarquée. */
export const mockUtilisateurs = [
  { id: '1', nom: 'ABALO', prenom: 'Kofi', email: 'k.abalo@otr.tg', role: 'agent_ci', statutCode: 'actif', institutionId: mockInstitutions[0].id, institution: mockInstitutions[0], derniereConnexion: '2026-04-27T09:12:00' },
  { id: '2', nom: 'MENSAH', prenom: 'Akossiwa', email: 'a.mensah@otr.tg', role: 'agent_cddi', statutCode: 'actif', institutionId: mockInstitutions[1].id, institution: mockInstitutions[1], derniereConnexion: '2026-04-27T08:45:00' },
  { id: '3', nom: 'KOFFI', prenom: 'Mawuli', email: 'm.koffi@dgbf.tg', role: 'agent_dgbf', statutCode: 'actif', institutionId: mockInstitutions[2].id, institution: mockInstitutions[2], derniereConnexion: '2026-04-26T17:30:00' },
  { id: '4', nom: 'TCHALLA', prenom: 'Pépé', email: 'p.tchalla@upf.mef.tg', role: 'decideur', statutCode: 'actif', institutionId: mockInstitutions[3].id, institution: mockInstitutions[3], derniereConnexion: '2026-04-27T07:55:00' },
  { id: '5', nom: 'AGBEKO', prenom: 'Sénamé', email: 's.agbeko@igf.tg', role: 'auditeur', statutCode: 'actif', institutionId: mockInstitutions[4].id, institution: mockInstitutions[4], derniereConnexion: '2026-04-25T14:20:00' },
]

/** GET /dashboards/p4 — objet BRUT (pas d'enveloppe), _count.id Prisma. */
export const mockKpisP4 = {
  totalDemandes: 1248,
  repartitionParStatut: [
    { statutCode: 'approuve', _count: { id: 812 } },
    { statutCode: 'en_instruction', _count: { id: 312 } },
  ],
  evolutionJournaliere: [
    { dateDepot: '2026-03-15T00:00:00.000Z', _count: { id: 45 } },
    { dateDepot: '2026-04-01T00:00:00.000Z', _count: { id: 38 } },
  ],
}

/** GET /dashboards/p5 — objet BRUT, montants sérialisés en string. */
export const mockKpisP5 = {
  montantTotalAccorde: '847300000000',
  montantParImpot: [
    { impot: 'TVA', montant: '280000000000' },
    { impot: 'IS', montant: '195000000000' },
  ],
  nombreContribuables: 342,
}

/** GET /quotas — tableau BRUT, montants en string (Decimal Prisma sérialisé). */
export const mockQuotas = [
  { id: 'q-1', baseJuridiqueVersionId: 'bj-1', contribuableId: null, typeQuotaCode: 'annuel', total: '45000000', consomme: '18000000', alerteSeuilPct: 80, baseJuridiqueVersions: { libelle: 'CGI Art. 215 — Exonération douanière', impotConcerne: 'Droits de douane' } },
  { id: 'q-2', baseJuridiqueVersionId: 'bj-2', contribuableId: null, typeQuotaCode: 'annuel', total: '120000000', consomme: '118000000', alerteSeuilPct: 80, baseJuridiqueVersions: { libelle: 'LFI 2026 Art. 45 — TVA agriculture', impotConcerne: 'TVA' } },
]

export const defaultDashboardForRole: Record<OaseRole, string> = {
  contribuable: '/portail/dashboard',
  agent_ci: '/backoffice/dashboard',
  agent_cddi: '/backoffice/dashboard',
  agent_dgbf: '/backoffice/dashboard',
  agent_dgtcp: '/tresor/dashboard',
  agent_agence: '/agences/dashboard',
  decideur: '/decideur/dashboard',
  auditeur: '/audit/dashboard',
  admin_si: '/admin/utilisateurs',
  agent_ministere: '/ministeres/dashboard',
  agent_mae: '/mae/accords-siege',
  agent_dgmg: '/extractif/dashboard',
  agent_conedef: '/conedef/dashboard',
  agent_dsi_mef: '/dsi/dashboard',
}

function isApiCall(route: Route, method: string, pathname: string) {
  const url = new URL(route.request().url())
  return route.request().method() === method && url.pathname.endsWith(pathname)
}

/**
 * Installe les routes mockées.
 * @param page Page Playwright
 * @param options.options.scenarioDynamique Permet d'ajuster certains comportements (erreurs, lenteurs…)
 */
export async function installApiMocks(page: Page, options: { slow?: number; loginError?: boolean; mfaRequired?: boolean; user?: MockUser } = {}) {
  // Liste mutable par installation : le POST /utilisateurs y ajoute le compte créé
  // pour que le rechargement de la liste (GET) le fasse apparaître dans le tableau,
  // comme le fait le vrai backend (tri createdAt desc → en tête de liste).
  const utilisateurs = [...mockUtilisateurs]

  await page.route('**/api/v1/**', async (route) => {
    const req = route.request()
    const url = new URL(req.url())

    // Authentification
    if (url.pathname.endsWith('/auth/login') && req.method() === 'POST') {
      await new Promise((r) => setTimeout(r, options.slow ?? 0))
      if (options.loginError) {
        // 400 (et non 401) car la maquette redirige immédiatement sur 401.
        return route.fulfill({ status: 400, json: { message: 'Identifiant ou mot de passe incorrect' } })
      }
      if (options.mfaRequired) {
        return route.fulfill({ status: 200, json: { mfa_required: true, mfaRequired: true, user: options.user || mockUsers.agent_ci } })
      }
      return route.fulfill({ status: 200, json: { access_token: 'mock-jwt-' + Date.now(), accessToken: 'mock-jwt-' + Date.now(), user: options.user || mockUsers.agent_ci } })
    }

    if (isApiCall(route, 'GET', '/demandes')) {
      await new Promise((r) => setTimeout(r, options.slow ?? 0))
      return route.fulfill({ status: 200, json: { data: mockDemandes } })
    }

    // GET /notifications : le backend renvoie un TABLEAU BRUT (Prisma, tri createdAt desc).
    if (isApiCall(route, 'GET', '/notifications')) {
      await new Promise((r) => setTimeout(r, options.slow ?? 0))
      return route.fulfill({ status: 200, json: mockNotificationsApi })
    }

    // GET /notifications/unread-count : { count }.
    if (isApiCall(route, 'GET', '/notifications/unread-count')) {
      return route.fulfill({ status: 200, json: { count: mockNotificationsApi.filter((n) => !n.estLue).length } })
    }

    // PATCH /notifications/:id/lue : notification mise à jour.
    if (url.pathname.includes('/notifications/') && url.pathname.endsWith('/lue') && req.method() === 'PATCH') {
      return route.fulfill({ status: 200, json: { estLue: true, dateLecture: new Date().toISOString() } })
    }

    // GET /conventions : le backend renvoie un TABLEAU BRUT.
    if (isApiCall(route, 'GET', '/conventions')) {
      await new Promise((r) => setTimeout(r, options.slow ?? 0))
      return route.fulfill({ status: 200, json: mockConventions })
    }

    // GET /anomalies (et /anomalies?statut=nouvelle) : TABLEAU BRUT.
    if (isApiCall(route, 'GET', '/anomalies')) {
      await new Promise((r) => setTimeout(r, options.slow ?? 0))
      const statut = url.searchParams.get('statut') || url.searchParams.get('statutCode')
      const items = statut ? mockAnomalies.filter((a) => a.statutCode === statut) : mockAnomalies
      return route.fulfill({ status: 200, json: items })
    }

    // GET /dashboards/p4 : objet BRUT (repartitionParStatut avec _count.id).
    if (isApiCall(route, 'GET', '/dashboards/p4')) {
      await new Promise((r) => setTimeout(r, options.slow ?? 0))
      return route.fulfill({ status: 200, json: mockKpisP4 })
    }

    // GET /dashboards/p5 : objet BRUT (montants string, montantParImpot).
    if (isApiCall(route, 'GET', '/dashboards/p5')) {
      await new Promise((r) => setTimeout(r, options.slow ?? 0))
      return route.fulfill({ status: 200, json: mockKpisP5 })
    }

    // GET /quotas : TABLEAU BRUT (montants string).
    if (isApiCall(route, 'GET', '/quotas')) {
      await new Promise((r) => setTimeout(r, options.slow ?? 0))
      return route.fulfill({ status: 200, json: mockQuotas })
    }

    if (isApiCall(route, 'GET', '/utilisateurs')) {
      await new Promise((r) => setTimeout(r, options.slow ?? 0))
      return route.fulfill({ status: 200, json: { data: utilisateurs, meta: { total: utilisateurs.length } } })
    }

    // POST /utilisateurs : le backend retourne l'utilisateur créé DIRECTEMENT
    // (sans enveloppe {data}). La liste est rechargée ensuite côté vue.
    if (isApiCall(route, 'POST', '/utilisateurs')) {
      const body = JSON.parse(req.postData() || '{}')
      const institution = mockInstitutions.find((i) => i.id === body.institutionId) ?? null
      const created = {
        id: 'u-' + Date.now(),
        nom: body.nom || 'Nouveau',
        prenom: body.prenom || 'Utilisateur',
        email: body.email,
        role: body.role,
        statutCode: 'actif',
        institutionId: body.institutionId,
        institution,
        derniereConnexion: null,
      }
      // Le backend trie par createdAt desc → le nouveau compte en première ligne.
      utilisateurs.unshift(created as (typeof mockUtilisateurs)[number])
      return route.fulfill({ status: 201, json: created })
    }

    // GET /missions (vague B) : TABLEAU BRUT — la vue audit Dashboard/Missions l'appelle au mount.
    if (isApiCall(route, 'GET', '/missions')) {
      return route.fulfill({ status: 200, json: [] })
    }

    // GET /registre-central/mesures (vague B) : TABLEAU BRUT.
    if (isApiCall(route, 'GET', '/registre-central/mesures')) {
      return route.fulfill({ status: 200, json: [] })
    }

    // GET /referentiels/inseed (vague B) : objet brut (clés system_config).
    if (isApiCall(route, 'GET', '/referentiels/inseed')) {
      return route.fulfill({ status: 200, json: {} })
    }

    // GET /connecteurs(+status/logs), /admin/parametres, /admin/monitoring,
    // /notifications/templates, /utilisateurs/annuaire, /rapports(+opendata) :
    // réponses vides génériques pour éviter toute fuite vers le backend réel
    // (un 401 purgerait la session mockée → redirection /login intempestive).
    if (isApiCall(route, 'GET', '/connecteurs') || url.pathname.includes('/connecteurs')) {
      return route.fulfill({ status: 200, json: [] })
    }
    if (isApiCall(route, 'GET', '/admin/parametres')) {
      return route.fulfill({ status: 200, json: {} })
    }
    if (isApiCall(route, 'GET', '/admin/monitoring')) {
      return route.fulfill({ status: 200, json: { version: 'test', uptimeSeconds: 0, utilisateursActifs24h: 0, erreurs500_24h: 0, jobs: [] } })
    }
    if (isApiCall(route, 'GET', '/notifications/templates')) {
      return route.fulfill({ status: 200, json: [] })
    }
    if (isApiCall(route, 'GET', '/utilisateurs/annuaire')) {
      return route.fulfill({ status: 200, json: [] })
    }
    if (isApiCall(route, 'GET', '/rapports/opendata')) {
      return route.fulfill({ status: 200, json: [] })
    }
    if (isApiCall(route, 'GET', '/rapports')) {
      return route.fulfill({ status: 200, json: [] })
    }

    // Fallback : laisse passer vers le vrai backend (permettra de tester localhost:3000 si actif)
    route.continue()
  })
}
