/**
 * useRefParams — Données de référence économique INSEED / OIT
 * Source partagée entre SimulationView et la page d'administration.
 * En production, ces valeurs seraient chargées depuis la base OASE
 * (import CSV annuel depuis les Comptes Nationaux INSEED).
 */
import { reactive, ref } from 'vue'

export interface SecteurParam {
  secteur: string
  emploiMult: number      // emplois directs créés par Mds FCFA exonéré
  pibMult: number         // multiplicateur keynésien PIB
  beneficeMult: number    // multiplicateur bénéfice socio-économique
  pibSectorielMds: number // PIB sectoriel INSEED (Mds FCFA)
  anneeRef: number        // année de référence de la donnée
}

export const secteurParamsList = reactive<SecteurParam[]>([
  { secteur: 'Mines & Hydrocarbures', emploiMult: 800,  pibMult: 1.8, beneficeMult: 2.1, pibSectorielMds: 1850, anneeRef: 2025 },
  { secteur: 'Zone Franche',          emploiMult: 1200, pibMult: 1.5, beneficeMult: 2.8, pibSectorielMds: 620,  anneeRef: 2025 },
  { secteur: 'Agriculture',           emploiMult: 2400, pibMult: 2.0, beneficeMult: 3.2, pibSectorielMds: 920,  anneeRef: 2025 },
  { secteur: 'Énergie',               emploiMult: 650,  pibMult: 2.2, beneficeMult: 2.5, pibSectorielMds: 340,  anneeRef: 2025 },
  { secteur: 'Numérique',             emploiMult: 1500, pibMult: 2.5, beneficeMult: 3.5, pibSectorielMds: 280,  anneeRef: 2025 },
  { secteur: 'Santé',                 emploiMult: 900,  pibMult: 1.6, beneficeMult: 2.0, pibSectorielMds: 180,  anneeRef: 2025 },
])

/** PIB total Togo (Mds FCFA) — source INSEED FBCF 2025 */
export const pibTogo = ref(6000)

/** Métadonnées de la dernière mise à jour */
export const inseedMeta = reactive({
  anneeRef: 2025,
  dateImport: '2025-12-31',
  source: 'Comptes Nationaux INSEED — FBCF 2025',
  importePar: 'UPF/MEF',
})

/** Accès rapide par nom de secteur (avec fallback sur Numérique) */
export function getSecteurParam(secteur: string): SecteurParam {
  return secteurParamsList.find(s => s.secteur === secteur) ?? secteurParamsList[4]
}

/** Format d'import CSV attendu (pour affichage dans la UI) */
export const CSV_FORMAT_EXAMPLE = `secteur,pib_sectoriel_mds,emploi_mult,pib_mult,benefice_mult,annee_ref
"Mines & Hydrocarbures",1850,800,1.8,2.1,2025
"Agriculture",920,2400,2.0,3.2,2025
"Numérique",280,1500,2.5,3.5,2025`
