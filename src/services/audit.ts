import { api } from './api'

/**
 * Service dédié au module Audit & Contrôle (profil P5 — auditeur).
 * Branché sur le backend réel :
 *   - GET  /anomalies                 (moteur de règles)
 *   - PATCH /anomalies/:id/traiter    (changement de statut d'une anomalie)
 *   - GET  /audit-logs                (journal inaltérable, paginé)
 *   - POST /audit-logs/verify-chain   (vérification de la chaîne SHA-256)
 */

export interface AnomalieAudit {
  id: string
  categorieCode: string
  graviteCode: string
  description: string
  demandeId: string | null
  dateDetection: string
  statutCode: string
  detecteeParCode?: string | null
  commentaire?: string | null
  dateResolution?: string | null
  demandes?: { id: string; reference: string } | null
}

export interface AuditLogEntry {
  id: string
  horodatage: string
  utilisateurId: string | null
  roleAuMoment: string | null
  institution: string | null
  action: string
  entite: string
  entiteId: string
  demandeId: string | null
  ancienneValeur: unknown
  nouvelleValeur: unknown
  ip: string | null
  hashPrecedent: string | null
  empreinteSha256: string | null
}

export interface AuditLogsPage {
  items: AuditLogEntry[]
  total: number
  page: number
  limit: number
}

export interface VerificationChaine {
  verified: number
  breaks: string[]
}

export interface FiltresAnomalies {
  categorieCode?: string
  graviteCode?: string
  statutCode?: string
}

/** Liste les anomalies détectées par le moteur de règles (tableau brut). */
export async function listerAnomalies(filtres: FiltresAnomalies = {}): Promise<AnomalieAudit[]> {
  const params = new URLSearchParams()
  if (filtres.categorieCode) params.set('categorieCode', filtres.categorieCode)
  if (filtres.graviteCode) params.set('graviteCode', filtres.graviteCode)
  if (filtres.statutCode) params.set('statutCode', filtres.statutCode)
  const qs = params.toString()
  return api<AnomalieAudit[]>(`/anomalies${qs ? `?${qs}` : ''}`)
}

/** Change le statut d'une anomalie (ex: nouvelle → en_cours). */
export function traiterAnomalie(
  id: string,
  statut: 'en_cours' | 'resolue' | 'rejetee' | 'escaladee',
  commentaire?: string,
): Promise<AnomalieAudit> {
  return api<AnomalieAudit>(`/anomalies/${id}/traiter`, {
    method: 'PATCH',
    body: JSON.stringify({ statut, ...(commentaire ? { commentaire } : {}) }),
  })
}

export interface FiltresAuditLogs {
  page?: number
  limit?: number
  action?: string
  utilisateurId?: string
  entite?: string
}

/** Journal d'audit paginé (lecture seule). */
export async function listerAuditLogs(filtres: FiltresAuditLogs = {}): Promise<AuditLogsPage> {
  const params = new URLSearchParams()
  if (filtres.page) params.set('page', String(filtres.page))
  if (filtres.limit) params.set('limit', String(filtres.limit))
  if (filtres.action) params.set('action', filtres.action)
  if (filtres.utilisateurId) params.set('utilisateurId', filtres.utilisateurId)
  if (filtres.entite) params.set('entite', filtres.entite)
  const qs = params.toString()
  return api<AuditLogsPage>(`/audit-logs${qs ? `?${qs}` : ''}`)
}

/** Vérifie l'intégrité de la chaîne de hachage SHA-256 du journal. */
export function verifierChaineAudit(): Promise<VerificationChaine> {
  return api<VerificationChaine>('/audit-logs/verify-chain', { method: 'POST' })
}
