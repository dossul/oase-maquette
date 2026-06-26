import { api } from './api'

export interface Anomalie {
  id: string
  reference?: string
  graviteCode?: string
  gravite?: string
  categorieCode?: string
  categorie?: string
  description?: string
  statutCode?: string
  statut?: string
  demandeId?: string
}

export function listerAnomalies(): Promise<{ data: Anomalie[] }> {
  return api<{ data: Anomalie[] }>('/anomalies')
}
