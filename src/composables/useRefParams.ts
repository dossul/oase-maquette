/**
 * useRefParams — Données de référence économique INSEED / OIT
 * Source partagée entre SimulationView et la page d'administration.
 *
 * Les valeurs sont chargées depuis l'API réelle GET /referentiels/inseed
 * (paramètres system_config côté backend) via chargerReferentielInseed().
 * Les valeurs ci-dessous sont des valeurs PAR DÉFAUT utilisées uniquement
 * en repli si l'API est indisponible ou si une clé n'existe pas encore.
 */
import { reactive, ref } from 'vue'
import { getReferentielInseed } from '../services/referentiels'

export interface SecteurParam {
  secteur: string
  emploiMult: number      // emplois directs créés par Mds FCFA exonéré
  pibMult: number         // multiplicateur keynésien PIB
  beneficeMult: number    // multiplicateur bénéfice socio-économique
  pibSectorielMds: number // PIB sectoriel INSEED (Mds FCFA)
  anneeRef: number        // année de référence de la donnée
}

/** Valeurs par défaut (repli hors-ligne) — écrasées par GET /referentiels/inseed. */
export const secteurParamsList = reactive<SecteurParam[]>([
  { secteur: 'Mines & Hydrocarbures', emploiMult: 800,  pibMult: 1.8, beneficeMult: 2.1, pibSectorielMds: 1850, anneeRef: 2025 },
  { secteur: 'Zone Franche',          emploiMult: 1200, pibMult: 1.5, beneficeMult: 2.8, pibSectorielMds: 620,  anneeRef: 2025 },
  { secteur: 'Agriculture',           emploiMult: 2400, pibMult: 2.0, beneficeMult: 3.2, pibSectorielMds: 920,  anneeRef: 2025 },
  { secteur: 'Énergie',               emploiMult: 650,  pibMult: 2.2, beneficeMult: 2.5, pibSectorielMds: 340,  anneeRef: 2025 },
  { secteur: 'Numérique',             emploiMult: 1500, pibMult: 2.5, beneficeMult: 3.5, pibSectorielMds: 280,  anneeRef: 2025 },
  { secteur: 'Santé',                 emploiMult: 900,  pibMult: 1.6, beneficeMult: 2.0, pibSectorielMds: 180,  anneeRef: 2025 },
])

/** PIB total Togo (Mds FCFA) — valeur par défaut, écrasée par inseed.pib_milliards_fcfa */
export const pibTogo = ref(6000)

/** Métadonnées de la dernière mise à jour (écrasées par inseed.meta_import) */
export const inseedMeta = reactive({
  anneeRef: 2025,
  dateImport: '2025-12-31',
  source: 'Comptes Nationaux INSEED — FBCF 2025',
  importePar: 'UPF/MEF',
})

/** true une fois le référentiel API chargé ; inseedError décrit le repli éventuel. */
export const inseedCharge = ref(false)
export const inseedError = ref<string | null>(null)

/**
 * Correspondance secteur maquette → clé du référentiel INSEED
 * (inseed.multiplicateurs_sectoriels : industrie, agriculture, services, mines, tourisme).
 */
const SECTEUR_VERS_CLE_INSEED: Record<string, string> = {
  'Mines & Hydrocarbures': 'mines',
  'Agriculture': 'agriculture',
  'Zone Franche': 'industrie',
  'Énergie': 'industrie',
  'Numérique': 'services',
  'Santé': 'services',
}

let chargementEnCours: Promise<boolean> | null = null

/**
 * Charge GET /referentiels/inseed et met à jour les paramètres partagés.
 * Idempotent (un seul appel en vol). Renvoie true si l'API a répondu.
 * En cas d'échec, les valeurs par défaut sont conservées (repli documenté).
 */
export function chargerReferentielInseed(): Promise<boolean> {
  if (chargementEnCours) return chargementEnCours
  chargementEnCours = (async () => {
    try {
      const ref = await getReferentielInseed()
      if (ref.pibMilliardsFcfa) pibTogo.value = ref.pibMilliardsFcfa
      for (const s of secteurParamsList) {
        const cle = SECTEUR_VERS_CLE_INSEED[s.secteur]
        const mult = cle ? ref.multiplicateursSectoriels[cle] : undefined
        if (typeof mult === 'number' && mult > 0) {
          s.pibMult = mult
          if (ref.anneeReference) s.anneeRef = ref.anneeReference
        }
      }
      if (ref.anneeReference) inseedMeta.anneeRef = ref.anneeReference
      if (ref.metaImport.source) inseedMeta.source = ref.metaImport.source
      inseedMeta.dateImport = ref.metaImport.dateImport ?? 'Jamais importé'
      inseedMeta.importePar = 'Référentiel OASE (system_config)'
      inseedCharge.value = true
      inseedError.value = null
      return true
    } catch {
      inseedCharge.value = false
      inseedError.value = 'Référentiel INSEED indisponible — valeurs par défaut utilisées'
      return false
    }
  })()
  return chargementEnCours
}

/** Accès rapide par nom de secteur (avec fallback sur Numérique) */
export function getSecteurParam(secteur: string): SecteurParam {
  return secteurParamsList.find(s => s.secteur === secteur) ?? secteurParamsList[4]
}

/** Format d'import CSV attendu (pour affichage dans la UI) */
export const CSV_FORMAT_EXAMPLE = `secteur,pib_sectoriel_mds,emploi_mult,pib_mult,benefice_mult,annee_ref
"Mines & Hydrocarbures",1850,800,1.8,2.1,2025
"Agriculture",920,2400,2.0,3.2,2025
"Numérique",280,1500,2.5,3.5,2025`
