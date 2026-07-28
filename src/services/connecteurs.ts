import { api } from './api'

/**
 * Service de supervision des connecteurs SI (SYDONIA, SIGTAS/E-TAX, SIGFiP, GUDEF, DAS).
 * Branché sur le backend réel (rôles admin_si / auditeur) :
 *   - GET /connecteurs            (liste + institution)
 *   - GET /connecteurs/status     (état agrégé temps réel : heartbeat, erreurs 24h, jobs)
 *   - GET /connecteurs/:id/logs   (journaux d'échange)
 */

export interface ConnecteurInstitution {
  id: string
  nom: string
  code: string
}

/** Connecteur tel que renvoyé par GET /connecteurs (tableau brut Prisma). */
export interface ConnecteurApi {
  id: string
  nom: string
  codeSysteme: string
  institutionId: string | null
  statutCode: string // actif | inactif | erreur | maintenance
  endpoint: string
  latenceMs: number
  tauxErreur: string | number
  dernierSync: string | null
  volume24h: number
  fallbackManuel: boolean
  timeoutS: number
  institutions?: ConnecteurInstitution | null
}

/** Entrée « status » agrégée par connecteur (GET /connecteurs/status). */
export interface ConnecteurStatusEntry {
  id: string
  nom: string
  codeSysteme: string
  institution: ConnecteurInstitution | null
  statutCode: string
  dernierHeartbeat: string | null
  latenceMs: number
  tauxErreur: string | number
  erreurs24h: number
  fallbackManuel: boolean
}

export interface ConnecteursStatusApi {
  timestamp: string
  jobsActifs: number
  connecteurs: ConnecteurStatusEntry[]
}

/** Journal d'échange d'un connecteur. */
export interface ConnecteurLogApi {
  id: string
  connecteurId: string
  direction: string
  operation: string
  statutHttp: number | null
  dureeMs: number | null
  estErreur: boolean
  messageErreur: string | null
  createdAt: string
}

/** GET /connecteurs — liste des connecteurs SI avec leur institution. */
export function listerConnecteurs(): Promise<ConnecteurApi[]> {
  return api<ConnecteurApi[]>('/connecteurs')
}

/** GET /connecteurs/status — état agrégé temps réel. */
export function getConnecteursStatus(): Promise<ConnecteursStatusApi> {
  return api<ConnecteursStatusApi>('/connecteurs/status')
}

/** GET /connecteurs/:id/logs — journaux d'échange (plus récents d'abord). */
export function listerConnecteurLogs(connecteurId: string, limit = 50): Promise<ConnecteurLogApi[]> {
  return api<ConnecteurLogApi[]>(`/connecteurs/${connecteurId}/logs?limit=${limit}`)
}
