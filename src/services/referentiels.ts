import { api } from './api'

/**
 * Référentiel INSEED (GET /referentiels/inseed) — paramètres macro-économiques
 * stockés en system_config (clés inseed.*). Accessible à la plupart des rôles
 * internes (decideur, agents, auditeur, admin_si) ; PUT réservé à admin_si.
 */

export interface ReferentielInseed {
  /** PIB total du Togo en milliards FCFA (année de référence). */
  pibMilliardsFcfa: number | null
  anneeReference: number | null
  /** Multiplicateurs sectoriels keynésiens (clés : industrie, agriculture, services, mines, tourisme…). */
  multiplicateursSectoriels: Record<string, number>
  metaImport: { source?: string; dateImport?: string | null; version?: string }
  /** Clés brutes renvoyées par l'API (traçabilité). */
  brut: Record<string, string>
}

function parseJson<T>(raw: string | undefined, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export async function getReferentielInseed(): Promise<ReferentielInseed> {
  const brut = await api<Record<string, string>>('/referentiels/inseed')
  const pib = Number(brut['inseed.pib_milliards_fcfa'])
  const annee = Number(brut['inseed.annee_reference'])
  return {
    pibMilliardsFcfa: Number.isFinite(pib) && pib > 0 ? pib : null,
    anneeReference: Number.isFinite(annee) && annee > 0 ? annee : null,
    multiplicateursSectoriels: parseJson(brut['inseed.multiplicateurs_sectoriels'], {}),
    metaImport: parseJson(brut['inseed.meta_import'], {}),
    brut,
  }
}
