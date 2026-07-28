import { api } from './api'

/** Rapport généré côté backend (GET /rapports). */
export interface RapportApi {
  id: string
  typeRapportCode: string
  periodeAnnee: number | null
  periodeMois: number | null
  parametres: Record<string, unknown> | null
  /** URL du fichier (souvent une data URI) — téléchargeable quand statutCode === 'completed'. */
  fichierUrl: string | null
  hashFichier: string | null
  estProgramme: boolean
  dateDebut: string | null
  dateFin: string | null
  statutCode: string
  messageErreur: string | null
  createdAt: string
}

export function listerRapports(): Promise<RapportApi[]> {
  return api<RapportApi[]>('/rapports')
}

/** Entrée du jeu open data (GET /rapports/opendata, PUBLIC) : mesure publiable + agrégats financiers réels. */
export interface MesureOpenData {
  codeMesure: string
  version: {
    baseJuridiqueId: string
    libelle: string
    impotConcerne: string | null
    dateAdoption: string | null
    dateAbrogation: string | null
  } | null
  agregats: {
    nombreDemandesApprouvees: number
    montantTotalAccorde: string
    montantParAnnee: { annee: number; montant: string }[]
  }
}

export function listerMesuresOpenData(): Promise<MesureOpenData[]> {
  return api<MesureOpenData[]>('/rapports/opendata')
}

/** Montant FCFA compacté pour affichage public (ex: « 4,2 Mds FCFA », « 860 M FCFA »). */
export function formatMontantCompact(montant: string | number): string {
  const n = Number(montant)
  if (!Number.isFinite(n)) return '—'
  if (Math.abs(n) >= 1e9) return `${(n / 1e9).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Mds FCFA`
  if (Math.abs(n) >= 1e6) return `${Math.round(n / 1e6).toLocaleString('fr-FR')} M FCFA`
  return `${new Intl.NumberFormat('fr-FR').format(n)} FCFA`
}

/** Libellés d'affichage des types de rapport (codes backend). */
export const TYPE_RAPPORT_LABELS: Record<string, string> = {
  executif: 'Rapport exécutif',
  annuel: 'Rapport annuel',
  trimestriel: 'Bulletin trimestriel',
  methodologique: 'Note méthodologique',
  audit: "Rapport d'audit",
}

export function labelTypeRapport(code: string): string {
  return TYPE_RAPPORT_LABELS[code] ?? code
}

/** Taille lisible d'une data URI (ex: fichierUrl embarqué en base64). */
export function tailleDataUri(uri: string | null): string | null {
  if (!uri) return null
  const base64 = uri.includes('base64,') ? uri.split('base64,')[1] : null
  const bytes = base64 ? Math.floor((base64.length * 3) / 4) : uri.length
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} Mo`
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} Ko`
  return `${bytes} o`
}
