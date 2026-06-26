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
  derniereConnexion?: string
  structure?: string
}

export function listerUtilisateurs(): Promise<{ data: Utilisateur[] }> {
  return api<{ data: Utilisateur[] }>('/utilisateurs')
}

export function creerUtilisateur(dto: Partial<Utilisateur>): Promise<{ data: Utilisateur }> {
  return api<{ data: Utilisateur }>('/utilisateurs', {
    method: 'POST',
    body: JSON.stringify(dto),
  })
}
