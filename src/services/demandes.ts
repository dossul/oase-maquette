import { api } from './api'

export interface Demande {
  id: string
  reference: string
  statutCode: string
  montantFcfa: bigint
  secteur: string | null
  dateDepot: Date | null
  dateEcheance?: string | null
  etapeActuelle: string | null
  type: string
  impotConcerne?: string | null
}

export function listerDemandes(): Promise<{ data: Demande[] }> {
  return api<{ data: Demande[] }>('/demandes')
}

/** Demande telle que retournée par l'API (relations contribuable incluses). */
export interface DemandeApi {
  id: string
  reference: string
  statutCode: string
  montantFcfa: string
  secteur: string | null
  dateDepot: string | null
  estUrgente?: boolean
  contribuable?: { id: string; raisonSociale: string; nif: string } | null
  instructeur?: { id: string; nom: string; prenom: string } | null
}

export function listerDemandesApi(): Promise<{ data: DemandeApi[] }> {
  return api<{ data: DemandeApi[] }>('/demandes')
}

export interface StatutCount {
  statutCode: string
  count: number
}

/** GET /demandes/stats/par-statut — répartition réelle des dossiers par statut. */
export function statsDemandesParStatut(): Promise<StatutCount[]> {
  return api<StatutCount[]>('/demandes/stats/par-statut')
}

export interface Blocage {
  code: string
  bloque: boolean
  libelle: string
  details?: string
  gravite: string
}

/** GET /demandes/:id/blocages — évaluation réelle des règles de blocage sur un dossier. */
export function listerBlocagesDemande(demandeId: string): Promise<Blocage[]> {
  return api<Blocage[]>(`/demandes/${demandeId}/blocages`)
}

export interface PieceJointe {
  id: string
  typePieceCode?: string
  nomFichier?: string
  statutCode?: string
  createdAt?: string
  [key: string]: unknown
}

/** GET /demandes/:id/pieces-jointes — pièces réellement déposées sur un dossier. */
export function listerPiecesJointes(demandeId: string): Promise<PieceJointe[]> {
  return api<PieceJointe[]>(`/demandes/${demandeId}/pieces-jointes`)
}
