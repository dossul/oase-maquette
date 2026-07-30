import { api } from './api'

export type StatutRapprochement = 'reconcile' | 'en_ecart' | 'a_justifier'

export interface LigneRapprochement {
  id: string
  reference: string
  contribuable: string
  nif: string
  flux: string
  systeme: string
  statut: StatutRapprochement
  impact: 'Budgetaire' | 'Documentaire'
  montantDemande: number
  montantAtteste: number
  ecart: number
  dateDecision: string | null
  justification: string
}

export interface KpisRapprochement {
  total: number
  reconciles: number
  enEcart: number
  aJustifier: number
  montantEcarts: number
}

/** GET /rapprochements — rapprochement réel demandes approuvées ↔ attestations. */
export function listerRapprochements(): Promise<{ data: LigneRapprochement[]; kpis: KpisRapprochement }> {
  return api<{ data: LigneRapprochement[]; kpis: KpisRapprochement }>('/rapprochements')
}
