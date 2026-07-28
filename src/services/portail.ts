import { api } from './api'
import { useAuthStore } from '../stores/auth'

/**
 * Service dédié au PORTAIL BÉNÉFICIAIRE (P1 — contribuable).
 * Regroupe les appels API réels utilisés par les vues src/views/portail/*.
 * Ne modifie pas les services partagés (demandes.ts, etc.) utilisés par le backoffice.
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1'

// ── Types API ────────────────────────────────────────────────────────────────

export interface ApiDemande {
  id: string
  reference: string
  statutCode: string
  baseJuridiqueVersionId: string
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

export interface ApiPieceJointe {
  id: string
  nomFichier: string
  typeMime: string
  tailleOctets: number
  hashSha256: string
  rangCode: 'premier' | 'second'
  categorie: string
  estValide: boolean | null
  createdAt: string
}

export interface ApiWorkflowEtape {
  id: string
  ordre: number
  libelle?: string
  statutCode?: string
  dateValidation?: string | null
  utilisateurs?: { id: string; nom: string; prenom: string } | null
}

export interface ApiContribuableMe {
  id: string
  raisonSociale: string
  nif: string
  rccm: string | null
  typeContribuableCode: string
  statutFiscalCode: string
  secteur: string | null
  region: string | null
  emailContact: string | null
  telephone: string | null
  adresse: string | null
  profilCompletude: number
  typeContribuable?: { code: string; libelle: string } | null
  statutFiscal?: { code: string; libelle: string } | null
  utilisateurs?: { email: string; nom: string; prenom: string } | null
}

export interface ApiBaseJuridiqueVersion {
  id: string
  libelle: string
  impotConcerne: string | null
  organeGestionCode: string | null
  estActive: boolean
  typeTexte1?: string | null
  natureMesureCode?: string | null
  dateAdoption?: string | null
  dateAbrogation?: string | null
  basesJuridiques?: { id: string; codeMesure: string } | null
}

export interface CreerDemandePayload {
  baseJuridiqueVersionId: string
  contribuableId: string
  montantFcfa: number
  secteur?: string
  dateEcheance?: string
  estUrgente?: boolean
}

// ── Demandes ─────────────────────────────────────────────────────────────────

export async function listerMesDemandes(statutCode?: string): Promise<ApiDemande[]> {
  const qs = new URLSearchParams({ limit: '100' })
  if (statutCode) qs.set('statutCode', statutCode)
  const res = await api<{ data: ApiDemande[] }>(`/demandes?${qs.toString()}`)
  return res.data
}

export function getDemande(id: string): Promise<ApiDemande> {
  return api<ApiDemande>(`/demandes/${id}`)
}

export function creerDemande(payload: CreerDemandePayload): Promise<ApiDemande> {
  return api<ApiDemande>('/demandes', { method: 'POST', body: JSON.stringify(payload) })
}

export function soumettreDemande(id: string): Promise<ApiDemande> {
  return api<ApiDemande>(`/demandes/${id}/soumettre`, { method: 'POST' })
}

export function completerDemande(id: string, commentaire?: string): Promise<ApiDemande> {
  return api<ApiDemande>(`/demandes/${id}/completer`, {
    method: 'POST',
    body: JSON.stringify({ commentaire: commentaire || undefined }),
  })
}

// ── Workflow ─────────────────────────────────────────────────────────────────

/** Retourne les étapes du workflow, ou [] si aucune instance n'existe (404 INSTANCE_INEXISTANTE). */
export async function listerEtapesWorkflow(demandeId: string): Promise<ApiWorkflowEtape[]> {
  try {
    const instance = await api<{ demandeWorkflowEtapes?: ApiWorkflowEtape[] }>(
      `/workflow/demandes/${demandeId}/etapes`,
    )
    return instance.demandeWorkflowEtapes ?? []
  } catch {
    return []
  }
}

// ── Pièces jointes ───────────────────────────────────────────────────────────

export function listerPiecesJointes(demandeId: string): Promise<ApiPieceJointe[]> {
  return api<ApiPieceJointe[]>(`/demandes/${demandeId}/pieces-jointes`)
}

/** Upload multipart réel (FormData) — ne passe pas par le helper JSON `api()`. */
export async function uploadPieceJointe(
  demandeId: string,
  file: File,
  rangCode: 'premier' | 'second' = 'premier',
  categorie = 'document',
): Promise<ApiPieceJointe> {
  const auth = useAuthStore()
  const form = new FormData()
  form.append('file', file)
  form.append('rangCode', rangCode)
  form.append('categorie', categorie)

  const res = await fetch(`${API_BASE}/demandes/${demandeId}/pieces-jointes`, {
    method: 'POST',
    headers: auth.token ? { Authorization: `Bearer ${auth.token}` } : {},
    body: form,
  })
  if (res.status === 401) {
    auth.clearSession()
    window.location.href = '/login'
    throw new Error('Session expirée')
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    const msg = Array.isArray(err.message) ? err.message.join(', ') : err.message
    throw new Error(msg || `Échec de l'upload (${res.status})`)
  }
  return res.json() as Promise<ApiPieceJointe>
}

// ── Attestations ─────────────────────────────────────────────────────────────

/**
 * Télécharge l'attestation d'une demande approuvée et déclenche le
 * téléchargement navigateur avec le nom de fichier fourni par le serveur.
 */
export async function telechargerAttestation(demandeId: string): Promise<void> {
  const auth = useAuthStore()
  const res = await fetch(`${API_BASE}/attestations/demandes/${demandeId}/download`, {
    headers: auth.token ? { Authorization: `Bearer ${auth.token}` } : {},
  })
  if (res.status === 401) {
    auth.clearSession()
    window.location.href = '/login'
    throw new Error('Session expirée')
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(err.message || `Attestation indisponible (${res.status})`)
  }
  const disposition = res.headers.get('Content-Disposition') || ''
  const match = /filename\*?=(?:UTF-8''|")?([^";]+)/i.exec(disposition)
  const filename = match ? decodeURIComponent(match[1].replace(/"$/, '')) : `attestation_${demandeId}.pdf`
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

// ── Export des demandes (US-P1-11) ───────────────────────────────────────────

/** Télécharge l'export CSV/XLSX généré côté serveur (GET /demandes/export/mes-demandes). */
export async function exporterMesDemandes(format: 'csv' | 'xlsx'): Promise<void> {
  const auth = useAuthStore()
  const res = await fetch(`${API_BASE}/demandes/export/mes-demandes?format=${format}`, {
    headers: auth.token ? { Authorization: `Bearer ${auth.token}` } : {},
  })
  if (res.status === 401) {
    auth.clearSession()
    window.location.href = '/login'
    throw new Error('Session expirée')
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(err.message || `Export indisponible (${res.status})`)
  }
  const disposition = res.headers.get('Content-Disposition') || ''
  const match = /filename\*?=(?:UTF-8''|")?([^";]+)/i.exec(disposition)
  const filename = match ? decodeURIComponent(match[1].replace(/"$/, '')) : `oase_demandes.${format}`
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

// ── Contribuable ─────────────────────────────────────────────────────────────

export async function getContribuableMe(): Promise<ApiContribuableMe> {
  const res = await api<{ data: ApiContribuableMe }>('/contribuables/me')
  return res.data
}

export function updateContribuableMe(payload: {
  emailContact?: string
  telephone?: string
  adresse?: string
  secteur?: string
  region?: string
}): Promise<{ data: { updated: boolean } }> {
  return api<{ data: { updated: boolean } }>('/contribuables/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

// ── Utilisateur connecté ─────────────────────────────────────────────────────

export interface ApiUtilisateurMe {
  id: string
  email: string
  nom: string
  prenom: string
  role: string
  derniereConnexion: string | null
}

export function getUtilisateurMe(): Promise<ApiUtilisateurMe> {
  return api<ApiUtilisateurMe>('/utilisateurs/me')
}

// ── Bases juridiques ─────────────────────────────────────────────────────────

export async function listerBasesJuridiques(): Promise<ApiBaseJuridiqueVersion[]> {
  const res = await api<{ items: ApiBaseJuridiqueVersion[] }>('/bases-juridiques?limit=200')
  return res.items ?? []
}
