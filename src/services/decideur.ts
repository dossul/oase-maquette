import { api, ApiError } from './api'
import { useAuthStore } from '../stores/auth'

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1'

/** Formes réelles renvoyées par le backend (Swagger /api/docs). */

export interface DashboardP4 {
  totalDemandes: number
  repartitionParStatut: { statutCode: string; _count: { id: number } }[]
  evolutionJournaliere: { dateDepot: string | null; _count: { id: number } }[]
  /** Délai moyen dépôt → décision (heures), null si aucune demande décidée. */
  delaiMoyenTraitementHeures: number | null
  nombreDemandesDecidees: number
}

/** Mesure du registre central (GET /registre-central/mesures) — agrégats réels par base juridique. */
export interface MesureRegistre {
  baseJuridiqueId: string
  codeMesure: string
  libelle: string | null
  impotConcerne: string | null
  typeTexte1: string | null
  organeGestionCode: string | null
  estActive: boolean | null
  nombreDemandes: number
  nombreApprouvees: number
  montantTotalAccorde: string
  derniereDecision: { typeCode: string; date: string } | null
}

export interface DashboardP5 {
  montantTotalAccorde: string
  montantParImpot: { impot: string; montant: string }[]
  nombreContribuables: number
}

export interface Quota {
  id: string
  baseJuridiqueVersionId: string
  contribuableId: string | null
  typeQuotaCode: string
  total: string
  consomme: string
  alerteSeuilPct: number
  baseJuridiqueVersions?: {
    libelle: string | null
    impotConcerne: string | null
  } | null
}

export interface DemandeFile {
  id: string
  reference: string
  statutCode: string
  baseJuridiqueVersionId: string
  montantFcfa: string
  secteur: string | null
  dateDepot: string | null
  contribuable?: { id: string; raisonSociale: string; nif: string | null } | null
  instructeur?: { id: string; nom: string; prenom: string } | null
}

export interface Blocage {
  code: string
  bloque: boolean
  libelle: string
  details?: string
  gravite: string
}

export interface AnomalieItem {
  id: string
  statutCode?: string
  graviteCode?: string
  description?: string
}

export interface DecisionResult {
  decision: { id: string; typeCode: string; motif?: string | null }
  acte?: { id: string; documentUrl?: string; qrCodeHash?: string }
}

export function getDashboardP4(): Promise<DashboardP4> {
  return api<DashboardP4>('/dashboards/p4')
}

export function getDashboardP5(): Promise<DashboardP5> {
  return api<DashboardP5>('/dashboards/p5')
}

/** Registre central des mesures (rôles decideur/auditeur/admin_si). */
export function listerMesuresRegistre(): Promise<MesureRegistre[]> {
  return api<MesureRegistre[]>('/registre-central/mesures')
}

export function listerQuotas(): Promise<Quota[]> {
  return api<Quota[]>('/quotas')
}

/** File d'approbation : demandes en attente de décision finale. */
export function listerFileApprobation(): Promise<{ data: DemandeFile[] }> {
  return api<{ data: DemandeFile[] }>('/demandes?statutCode=en_instruction&limit=50')
}

/** Demandes (tous statuts) — utilisé pour les agrégats sectoriels du tableau de bord. */
export function listerDemandesDecideur(): Promise<{ data: DemandeFile[] }> {
  return api<{ data: DemandeFile[] }>('/demandes?limit=100')
}

export function getBlocages(demandeId: string): Promise<Blocage[]> {
  return api<Blocage[]>(`/demandes/${demandeId}/blocages`)
}

/** Anomalies non traitées (statut « nouvelle »). Le backend renvoie un tableau brut. */
export function listerAnomaliesNouvelles(): Promise<AnomalieItem[]> {
  return api<AnomalieItem[]>('/anomalies?statut=nouvelle')
}

/**
 * POST de décision SANS passer par le wrapper global : un 401 PIN_INVALIDE ne doit
 * pas déconnecter l'utilisateur (le wrapper api() purge la session sur tout 401).
 */
async function postDecision(path: string, body: unknown): Promise<DecisionResult> {
  const auth = useAuthStore()
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(auth.token ? { Authorization: `Bearer ${auth.token}` } : {}),
    },
    body: JSON.stringify(body),
  })
  const payload = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message = Array.isArray(payload.message)
      ? payload.message.join(', ')
      : payload.message || res.statusText
    throw new ApiError(res.status, message, payload.code)
  }
  return payload as DecisionResult
}

/** Approbation finale signée par PIN (génère acte + attestation PDF + notification). */
export function approuverDemande(demandeId: string, pin: string, motif?: string): Promise<DecisionResult> {
  return postDecision(`/demandes/${demandeId}/decisions/approuver`, { pin, ...(motif ? { motif } : {}) })
}

/** Rejet signé par PIN (motif obligatoire côté backend — MOTIF_REQUIS sinon). */
export function rejeterDemande(demandeId: string, pin: string, motif: string): Promise<DecisionResult> {
  return postDecision(`/demandes/${demandeId}/decisions/rejeter`, { pin, motif })
}

/** Ratio de consommation d'un quota (0..1+, montants sérialisés en string côté API). */
export function tauxConsommation(q: Quota): number {
  const total = Number(q.total)
  if (!total) return 0
  return Number(q.consomme) / total
}

export function formatFcfa(montant: string | number): string {
  return new Intl.NumberFormat('fr-FR').format(Number(montant)) + ' FCFA'
}
