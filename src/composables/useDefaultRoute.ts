import type { Role } from '../types'

/**
 * Mapping role → dashboard par défaut.
 * Utilisé par :
 *  - LoginView après un login réussi (Bug #2 fix)
 *  - router.beforeEach sur la route '/' (Bug #5 fix)
 *  - AppLayout pour le menu de la sidebar (Bug #4 fix)
 *
 * Les clés sont les rôles CANONIQUES du backend (JWT / réponse login).
 * Les alias legacy (agent_otr, agence, admin, ministere_sectoriel) sont
 * conservés pour couvrir les données mock et les anciens comptes.
 *
 * Règle : si le rôle n'est pas reconnu, on retombe sur le portail contribuable
 * (couvre le cas où un nouveau rôle est ajouté côté back mais pas encore côté front).
 */
export const DEFAULT_ROUTE_BY_ROLE: Record<Role, string> = {
  // Rôles canoniques (backend)
  contribuable: '/portail/dashboard',
  agent_ci: '/backoffice/dashboard',
  agent_cddi: '/backoffice/dashboard',
  agent_dgbf: '/backoffice/dashboard',
  agent_dgtcp: '/tresor/dashboard',
  agent_agence: '/agences/dashboard',
  agent_mae: '/mae/accords-siege',
  agent_dgmg: '/extractif/dashboard',
  agent_ministere: '/ministeres/dashboard',
  agent_conedef: '/conedef/dashboard',
  decideur: '/decideur/dashboard',
  auditeur: '/audit/dashboard',
  admin_si: '/admin/utilisateurs',
  // Alias legacy
  agent_otr: '/backoffice/dashboard',
  agence: '/agences/dashboard',
  admin: '/admin/utilisateurs',
  ministere_sectoriel: '/ministeres/dashboard',
  agent_dsi_mef: '/dsi/dashboard',
}

/**
 * Normalise un rôle (canonique ou legacy) vers son équivalent canonique.
 * Les rôles déjà canoniques (ou inconnus) sont renvoyés tels quels.
 */
const LEGACY_ROLE_ALIASES: Record<string, string> = {
  agent_otr: 'agent_ci',
  agence: 'agent_agence',
  admin: 'admin_si',
  ministere_sectoriel: 'agent_ministere',
}

export function normalizeRole(role: string | undefined | null): string {
  if (!role) return ''
  return LEGACY_ROLE_ALIASES[role] ?? role
}

/**
 * Retourne la route par défaut pour un rôle donné.
 * Si le rôle est inconnu, on retourne le portail contribuable par sécurité.
 */
export function getDefaultRouteForRole(role: string | undefined | null): string {
  if (!role) return '/portail/dashboard'
  return DEFAULT_ROUTE_BY_ROLE[role as Role] ?? '/portail/dashboard'
}

/**
 * L'admin a accès à toutes les routes de l'app (override de la meta.role).
 * C'est nécessaire pour que l'admin puisse naviguer librement dans
 * les écrans de tous les profils (vue d'ensemble, debug, support).
 * 'admin' (legacy) est traité comme 'admin_si' (canonique).
 */
export function isAdminRole(role: string | undefined | null): boolean {
  return normalizeRole(role) === 'admin_si'
}
