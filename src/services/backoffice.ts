import { api } from './api'

/**
 * Service dédié au backoffice instructeur (P2) et à l'espace agences (P3).
 * Câble les vues sur l'API réelle NestJS (/api/v1) — plus aucune donnée mock.
 */

/** Demande telle que renvoyée par DemandesService.toResponse() (backend). */
export interface DemandeApi {
  id: string
  reference: string
  statutCode: string
  baseJuridiqueVersionId: string | null
  contribuableId: string
  contribuable: { id: string; raisonSociale: string; nif: string } | null
  instructeurId: string | null
  instructeur: { id: string; nom: string; prenom: string } | null
  montantFcfa: string
  secteur: string | null
  dateDepot: string | null
  dateEcheance: string | null
  motifRejet: string | null
  estUrgente: boolean
  createdAt: string
  updatedAt: string
}

/** Pièce jointe telle que renvoyée par PiecesJointesService.listerParDemande(). */
export interface PieceJointeApi {
  id: string
  nomFichier: string
  typeMime: string
  tailleOctets: number
  hashSha256: string
  rangCode: string
  categorie: string | null
  estValide: boolean | null
  createdAt: string
}

/** Étape d'instance de workflow (demandeWorkflowEtapes). */
export interface WorkflowEtapeApi {
  id: string
  ordre?: number
  libelle?: string | null
  acteurRole?: string | null
  statutCode: string
  commentaire?: string | null
}

export interface WorkflowInstanceApi {
  id: string
  demandeId?: string
  statutCode?: string
  demandeWorkflowEtapes: WorkflowEtapeApi[]
}

/** Convention telle que renvoyée par ConventionsService.lister() (tableau brut Prisma). */
export interface ConventionApi {
  id: string
  reference: string
  regimeCode: string
  statutCode: string
  dateDebut: string
  dateFin: string
  montantEstime: string | number | null
  emploisEngages: number | null
  emploisCrees: number | null
  objet?: string | null
  contribuables?: { id: string; raisonSociale: string; nif: string } | null
}

// ---------------------------------------------------------------- Demandes

export async function listerDemandes(params: { statutCode?: string; search?: string; limit?: number } = {}): Promise<DemandeApi[]> {
  const qs = new URLSearchParams()
  if (params.statutCode) qs.set('statutCode', params.statutCode)
  if (params.search) qs.set('search', params.search)
  qs.set('limit', String(params.limit ?? 50))
  const res = await api<{ data: DemandeApi[] }>(`/demandes?${qs.toString()}`)
  return res.data
}

export function detailDemande(id: string): Promise<DemandeApi> {
  return api<DemandeApi>(`/demandes/${id}`)
}

export function prendreEnCharge(id: string): Promise<DemandeApi> {
  return api<DemandeApi>(`/demandes/${id}/prendre-en-charge`, { method: 'POST' })
}

export function demanderComplement(id: string, message: string): Promise<DemandeApi> {
  return api<DemandeApi>(`/demandes/${id}/demander-complement`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  })
}

export function rejeterDemande(id: string, motifRejet: string, pin: string): Promise<DemandeApi> {
  return api<DemandeApi>(`/demandes/${id}/rejeter`, {
    method: 'POST',
    body: JSON.stringify({ motifRejet, pin }),
  })
}

// -------------------------------------------------------- Pièces jointes

export function listerPiecesJointes(demandeId: string): Promise<PieceJointeApi[]> {
  return api<PieceJointeApi[]>(`/demandes/${demandeId}/pieces-jointes`)
}

// ------------------------------------------------------------ Workflow

/**
 * Retourne les étapes de l'instance de workflow du dossier.
 * Renvoie [] si aucune instance n'a été démarrée (404 INSTANCE_INEXISTANTE).
 */
export async function listerEtapes(demandeId: string): Promise<WorkflowEtapeApi[]> {
  try {
    const instance = await api<WorkflowInstanceApi>(`/workflow/demandes/${demandeId}/etapes`)
    return instance.demandeWorkflowEtapes ?? []
  } catch {
    return []
  }
}

export function validerEtape(etapeId: string, pin: string, commentaire?: string): Promise<WorkflowEtapeApi> {
  return api<WorkflowEtapeApi>(`/workflow/etapes/${etapeId}/valider`, {
    method: 'POST',
    body: JSON.stringify(commentaire ? { pin, commentaire } : { pin }),
  })
}

/** Étape en attente de validation (en_cours prioritaire, sinon en_attente). */
export function etapeAValider(etapes: WorkflowEtapeApi[], role?: string): WorkflowEtapeApi | undefined {
  const actives = etapes.filter((e) => e.statutCode === 'en_cours' || e.statutCode === 'en_attente')
  return (
    actives.find((e) => e.statutCode === 'en_cours' && (!role || !e.acteurRole || e.acteurRole === role)) ??
    actives.find((e) => !role || !e.acteurRole || e.acteurRole === role) ??
    actives[0]
  )
}

// ---------------------------------------------------------------- Auth

/** Vérifie le PIN de signature auprès du backend (répond toujours 200 {valid}). */
export async function verifierPin(pin: string): Promise<boolean> {
  const res = await api<{ valid: boolean }>('/auth/verify-pin', {
    method: 'POST',
    body: JSON.stringify({ pin }),
  })
  return res.valid === true
}

// ---------------------------------------------------------- Conventions

/** GET /conventions renvoie un tableau brut (ou {data} selon les versions) — on normalise. */
export async function listerConventionsReelles(): Promise<ConventionApi[]> {
  const res = await api<ConventionApi[] | { data: ConventionApi[] }>('/conventions')
  return Array.isArray(res) ? res : (res.data ?? [])
}

// ---------------------------------------------------------- Permis miniers

export interface PermisMinierApi {
  id: string
  reference: string
  contribuableId: string
  conventionId: string | null
  typePermis: 'recherche' | 'exploitation' | 'carriere'
  substance: string
  dateDemande: string
  dateOctroi: string
  dureeAnnees: number
  superficieKm2: string | number | null
  localite: string | null
  longitude: string | number | null
  latitude: string | number | null
  rapportEiePublic: boolean
  lienRapportEie: string | null
  modeOctroi: string
  statut: string
  contribuables?: { id: string; raisonSociale: string; nif: string } | null
  conventions?: { id: string; reference: string } | null
}

export async function listerPermisMiniers(params: { typePermis?: string; statut?: string } = {}): Promise<PermisMinierApi[]> {
  const qs = new URLSearchParams()
  if (params.typePermis) qs.set('typePermis', params.typePermis)
  if (params.statut) qs.set('statut', params.statut)
  const suffixe = qs.size ? `?${qs.toString()}` : ''
  const res = await api<PermisMinierApi[] | { data: PermisMinierApi[] }>(`/permis-miniers${suffixe}`)
  return Array.isArray(res) ? res : (res.data ?? [])
}

// ---------------------------------------------------------- Flux financiers extractifs

export interface ProductionApi {
  id: string
  annee: number
  mois: number
  substance: string
  volumeProduitT: string | number | null
  volumeVenduT: string | number | null
  volumeTraiteT: string | number | null
  valeurMarchandeFcfa: string | number | null
  valeurMarchandeUsd: string | number | null
  chiffreAffairesFcfa: string | number | null
  contribuables?: { id: string; raisonSociale: string; nif: string } | null
  permisMiniers?: { id: string; reference: string } | null
}

export interface ExportationApi {
  id: string
  annee: number
  mois: number
  substance: string
  volumeT: string | number | null
  valeurFcfa: string | number | null
  valeurUsd: string | number | null
  destination: string | null
  contribuables?: { id: string; raisonSociale: string; nif: string } | null
}

export interface RedevanceApi {
  id: string
  annee: number
  trimestre: number
  substance: string
  baseAssietteFcfa: string | number | null
  taux: string | number | null
  montantDuFcfa: string | number | null
  montantPayeFcfa: string | number | null
  datePaiement: string | null
  referencePaiement: string | null
  contribuables?: { id: string; raisonSociale: string; nif: string } | null
}

export interface TransfertCommuneApi {
  id: string
  annee: number
  commune: string
  chiffreAffairesAnnuelFcfa: string | number | null
  montantDuFcfa: string | number | null
  montantEncaisseFcfa: string | number | null
  dateEncaissement: string | null
  contribuables?: { id: string; raisonSociale: string; nif: string } | null
}

async function listerFlux<T>(chemin: string, annee?: number): Promise<T[]> {
  const suffixe = annee ? `?annee=${annee}` : ''
  const res = await api<T[] | { data: T[] }>(`/flux-extractifs/${chemin}${suffixe}`)
  return Array.isArray(res) ? res : (res.data ?? [])
}

export const listerProductions = (annee?: number) => listerFlux<ProductionApi>('productions', annee)
export const listerExportations = (annee?: number) => listerFlux<ExportationApi>('exportations', annee)
export const listerRedevances = (annee?: number) => listerFlux<RedevanceApi>('redevances', annee)
export const listerTransfertsCommunes = (annee?: number) => listerFlux<TransfertCommuneApi>('transferts-communes', annee)
