/**
 * Référentiel OASE — données normatives extraites du Rapport_Diagnostic MRD 2024
 * Sources : Tableaux 5–12 (Rapport_Diagnostic, §1.1.2, §1.2.x, §2.1)
 */

// ── Tableau 6 : 8 familles de bases juridiques ─────────────────────────────
export const FAMILLES_BASE_JURIDIQUE = [
  { code: 'ACC_SIEGE', label: 'Accord de siège',                     ref: 'Accord ONU–Togo 25 mai 1968 + autres' },
  { code: 'CDN',       label: 'Code des Douanes (national/CEDEAO)', ref: 'Loi n°2018-007 + Acte add. A/SA.2/12/17' },
  { code: 'CGI',       label: 'Code Général des Impôts',            ref: 'Loi n°2018-024' },
  { code: 'CI',        label: 'Code des Investissements',            ref: 'Loi n°2019-005' },
  { code: 'CM',        label: 'Code Minier',                         ref: 'Loi n°96-004 + Règl. UEMOA 18/2003' },
  { code: 'LFI',       label: 'Loi de finances / loi spéciale',      ref: 'LFI 2004–2026 + lois sectorielles' },
  { code: 'ZF',        label: 'Régime Zone Franche',                 ref: 'Loi n°2011-018 + Loi n°2022-021' },
  { code: 'INFRA_LEG', label: 'Texte infra-législatif',              ref: 'Décrets, arrêtés, notes de service' },
] as const

export type FamilleBaseJuridiqueCode = typeof FAMILLES_BASE_JURIDIQUE[number]['code']

// ── Tableau 7 : 8 types d'actes ────────────────────────────────────────────
export const TYPES_ACTE = [
  'Accord de siège',
  "Accord d'établissement",
  'Arrêté',
  'Convention particulière',
  'Décret',
  'Loi',
  'Note de service',
  'Texte communautaire (UEMOA / CEDEAO)',
] as const

export type TypeActe = typeof TYPES_ACTE[number]

// ── Tableau 9 : 6 natures de mesure ───────────────────────────────────────
export const NATURES_MESURE = [
  'Abattement',
  "Crédit d'impôt",
  'Exemption',
  'Exonération',
  "Réduction d'impôt",
  'Taux réduit',
] as const

// ── Tableau 11 : 7 types de bénéficiaires ─────────────────────────────────
export const TYPES_BENEFICIAIRE = [
  'Coopérative',
  'Entreprise',
  'Ménages',
  'ONG / Association',
  'Organisation internationale',
  'Personne physique',
  'État (administration)',
] as const

// ── Tableau 8 : impôts concernés (extrait) ─────────────────────────────────
export const IMPOTS_CONCERNES = [
  'ADA',
  'Autres',
  'DAPP',
  'DD (Droits de douane)',
  "Droits d'enregistrement / timbre",
  'IRPP',
  'IS',
  'Patente',
  'PNS',
  'RS (Retenue à la source)',
  'TAF',
  'Taxe foncière',
  'TCA',
  'TPI',
  'TSR',
  'TVA',
  'TVM',
] as const

// ── §1.1.2.3 : Types d'opération CI — détermine les pièces complémentaires ─
export const TYPES_OPERATION_CI = [
  { code: 'enregistrement', label: "Droits d'enregistrement (acte notarié / contrat requis)" },
  { code: 'carburant',      label: 'Exonération de carburant (état modèle A requis)' },
  { code: 'taf',            label: 'Exonération TAF (relevés bancaires requis)' },
  { code: 'general',        label: 'Opération générale (factures commerciales — fiche 34)' },
] as const

export type TypeOperationCI = typeof TYPES_OPERATION_CI[number]['code']
