import { api } from './api'

/**
 * Service dédié à l'administration système (P7).
 *
 * ⚠ Il n'existe PAS d'endpoint GET /institutions dans l'API v1
 * (vérifié via Swagger http://localhost:3001/api/docs) : la liste des
 * institutions est déduite de la relation `institution` embarquée dans
 * chaque utilisateur retourné par GET /utilisateurs.
 */

export interface Institution {
  id: string
  code: string
  nom: string
}

interface UtilisateurAvecInstitution {
  institution?: Institution | null
}

interface ListeUtilisateursResponse {
  data: UtilisateurAvecInstitution[]
  meta?: { total: number }
}

/** Institutions de secours (miroir du seed OASE) si la déduction API est vide. */
const INSTITUTIONS_FALLBACK: Institution[] = [
  { id: '10000000-0000-0000-0000-000000000001', code: 'OTR-CI', nom: 'Office Togolais des Recettes — Centre des Impôts' },
  { id: '10000000-0000-0000-0000-000000000002', code: 'OTR-CDDI', nom: 'OTR — Centre des Douanes et du Droit Indirect' },
  { id: '10000000-0000-0000-0000-000000000003', code: 'DGBF', nom: 'Direction Générale du Budget et des Finances' },
  { id: '10000000-0000-0000-0000-000000000004', code: 'DGTCP', nom: 'Direction Générale du Trésor et de la Comptabilité Publique' },
  { id: '10000000-0000-0000-0000-000000000005', code: 'API', nom: 'Agence de Promotion des Investissements' },
  { id: '10000000-0000-0000-0000-000000000006', code: 'UPF', nom: 'Unité de Politique Fiscale' },
  { id: '10000000-0000-0000-0000-000000000007', code: 'IGF', nom: 'Inspection Générale des Finances' },
  { id: '10000000-0000-0000-0000-000000000008', code: 'MAE', nom: "Ministère des Affaires Étrangères" },
  { id: '10000000-0000-0000-0000-000000000009', code: 'DGMG', nom: 'Direction Générale des Mines et de la Géologie' },
  { id: '10000000-0000-0000-0000-000000000010', code: 'DSI', nom: "Direction des Systèmes d'Information" },
]

/**
 * Retourne la liste des institutions réelles (id + code + nom).
 * Déduite de GET /utilisateurs (relation institution incluse côté backend).
 */
export async function listerInstitutions(): Promise<Institution[]> {
  try {
    const res = await api<ListeUtilisateursResponse>('/utilisateurs?limit=500')
    const map = new Map<string, Institution>()
    for (const u of res.data) {
      if (u.institution?.id) map.set(u.institution.id, u.institution)
    }
    const institutions = [...map.values()]
    if (institutions.length) {
      return institutions.sort((a, b) => a.code.localeCompare(b.code))
    }
  } catch {
    // repli sur la liste de secours ci-dessous
  }
  return INSTITUTIONS_FALLBACK
}

/** Erreur métier : tentative de désactivation/rétrogradation du dernier admin actif. */
export const CODE_DERNIER_ADMIN = 'DERNIER_ADMIN'

function estDernierAdmin(e: unknown): boolean {
  return e instanceof Error && /DERNIER_ADMIN|dernier administrateur/i.test(e.message)
}

/**
 * Active / désactive un compte via PATCH /utilisateurs/:id (champ statutCode).
 * En cas de 409 DERNIER_ADMIN, lève une Error dont le message commence par 'DERNIER_ADMIN'.
 */
export async function modifierStatutUtilisateur(id: string, statutCode: 'actif' | 'inactif'): Promise<void> {
  try {
    await api(`/utilisateurs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ statutCode }),
    })
  } catch (e) {
    if (estDernierAdmin(e)) {
      throw new Error(`${CODE_DERNIER_ADMIN}: Impossible de désactiver ou rétrograder le dernier administrateur actif de la plateforme.`)
    }
    throw e
  }
}

export interface ResetMfaResponse {
  id: string
  mfaSecret: string
  mfaQrCodeUri: string
}

/** Réinitialise le MFA TOTP → retourne le secret et l'URI otpauth (QR) à afficher. */
export function resetMfaUtilisateur(id: string): Promise<ResetMfaResponse> {
  return api<ResetMfaResponse>(`/utilisateurs/${id}/reset-mfa`, { method: 'POST' })
}

export interface ResetPinResponse {
  id: string
  reset: boolean
}

/** Réinitialise le PIN de signature de l'utilisateur. */
export function resetPinUtilisateur(id: string): Promise<ResetPinResponse> {
  return api<ResetPinResponse>(`/utilisateurs/${id}/reset-pin`, { method: 'POST' })
}

export interface WorkflowTemplateEtape {
  id: string
  nomEtape: string
  ordre: number
  acteurRole: string
  delaiCibleJours?: number | null
}

export interface WorkflowTemplate {
  id: string
  code: string
  nom: string
  description?: string | null
  estActif: boolean
  workflowTemplateEtapes?: WorkflowTemplateEtape[]
}

/**
 * Charge les templates de workflow réels (GET /workflow/templates).
 * NB : l'API ne propose AUCUN endpoint de mise à jour (PUT/PATCH) d'un
 * template existant — seule la création (POST) existe. La sauvegarde
 * depuis l'éditeur reste donc locale (cf. WorkflowView).
 */
export function listerWorkflowTemplates(): Promise<WorkflowTemplate[]> {
  return api<WorkflowTemplate[]>('/workflow/templates')
}
