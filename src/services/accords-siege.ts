import { api } from './api'

export interface TypeAccordSiege {
  code: string
  libelle: string
  description?: string | null
  couleur?: string | null
}

export interface AccordSiege {
  id: string
  institution: string
  typeInstitutionCode: string
  texteFondateur?: string | null
  dateSignature?: string | null
  estActif: boolean
  createdAt: string
  refTypesAccordSiege?: TypeAccordSiege
  _count?: { contribuables: number; conventions: number }
}

export interface AccordSiegeDetail extends AccordSiege {
  contribuables?: { id: string; nif: string; raisonSociale: string }[]
  conventions?: { id: string; reference: string; dateDebut: string; dateFin: string; statutCode: string }[]
}

export function listerAccordsSiege(typeInstitutionCode?: string): Promise<AccordSiege[]> {
  const q = typeInstitutionCode ? `?typeInstitutionCode=${encodeURIComponent(typeInstitutionCode)}` : ''
  return api<AccordSiege[]>(`/accords-siege${q}`)
}

export function obtenirAccordSiege(id: string): Promise<AccordSiegeDetail> {
  return api<AccordSiegeDetail>(`/accords-siege/${id}`)
}

export function creerAccordSiege(payload: {
  institution: string
  typeInstitutionCode: string
  texteFondateur?: string
  dateSignature?: string
}): Promise<AccordSiege> {
  return api<AccordSiege>('/accords-siege', { method: 'POST', body: JSON.stringify(payload) })
}

export function modifierAccordSiege(
  id: string,
  payload: Partial<{
    institution: string
    typeInstitutionCode: string
    texteFondateur: string
    dateSignature: string
    estActif: boolean
  }>,
): Promise<AccordSiege> {
  return api<AccordSiege>(`/accords-siege/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
}
