import { api } from './api'

export interface Convention {
  id: string
  reference?: string
  contribuable?: string
  regime?: string
  dateFin?: string
  statut?: string
  dateSignature?: string
  echeance?: string
}

export function listerConventions(): Promise<{ data: Convention[] }> {
  return api<{ data: Convention[] }>('/conventions')
}
