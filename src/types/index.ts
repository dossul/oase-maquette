export type StatutDemande = 'en_cours' | 'approuve' | 'action_requise' | 'rejete' | 'expire' | 'brouillon'
export type ExoType = 'douaniere' | 'fiscale_is' | 'fiscale_tva' | 'zone_franche' | 'code_investissement' | 'sectorielle'
export type Role =
  | 'beneficiaire'
  | 'agent_otr'
  | 'agent_dgbf'
  | 'agent_dgtcp'
  | 'agence'
  | 'decideur'
  | 'auditeur'
  | 'admin'
  | 'ministere_sectoriel'
  | 'agent_mae'
  | 'agent_dgmg'
  | 'agent_conedef'
  | 'agent_dsi_mef'
export type ConnecteurStatut = 'actif' | 'erreur' | 'maintenance'
export type AnomalieCategorie = 'juridique' | 'financiere' | 'procedurale' | 'temporelle'
export type AnomalieGravite = 'faible' | 'moyenne' | 'elevee' | 'critique'

export const STATUT_COLORS: Record<StatutDemande, string> = {
  en_cours: 'info',
  approuve: 'success',
  action_requise: 'warning',
  rejete: 'error',
  expire: 'default',
  brouillon: 'secondary',
}

export const STATUT_LABELS: Record<StatutDemande, string> = {
  en_cours: 'En cours',
  approuve: 'Approuvé',
  action_requise: 'Action requise',
  rejete: 'Rejeté',
  expire: 'Expiré',
  brouillon: 'Brouillon',
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
  beneficiaire: string
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
  beneficiaire: string
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
