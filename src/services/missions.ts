import { api } from './api'

/**
 * Service dédié aux missions de contrôle / audit (vague B — programme « 0 mocked data »).
 * Branché sur le backend réel :
 *   - GET /missions        (rôles auditeur / agent_ci / admin_si)
 *   - GET /missions/:id
 */

export interface MissionActeur {
  id: string
  nom: string
  prenom: string
  role: string
}

export interface MissionApi {
  id: string
  reference: string
  titre: string
  type: string // audit | controle
  statut: string // planifiee | en_cours | terminee
  organe: string | null
  auditeurId: string
  demandeId: string | null
  dateDebut: string | null
  dateFin: string | null
  constats: string | null
  recommandations: string | null
  createdAt: string
  updatedAt: string
  auditeur?: MissionActeur | null
  demande?: { id: string; reference: string; statutCode: string } | null
}

/** Liste les missions (filtres serveur optionnels). */
export function listerMissions(filtres: { statut?: string; type?: string } = {}): Promise<MissionApi[]> {
  const params = new URLSearchParams()
  if (filtres.statut) params.set('statut', filtres.statut)
  if (filtres.type) params.set('type', filtres.type)
  const qs = params.toString()
  return api<MissionApi[]>(`/missions${qs ? `?${qs}` : ''}`)
}

/** Détail d'une mission (avec auditeur et demande liée). */
export function detailMission(id: string): Promise<MissionApi> {
  return api<MissionApi>(`/missions/${id}`)
}

/** Libellé français du statut backend. */
export function missionStatutLabel(statut: string): string {
  return { planifiee: 'Planifiée', en_cours: 'En cours', terminee: 'Terminée' }[statut] ?? statut
}
