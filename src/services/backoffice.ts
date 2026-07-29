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
