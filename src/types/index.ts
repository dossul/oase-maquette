/**
 * Statuts CANONIQUES des demandes, alignés sur l'API (enum StatutDemande du backend :
 * brouillon, soumis, en_instruction, action_requise, approuve, rejete, expire, archive).
 * 'en_cours' est conservé comme alias LEGACY (encore utilisé par les mocks et
 * quelques vues métier en attente de câblage API).
 */
export type StatutDemande =
  | 'brouillon'
  | 'soumis'
  | 'en_instruction'
  | 'action_requise'
  | 'approuve'
  | 'rejete'
  | 'expire'
  | 'archive'
  // Alias legacy (à ne plus utiliser dans du nouveau code)
  | 'en_cours'
export type ExoType = 'douaniere' | 'fiscale_is' | 'fiscale_tva' | 'zone_franche' | 'code_investissement' | 'sectorielle'
/**
 * Rôles CANONIQUES renvoyés par le backend (JWT + réponse /auth/login).
 * Les 5 derniers sont des alias LEGACY encore présents dans les mocks :
 * agent_otr → agent_ci, agence → agent_agence, admin → admin_si,
 * ministere_sectoriel → agent_ministere, agent_dsi_mef (pas d'équivalent canonique).
 */
export type Role =
  | 'contribuable'
  | 'agent_ci'
  | 'agent_cddi'
  | 'agent_dgbf'
  | 'agent_dgtcp'
  | 'agent_agence'
  | 'agent_mae'
  | 'agent_dgmg'
  | 'agent_ministere'
  | 'agent_conedef'
  | 'decideur'
  | 'auditeur'
  | 'admin_si'
  // Alias legacy
  | 'agent_otr'
  | 'agence'
  | 'admin'
  | 'ministere_sectoriel'
  | 'agent_dsi_mef'
export type ConnecteurStatut = 'actif' | 'erreur' | 'maintenance'
export type AnomalieCategorie = 'juridique' | 'financiere' | 'procedurale' | 'temporelle'
export type AnomalieGravite = 'faible' | 'moyenne' | 'elevee' | 'critique'

export const STATUT_COLORS: Record<StatutDemande, string> = {
  brouillon: 'secondary',
  soumis: 'primary',
  en_instruction: 'info',
  action_requise: 'warning',
  approuve: 'success',
  rejete: 'error',
  expire: 'default',
  archive: 'default',
  // Alias legacy
  en_cours: 'info',
}

export const STATUT_LABELS: Record<StatutDemande, string> = {
  brouillon: 'Brouillon',
  soumis: 'Soumis',
  en_instruction: 'En instruction',
  action_requise: 'Action requise',
  approuve: 'Approuvé',
  rejete: 'Rejeté',
  expire: 'Expiré',
  archive: 'Archivé',
  // Alias legacy
  en_cours: 'En cours',
}

export const EXO_TYPE_LABELS: Record<ExoType, string> = {
  douaniere: 'Exonération douanière',
  fiscale_is: 'Exonération IS',
  fiscale_tva: 'Exonération TVA',
  zone_franche: 'Régime Zone Franche',
  code_investissement: "Convention d'investissement",
  sectorielle: 'Exonération sectorielle',
}

export interface Demande {
  id: string
  reference: string
  type: ExoType
  contribuable: string
  nif: string
  rccm: string
  statut: StatutDemande
  dateDepot: string
  dateEcheance?: string
  montantFCFA: number
  quotaConsomme?: number
  quotaTotal?: number
  etapeActuelle: string
  instructeur?: string
  secteur: string
  baseJuridique: string
}

export interface KpiData {
  label: string
  value: string | number
  trend?: number
  icon: string
  color: string
  subtitle?: string
}

export interface Connecteur {
  id: string
  nom: string
  systeme: string
  statut: ConnecteurStatut
  latenceMs: number
  tauxErreur: number
  dernierSync: string
  volume24h: number
  endpoint: string
}

export interface Utilisateur {
  id: string
  nom: string
  prenom: string
  email: string
  role: Role
  structure: string
  statut: 'actif' | 'inactif'
  derniereConnexion: string
}

export interface Anomalie {
  id: string
  categorie: AnomalieCategorie
  gravite: AnomalieGravite
  description: string
  dossier: string
  dateDetection: string
  statut: 'nouvelle' | 'examinee' | 'traitee'
}

export interface Convention {
  id: string
  reference: string
  contribuable: string
  regime: string
  statut: 'active' | 'suspendue' | 'resiliee' | 'expiree'
  dateDebut: string
  dateFin: string
  montantEstime: number
  emploisEngages: number
  emploisCrees: number
}

export interface AuditLog {
  id: string
  horodatage: string
  utilisateur: string
  structure: string
  role: string
  action: string
  entite: string
  ancienneValeur?: string
  nouvelleValeur?: string
  ip: string
}

export interface NavItem {
  title: string
  icon: string
  to: string
  children?: NavItem[]
}
