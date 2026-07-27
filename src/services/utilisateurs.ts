import { api } from './api'

export interface Utilisateur {
  id: string
  nom: string
  prenom: string
  email: string
  role: string
  statutCode?: string
  statut?: string
  institutionId?: string
  institution?: { id: string; code: string; nom: string } | null
  derniereConnexion?: string
  structure?: string
}

export function listerUtilisateurs(): Promise<{ data: Utilisateur[] }> {
  return api<{ data: Utilisateur[] }>('/utilisateurs')
}

// NB : contrairement à GET /utilisateurs (liste paginée { data, meta }),
// POST /utilisateurs retourne l'utilisateur créé directement (sans enveloppe).
export function creerUtilisateur(dto: Partial<Utilisateur>): Promise<Utilisateur> {
  return api<Utilisateur>('/utilisateurs', {
    method: 'POST',
    body: JSON.stringify(dto),
  })
}
