import { api } from './api'

export interface Demande {
  id: string
  reference: string
  statutCode: string
  montantFcfa: bigint
  secteur: string | null
  dateDepot: Date | null
  etapeActuelle: string | null
  type: string
}

export function listerDemandes(): Promise<{ data: Demande[] }> {
  return api<{ data: Demande[] }>('/demandes')
}
