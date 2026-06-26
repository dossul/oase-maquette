import { api } from './api'

export interface KpiP4 {
  totalDemandes: number
  demandesParStatut: { statutCode: string; _count: number }[]
  evolutionTraitees: { date: string; _count: number }[]
}

export interface KpiP5 {
  totalAccorde: number
  parImpot: { impotConcerne: string; _sum: { montantExonerationAccorde: number } }[]
  nombreBeneficiaires: number
}

export function getKpisP4(): Promise<{ data: KpiP4 }> {
  return api<{ data: KpiP4 }>('/dashboards/p4')
}

export function getKpisP5(): Promise<{ data: KpiP5 }> {
  return api<{ data: KpiP5 }>('/dashboards/p5')
}
